"""Cortex AI CLI — Command-line interface for the Cortex AI platform."""

import sys
import json
import asyncio
import webbrowser
from pathlib import Path
from typing import Optional

import typer
import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

app = typer.Typer(
    name="cortex",
    help="Cortex AI — Your local-first AI command center",
    no_args_is_help=True,
    rich_markup_mode="rich",
)
console = Console()

DEFAULT_SERVER = "http://localhost:7337"


def get_server_url() -> str:
    """Get the Cortex server URL from env or default."""
    import os
    return os.environ.get("CORTEX_SERVER", DEFAULT_SERVER)


def get_client() -> httpx.Client:
    return httpx.Client(base_url=get_server_url(), timeout=60.0)


async def get_async_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=get_server_url(), timeout=120.0)


def check_server_running() -> bool:
    """Check if Cortex server is running."""
    try:
        with get_client() as client:
            resp = client.get("/health")
            return resp.status_code == 200
    except Exception:
        return False


@app.command()
def serve(
    port: int = typer.Option(7337, "--port", "-p", help="Port to listen on"),
    host: str = typer.Option("0.0.0.0", "--host", help="Host to bind to"),
    no_browser: bool = typer.Option(False, "--no-browser", help="Don't open browser automatically"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload (dev mode)"),
):
    """Start the Cortex AI server and open the web interface."""
    import uvicorn
    import os

    console.print(Panel.fit(
        "[bold cyan]Cortex AI[/bold cyan] — Your local-first AI command center\n"
        f"[dim]Starting server on http://localhost:{port}[/dim]",
        border_style="cyan",
    ))

    if not no_browser:
        # Open browser after a short delay
        import threading
        def open_browser():
            import time
            time.sleep(1.5)
            webbrowser.open(f"http://localhost:{port}")
        threading.Thread(target=open_browser, daemon=True).start()

    # Add backend to path
    backend_path = Path(__file__).parent.parent.parent / "backend"
    sys.path.insert(0, str(backend_path))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        app_dir=str(backend_path),
        log_level="info",
    )


@app.command()
def ask(
    question: str = typer.Argument(..., help="Question to ask"),
    model: str = typer.Option("", "--model", "-m", help="Model to use (default: auto-detected)"),
    raw: bool = typer.Option(False, "--raw", help="Print raw text without formatting"),
):
    """Ask a quick question and get an answer."""
    if not check_server_running():
        console.print("[red]Error:[/red] Cortex server is not running. Start it with [bold]cortex serve[/bold]")
        raise typer.Exit(1)

    # Read from stdin if available
    stdin_text = ""
    if not sys.stdin.isatty():
        stdin_text = sys.stdin.read().strip()
        if stdin_text:
            question = f"{question}\n\n{stdin_text}" if question else stdin_text

    with Progress(SpinnerColumn(), TextColumn("[cyan]Thinking..."), transient=True) as progress:
        progress.add_task("", total=None)
        try:
            with get_client() as client:
                payload = {"message": question, "stream": False}
                if model:
                    payload["model"] = model
                resp = client.post("/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                answer = data.get("content") or data.get("message", {}).get("content", "No response")
        except httpx.HTTPStatusError as e:
            console.print(f"[red]API Error:[/red] {e.response.text}")
            raise typer.Exit(1)
        except Exception as e:
            console.print(f"[red]Error:[/red] {e}")
            raise typer.Exit(1)

    if raw:
        print(answer)
    else:
        console.print(Markdown(answer))


@app.command()
def chat(
    model: str = typer.Option("", "--model", "-m", help="Model to use"),
):
    """Start an interactive chat session in the terminal."""
    if not check_server_running():
        console.print("[red]Error:[/red] Cortex server is not running. Start it with [bold]cortex serve[/bold]")
        raise typer.Exit(1)

    console.print(Panel.fit(
        "[bold cyan]Cortex AI Chat[/bold cyan]\n"
        "[dim]Type your message and press Enter. Ctrl+C to exit.[/dim]",
        border_style="cyan",
    ))

    conversation_id = None

    while True:
        try:
            user_input = console.input("[bold green]You:[/bold green] ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("/exit", "/quit", "exit", "quit"):
                console.print("[dim]Goodbye![/dim]")
                break

            with Progress(SpinnerColumn(), TextColumn("[cyan]Cortex is thinking..."), transient=True) as progress:
                progress.add_task("", total=None)
                try:
                    with get_client() as client:
                        payload = {"message": user_input, "stream": False}
                        if model:
                            payload["model"] = model
                        if conversation_id:
                            payload["conversation_id"] = conversation_id
                        resp = client.post("/api/chat", json=payload)
                        resp.raise_for_status()
                        data = resp.json()
                        answer = data.get("content") or data.get("message", {}).get("content", "No response")
                        conversation_id = data.get("conversation_id", conversation_id)
                        model_used = data.get("model", "unknown")
                except Exception as e:
                    console.print(f"[red]Error:[/red] {e}")
                    continue

            console.print(f"\n[bold blue]Cortex[/bold blue] [dim]({model_used})[/dim]:")
            console.print(Markdown(answer))
            console.print()

        except KeyboardInterrupt:
            console.print("\n[dim]Goodbye![/dim]")
            break


@app.command()
def models():
    """List available AI models."""
    if not check_server_running():
        console.print("[red]Error:[/red] Cortex server is not running. Start it with [bold]cortex serve[/bold]")
        raise typer.Exit(1)

    with get_client() as client:
        try:
            resp = client.get("/api/models")
            resp.raise_for_status()
            models_list = resp.json()
        except Exception as e:
            console.print(f"[red]Error fetching models:[/red] {e}")
            raise typer.Exit(1)

    if not models_list:
        console.print("[yellow]No models found.[/yellow] Make sure Ollama is running.")
        return

    table = Table(title="Available Models", border_style="cyan")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="bold white")
    table.add_column("Provider", style="green")
    table.add_column("Context", style="dim")

    for m in models_list:
        ctx = f"{m.get('context_length', '?')} tokens" if m.get('context_length') else "—"
        table.add_row(m["id"], m.get("name", m["id"]), m.get("provider", "ollama"), ctx)

    console.print(table)


@app.command()
def run(
    pipeline: str = typer.Argument(..., help="Pipeline name or ID"),
    input_text: Optional[str] = typer.Option(None, "--input", "-i", help="Input text for the pipeline"),
):
    """Run a saved pipeline."""
    if not check_server_running():
        console.print("[red]Error:[/red] Cortex server is not running.")
        raise typer.Exit(1)

    # Read from stdin if no explicit input
    if not input_text:
        if not sys.stdin.isatty():
            input_text = sys.stdin.read().strip()
        else:
            console.print("[red]Error:[/red] Provide input with --input or pipe via stdin")
            raise typer.Exit(1)

    with get_client() as client:
        # Find pipeline by name or ID
        try:
            resp = client.get("/api/pipelines")
            resp.raise_for_status()
            pipelines = resp.json()
        except Exception as e:
            console.print(f"[red]Error:[/red] {e}")
            raise typer.Exit(1)

        pipeline_obj = None
        for p in pipelines:
            if p["id"] == pipeline or p["name"].lower() == pipeline.lower():
                pipeline_obj = p
                break

        if not pipeline_obj:
            console.print(f"[red]Pipeline not found:[/red] {pipeline}")
            console.print("Available:", ", ".join(p["name"] for p in pipelines))
            raise typer.Exit(1)

        console.print(f"Running pipeline: [bold cyan]{pipeline_obj['name']}[/bold cyan]")

        with Progress(SpinnerColumn(), TextColumn("[cyan]Executing pipeline..."), transient=True) as progress:
            progress.add_task("", total=None)
            try:
                resp = client.post(f"/api/pipelines/{pipeline_obj['id']}/run", json={"input": input_text})
                resp.raise_for_status()
                result = resp.json()
            except Exception as e:
                console.print(f"[red]Error:[/red] {e}")
                raise typer.Exit(1)

        for i, step in enumerate(result.get("steps", []), 1):
            console.print(f"\n[dim]Step {i}: {step['step_name']}[/dim]")
            console.print(Markdown(step["output"]))

        console.print("\n[bold green]Final Output:[/bold green]")
        console.print(Markdown(result.get("final_output", "")))


@app.command()
def status():
    """Show Cortex AI server status."""
    server_url = get_server_url()
    console.print(f"[dim]Checking server at {server_url}...[/dim]")

    try:
        with get_client() as client:
            resp = client.get("/health")
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        console.print("[red]✗[/red] Server is [bold red]offline[/bold red]")
        console.print(f"Start it with: [bold]cortex serve[/bold]")
        raise typer.Exit(1)

    ollama_ok = data.get("ollama_available", False)
    demo = data.get("demo_mode", False)
    models_list = data.get("models", [])

    console.print(f"[green]✓[/green] Server is [bold green]online[/bold green] at {server_url}")
    console.print(f"  Ollama: {'[green]connected[/green]' if ollama_ok else '[yellow]not detected[/yellow]'}")
    console.print(f"  Mode: {'[yellow]demo[/yellow]' if demo else '[green]live[/green]'}")
    console.print(f"  Models: {len(models_list)} available")
    if models_list:
        for m in models_list[:5]:
            console.print(f"    [dim]• {m.get('name', m['id'])} ({m.get('provider', 'ollama')})[/dim]")


@app.command()
def demo():
    """Start Cortex AI in demo mode (no config needed)."""
    console.print(Panel.fit(
        "[bold cyan]Cortex AI Demo Mode[/bold cyan]\n\n"
        "Starting with demo data. Ollama auto-detection enabled.\n"
        "[dim]No API keys or config needed![/dim]",
        border_style="cyan",
    ))
    import os
    os.environ["CORTEX_DEMO_MODE"] = "1"
    # Use serve command
    import uvicorn
    backend_path = Path(__file__).parent.parent.parent / "backend"
    sys.path.insert(0, str(backend_path))

    import threading
    def open_browser():
        import time
        time.sleep(2)
        webbrowser.open("http://localhost:7337")
    threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run("main:app", host="0.0.0.0", port=7337, app_dir=str(backend_path), log_level="info")


@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """[bold cyan]Cortex AI[/bold cyan] — Your local-first AI command center.

    Multi-model chat, pipelines, and CLI — all running locally with Ollama.

    [dim]Quick start:[/dim]
      cortex serve     Start the web interface
      cortex ask "?"   Quick one-shot query
      cortex chat      Interactive terminal chat
      cortex models    List available models
    """
    if ctx.invoked_subcommand is None:
        console.print(ctx.get_help())


if __name__ == "__main__":
    app()

"""Tools router for running CLI AI tools."""

import shutil
import subprocess
import time
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from config import get_config

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ToolInfo(BaseModel):
    """Information about an available tool."""
    id: str
    name: str
    description: str
    available: bool
    command: str
    demo: bool = False


class ToolRunRequest(BaseModel):
    """Request to run a tool."""
    input: str
    timeout: int = 30


class ToolRunResponse(BaseModel):
    """Response from running a tool."""
    output: str
    exit_code: int
    latency_ms: float


def _get_builtin_tools() -> list[ToolInfo]:
    """Get built-in tool definitions."""
    tools = [
        ToolInfo(
            id="claude_code",
            name="Claude Code",
            description="Claude Code in non-interactive mode",
            command="claude",
            available=bool(shutil.which("claude")),
            demo=False,
        ),
        ToolInfo(
            id="aider",
            name="Aider",
            description="Aider for AI-assisted code editing",
            command="aider",
            available=bool(shutil.which("aider")),
            demo=False,
        ),
    ]
    return tools


def _get_custom_tools() -> list[ToolInfo]:
    """Get custom tool definitions from config."""
    config = get_config()
    custom_tools = []

    if hasattr(config, 'tools') and config.tools and config.tools.get('custom'):
        for tool_def in config.tools['custom']:
            custom_tools.append(ToolInfo(
                id=tool_def.get('id'),
                name=tool_def.get('name'),
                description=tool_def.get('description', ''),
                command=tool_def.get('command'),
                available=bool(shutil.which(tool_def.get('command', '').split()[0])),
                demo=False,
            ))

    return custom_tools


def _get_all_tools(demo_mode: bool = False) -> list[ToolInfo]:
    """Get all available tools."""
    builtin_tools = _get_builtin_tools()
    custom_tools = _get_custom_tools()

    all_tools = builtin_tools + custom_tools

    # If demo mode or no tools available, show what would be available
    if demo_mode and not any(t.available for t in all_tools):
        for tool in all_tools:
            tool.available = False
            tool.demo = True

    return all_tools


@router.get("")
async def list_tools() -> list[ToolInfo]:
    """List all available CLI tools.

    Returns both built-in and custom tools configured in config.yaml.
    In demo mode, shows tools that would be available if installed.
    """
    config = get_config()

    # Check if tools are enabled (default true)
    tools_enabled = True
    if hasattr(config, 'tools') and config.tools:
        tools_enabled = config.tools.get('enabled', True)

    if not tools_enabled:
        return []

    # Determine if we're in demo mode (no models available)
    is_demo = not hasattr(config, 'claude_api_key') or not config.claude_api_key

    return _get_all_tools(demo_mode=is_demo)


@router.get("/{tool_id}/status")
async def get_tool_status(tool_id: str) -> dict:
    """Check if a tool is installed and available."""
    config = get_config()
    tools = _get_all_tools()

    for tool in tools:
        if tool.id == tool_id:
            return {
                "id": tool_id,
                "available": tool.available,
                "command": tool.command,
                "name": tool.name,
            }

    raise HTTPException(
        status_code=404,
        detail=f"Tool '{tool_id}' not found"
    )


@router.post("/{tool_id}/run")
async def run_tool(tool_id: str, request: ToolRunRequest) -> ToolRunResponse:
    """Run a CLI tool with the given input.

    - Pipes input to stdin
    - Captures stdout and stderr
    - Times out after the specified duration
    - Returns output, exit code, and latency
    """
    config = get_config()
    tools = _get_all_tools()

    # Find the tool
    tool = None
    for t in tools:
        if t.id == tool_id:
            tool = t
            break

    if not tool:
        raise HTTPException(
            status_code=404,
            detail=f"Tool '{tool_id}' not found"
        )

    if not tool.available:
        raise HTTPException(
            status_code=503,
            detail=f"Tool '{tool_id}' is not installed or not on PATH"
        )

    # Run the tool
    start_time = time.time()
    try:
        result = subprocess.run(
            tool.command,
            input=request.input,
            text=True,
            capture_output=True,
            timeout=request.timeout,
        )

        latency_ms = (time.time() - start_time) * 1000

        output = result.stdout
        if result.stderr:
            output += f"\n[stderr]\n{result.stderr}"

        return ToolRunResponse(
            output=output,
            exit_code=result.returncode,
            latency_ms=latency_ms,
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=408,
            detail=f"Tool '{tool_id}' timed out after {request.timeout} seconds"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running tool '{tool_id}': {str(e)}"
        )

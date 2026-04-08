"""Main FastAPI application for Cortex AI."""

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import get_config
from database import init_database, close_database, get_db
from providers.ollama import OllamaProvider
from routers import chat, models, templates, pipelines, history, conversations

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    ollama_available: bool
    models_available: list[str]
    demo_mode: bool


# Initialize app
app = FastAPI(
    title="Cortex AI",
    description="Local-first multi-model AI developer platform",
    version="1.0.0"
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(models.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(templates.router)
app.include_router(pipelines.router)
app.include_router(history.router)


# Global state
_demo_mode = False
_ollama_available = False
_available_models = []


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    global _demo_mode, _ollama_available, _available_models

    # Initialize database
    await init_database()
    print("[Cortex] Database initialized")

    # Seed templates and pipelines
    db = get_db()
    async with db.get_session() as session:
        pass  # Database is ready

    # Check Ollama availability
    ollama = OllamaProvider()
    _ollama_available = await ollama.is_available()

    if _ollama_available:
        try:
            ollama_models = await ollama.list_models()
            _available_models = [m["id"] for m in ollama_models]
            print(f"[Cortex] Ollama available with {len(_available_models)} models")
        except Exception as e:
            print(f"[Cortex] Error fetching Ollama models: {e}")
    else:
        print("[Cortex] Ollama not available - local inference disabled")

    # Check if we have API keys for cloud models
    config = get_config()
    has_cloud_keys = bool(config.claude_api_key or config.openai_api_key)

    if not _ollama_available and not has_cloud_keys:
        _demo_mode = True
        print("[Cortex] Demo mode enabled (no Ollama or cloud API keys)")

    # Print startup banner
    print("\n" + "=" * 60)
    print("  CORTEX AI - Local-First Developer Platform")
    print("=" * 60)
    print(f"  API:  http://localhost:{config.port}")
    print(f"  Docs: http://localhost:{config.port}/docs")
    print(f"  Port: {config.port}")
    print(f"  DB:   {config.db_path}")
    if _ollama_available:
        print(f"  Models: {len(_available_models)} local models loaded")
    if has_cloud_keys:
        print(f"  Cloud APIs enabled")
    if _demo_mode:
        print(f"  MODE:  Demo (no inference available)")
    print("=" * 60 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    await close_database()
    print("[Cortex] Shutdown complete")


@app.get("/health")
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        ollama_available=_ollama_available,
        models_available=_available_models,
        demo_mode=_demo_mode,
    )


@app.get("/")
async def root() -> dict:
    """Root endpoint - serves API info."""
    config = get_config()
    return {
        "name": "Cortex AI",
        "version": "1.0.0",
        "description": "Local-first multi-model AI developer platform",
        "docs": f"http://localhost:{config.port}/docs",
        "api": {
            "chat": "/api/chat",
            "conversations": "/api/conversations",
            "models": "/api/models",
            "templates": "/api/templates",
            "pipelines": "/api/pipelines",
            "usage": "/api/usage",
        },
        "status": "ok",
        "demo_mode": _demo_mode,
    }


# Mount frontend static files
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Serve SPA — mount at root so / serves the React app
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    config = get_config()
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=config.port,
        log_level="info",
    )

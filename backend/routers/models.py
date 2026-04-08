"""Models router for listing available AI models."""

from fastapi import APIRouter, HTTPException

from config import get_config
from providers.ollama import OllamaProvider

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
async def list_models() -> list[dict]:
    """List all available models.

    Returns models from Ollama and configured cloud models.
    """
    models = []
    config = get_config()

    # Try to get Ollama models
    ollama = OllamaProvider()
    try:
        ollama_models = await ollama.list_models()
        models.extend(ollama_models)
    except Exception as e:
        # Ollama not available, continue without it
        pass

    # Add configured cloud models
    for cloud_model in config.cloud_models:
        models.append({
            "id": cloud_model.id,
            "name": cloud_model.name,
            "provider": cloud_model.provider,
            "description": f"{cloud_model.name} via {cloud_model.provider}",
            "context_length": 8192,  # Default for cloud models
        })

    if not models:
        raise HTTPException(
            status_code=503,
            detail="No models available. Ensure Ollama is running or configure API keys."
        )

    return models

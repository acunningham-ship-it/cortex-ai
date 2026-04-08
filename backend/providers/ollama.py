"""Ollama provider for local AI models."""

import json
from typing import AsyncGenerator, Optional

import httpx

from config import get_config


class OllamaProvider:
    """Provider for interacting with Ollama."""

    def __init__(self):
        """Initialize the provider."""
        self.config = get_config()
        self.base_url = self.config.ollama_url.rstrip("/")

    async def is_available(self) -> bool:
        """Check if Ollama is available."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[dict]:
        """List available models from Ollama.

        Returns:
            List of model info dicts with id, name, and size.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()

                models = []
                for model in data.get("models", []):
                    models.append({
                        "id": model["name"],
                        "name": model["name"],
                        "provider": "ollama",
                        "description": f"Local model ({model.get('size', 'unknown')} bytes)",
                        "context_length": 4096,  # Default, varies by model
                    })
                return models
        except Exception as e:
            raise RuntimeError(f"Failed to list Ollama models: {e}")

    async def chat(
        self,
        model: str,
        messages: list[dict],
        stream: bool = True
    ) -> str | AsyncGenerator[str, None]:
        """Chat with an Ollama model.

        Args:
            model: Model name
            messages: List of message dicts with 'role' and 'content'
            stream: Whether to stream the response

        Returns:
            Full response string if stream=False, else an async generator of chunks.

        Raises:
            RuntimeError: If request fails.
        """
        try:
            if stream:
                return self._chat_stream(model, messages)
            else:
                return await self._chat_no_stream(model, messages)
        except Exception as e:
            raise RuntimeError(f"Ollama chat failed: {e}")

    async def _chat_no_stream(self, model: str, messages: list[dict]) -> str:
        """Non-streaming chat."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                },
                timeout=300.0,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

    async def _chat_stream(
        self,
        model: str,
        messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Streaming chat."""
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                },
                timeout=300.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = json.loads(line)
                            chunk = data.get("message", {}).get("content", "")
                            if chunk:
                                yield chunk
                        except json.JSONDecodeError:
                            continue

    async def embeddings(self, model: str, text: str) -> list[float]:
        """Generate embeddings for text.

        Args:
            model: Model name
            text: Text to embed

        Returns:
            List of embedding values.

        Raises:
            RuntimeError: If request fails.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": model,
                        "prompt": text,
                    },
                    timeout=60.0,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("embedding", [])
        except Exception as e:
            raise RuntimeError(f"Failed to generate embeddings: {e}")

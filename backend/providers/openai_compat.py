"""OpenAI-compatible provider for Claude, OpenAI, etc."""

import json
from typing import AsyncGenerator, Optional

import httpx


class OpenAICompatProvider:
    """Provider for OpenAI-compatible APIs (Claude, OpenAI, etc.)."""

    def __init__(self, base_url: str, api_key: str, model: str):
        """Initialize the provider.

        Args:
            base_url: Base URL for the API (e.g., https://api.openai.com/v1)
            api_key: API key for authentication
            model: Model ID
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    async def chat(
        self,
        messages: list[dict],
        stream: bool = True,
        max_tokens: Optional[int] = None
    ) -> str | AsyncGenerator[str, None]:
        """Chat with the model.

        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Whether to stream the response
            max_tokens: Maximum tokens in response

        Returns:
            Full response string if stream=False, else an async generator of chunks.

        Raises:
            RuntimeError: If request fails.
        """
        try:
            if stream:
                return self._chat_stream(messages, max_tokens)
            else:
                return await self._chat_no_stream(messages, max_tokens)
        except Exception as e:
            raise RuntimeError(f"OpenAI-compatible chat failed: {e}")

    async def _chat_no_stream(
        self,
        messages: list[dict],
        max_tokens: Optional[int] = None
    ) -> str:
        """Non-streaming chat."""
        headers = self._get_headers()
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=300.0,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def _chat_stream(
        self,
        messages: list[dict],
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Streaming chat."""
        headers = self._get_headers()
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=300.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or line.startswith(":"):
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            chunk = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if chunk:
                                yield chunk
                        except json.JSONDecodeError:
                            continue

    def _get_headers(self) -> dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

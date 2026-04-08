"""Chat router for conversations with AI models."""

import json
import uuid
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import get_config
from database import get_db, Conversation, Message, UsageStat
from providers.ollama import OllamaProvider
from providers.openai_compat import OpenAICompatProvider

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request to chat with a model."""
    model_config = {"populate_by_name": True}

    conversation_id: str | None = None
    conversationId: str | None = None  # camelCase alias from frontend
    model: str | None = None
    provider: str = "ollama"
    message: str
    system_prompt: str | None = None

    def get_conversation_id(self) -> str | None:
        return self.conversation_id or self.conversationId

    async def resolve_model_and_provider(self) -> tuple[str, str]:
        """Resolve model/provider, auto-detecting if not set."""
        m = self.model
        p = self.provider or "ollama"
        if not m:
            ollama = OllamaProvider()
            try:
                models = await ollama.list_models()
                if models:
                    return models[0]["id"], "ollama"
            except Exception:
                pass
            raise ValueError("No model specified and no Ollama models detected")
        return m, p


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    model: str
    role: str
    content: str
    tokens: int | None = None
    latency_ms: float | None = None


async def _get_or_create_conv_id(db, conv_id_input: str | None, model: str, provider: str, title: str) -> str:
    """Get existing conversation or create a new one."""
    if conv_id_input:
        async with db.get_session() as session:
            conv = await session.get(Conversation, conv_id_input)
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            return conv.id
    else:
        conv_id = str(uuid.uuid4())
        async with db.get_session() as session:
            session.add(Conversation(
                id=conv_id,
                title=title[:60],
                model=model,
                provider=provider,
            ))
        return conv_id


async def _build_messages(db, conv_id: str, new_message: str, system_prompt: str | None) -> list[dict]:
    """Build message history for the conversation."""
    from sqlalchemy import select

    msgs = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})

    # Fetch previous messages
    async with db.get_session() as session:
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conv_id)
            .order_by(Message.created_at)
        )
        history = result.scalars().all()
        for h in history:
            msgs.append({"role": h.role, "content": h.content})

    msgs.append({"role": "user", "content": new_message})
    return msgs


def _build_ai_provider(provider: str, model: str, config):
    """Create the appropriate AI provider."""
    if provider == "ollama":
        return OllamaProvider()
    elif provider == "openai":
        if not config.openai_api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key not configured. Add to cortex.yaml or set CORTEX_OPENAI_API_KEY.")
        return OpenAICompatProvider(base_url="https://api.openai.com/v1", api_key=config.openai_api_key, model=model)
    elif provider == "anthropic":
        if not config.claude_api_key:
            raise HTTPException(status_code=400, detail="Claude API key not configured. Add to cortex.yaml or set CORTEX_CLAUDE_API_KEY.")
        return OpenAICompatProvider(base_url="https://api.anthropic.com/v1", api_key=config.claude_api_key, model=model)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}. Use 'ollama', 'openai', or 'anthropic'.")


@router.post("")
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Non-streaming chat."""
    config = get_config()
    db = get_db()

    try:
        model, provider = await request.resolve_model_and_provider()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conv_id = await _get_or_create_conv_id(db, request.get_conversation_id(), model, provider, request.message)
    msgs = await _build_messages(db, conv_id, request.message, request.system_prompt)

    ai_provider = _build_ai_provider(provider, model, config)

    start_time = time.time()
    try:
        if provider == "ollama":
            response_text = await ai_provider.chat(model=model, messages=msgs, stream=False)
        else:
            response_text = await ai_provider.chat(messages=msgs, stream=False)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")

    latency_ms = (time.time() - start_time) * 1000
    message_id = str(uuid.uuid4())
    user_msg_id = str(uuid.uuid4())

    async with db.get_session() as session:
        session.add(Message(id=user_msg_id, conversation_id=conv_id, role="user", content=request.message))
        session.add(Message(id=message_id, conversation_id=conv_id, role="assistant", content=response_text, latency_ms=latency_ms))
        session.add(UsageStat(
            id=str(uuid.uuid4()),
            model=model, provider=provider,
            tokens_in=len(request.message) // 4,
            tokens_out=len(response_text) // 4,
            latency_ms=latency_ms,
        ))

    return ChatResponse(
        conversation_id=conv_id,
        message_id=message_id,
        model=model,
        role="assistant",
        content=response_text,
        latency_ms=latency_ms,
    )


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat via Server-Sent Events."""
    config = get_config()
    db = get_db()

    try:
        model, provider = await request.resolve_model_and_provider()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conv_id = await _get_or_create_conv_id(db, request.get_conversation_id(), model, provider, request.message)
    msgs = await _build_messages(db, conv_id, request.message, request.system_prompt)

    ai_provider = _build_ai_provider(provider, model, config)

    async def generate():
        start_time = time.time()
        full_response = ""
        message_id = str(uuid.uuid4())
        user_msg_id = str(uuid.uuid4())

        # Save user message immediately
        async with db.get_session() as session:
            session.add(Message(id=user_msg_id, conversation_id=conv_id, role="user", content=request.message))

        try:
            if provider == "ollama":
                response_gen = ai_provider._chat_stream(model=model, messages=msgs)
            else:
                response_gen = ai_provider._chat_stream(messages=msgs)

            async for chunk in response_gen:
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk, 'conversation_id': conv_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        latency_ms = (time.time() - start_time) * 1000
        yield f"data: {json.dumps({'done': True, 'conversation_id': conv_id, 'latency_ms': latency_ms})}\n\n"

        # Save assistant message
        async with db.get_session() as session:
            session.add(Message(id=message_id, conversation_id=conv_id, role="assistant", content=full_response, latency_ms=latency_ms))
            session.add(UsageStat(
                id=str(uuid.uuid4()),
                model=model, provider=provider,
                tokens_in=len(request.message) // 4,
                tokens_out=len(full_response) // 4,
                latency_ms=latency_ms,
            ))

    return StreamingResponse(generate(), media_type="text/event-stream")

"""Conversations router — CRUD for conversation history."""

from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db, Conversation, Message

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class ConversationInfo(BaseModel):
    id: str
    title: str | None
    model: str
    provider: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetail(ConversationInfo):
    messages: list[dict]


@router.get("")
async def list_conversations() -> list[ConversationInfo]:
    db = get_db()
    async with db.get_session() as session:
        result = await session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.updated_at.desc())
        )
        conversations = result.scalars().all()
        return [
            ConversationInfo(
                id=conv.id,
                title=conv.title,
                model=conv.model,
                provider=conv.provider,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=len(conv.messages),
            )
            for conv in conversations
        ]


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str) -> ConversationDetail:
    db = get_db()
    async with db.get_session() as session:
        result = await session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return ConversationDetail(
            id=conv.id,
            title=conv.title,
            model=conv.model,
            provider=conv.provider,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=len(conv.messages),
            messages=[
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "tokens": msg.tokens,
                    "latency_ms": msg.latency_ms,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in sorted(conv.messages, key=lambda m: m.created_at)
            ],
        )


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str) -> dict:
    db = get_db()
    async with db.get_session() as session:
        result = await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        await session.delete(conv)
    return {"status": "deleted"}

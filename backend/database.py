"""Database models and utilities for Cortex AI."""

import json
from datetime import datetime
from contextlib import asynccontextmanager

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from config import get_config

Base = declarative_base()


class Conversation(Base):
    """Represents a conversation."""
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=True)
    model = Column(String)
    provider = Column(String)  # ollama, openai, anthropic
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Represents a message in a conversation."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String)  # user, assistant, system
    content = Column(Text)
    tokens = Column(Integer, nullable=True)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Template(Base):
    """Represents a prompt template."""
    __tablename__ = "templates"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    category = Column(String)
    content = Column(Text)
    variables = Column(Text)  # JSON array of variable names
    is_builtin = Column(Integer, default=0)  # 1 if built-in, 0 if custom
    created_at = Column(DateTime, default=datetime.utcnow)

    def get_variables(self) -> list[str]:
        """Parse variables from JSON."""
        if self.variables:
            return json.loads(self.variables)
        return []

    def set_variables(self, variables: list[str]):
        """Serialize variables to JSON."""
        self.variables = json.dumps(variables)


class Pipeline(Base):
    """Represents a multi-step pipeline."""
    __tablename__ = "pipelines"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    steps = Column(Text)  # JSON array of steps
    is_builtin = Column(Integer, default=0)  # 1 if built-in, 0 if custom
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_steps(self) -> list[dict]:
        """Parse steps from JSON."""
        if self.steps:
            return json.loads(self.steps)
        return []

    def set_steps(self, steps: list[dict]):
        """Serialize steps to JSON."""
        self.steps = json.dumps(steps)


class UsageStat(Base):
    """Represents usage statistics."""
    __tablename__ = "usage_stats"

    id = Column(String, primary_key=True)
    model = Column(String)
    provider = Column(String)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    latency_ms = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class ToolRun(Base):
    """Represents a CLI tool execution."""
    __tablename__ = "tool_runs"

    id = Column(String, primary_key=True)
    tool_id = Column(String)
    input_text = Column(Text)
    output_text = Column(Text)
    exit_code = Column(Integer)
    latency_ms = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Database:
    """Database management."""

    def __init__(self):
        """Initialize database connection."""
        config = get_config()
        db_url = f"sqlite+aiosqlite:///{config.db_path}"
        self.engine = create_async_engine(db_url, echo=False)
        self.async_session = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def init_db(self):
        """Create all tables."""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self):
        """Close database connection."""
        await self.engine.dispose()

    @asynccontextmanager
    async def get_session(self):
        """Get a database session."""
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise


_db: Database | None = None


async def init_database():
    """Initialize the global database instance."""
    global _db
    if _db is None:
        _db = Database()
        await _db.init_db()


async def close_database():
    """Close the global database instance."""
    global _db
    if _db is not None:
        await _db.close()


def get_db() -> Database:
    """Get the global database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _db

"""History and usage statistics router."""

from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from database import get_db, UsageStat

router = APIRouter(prefix="/api/usage", tags=["usage"])


class ModelUsage(BaseModel):
    """Usage statistics for a model."""
    model: str
    provider: str
    total_tokens_in: int
    total_tokens_out: int
    request_count: int
    avg_latency_ms: float
    estimated_cost_usd: float


class UsageResponse(BaseModel):
    """Usage statistics response."""
    models: list[ModelUsage]


class DailyUsage(BaseModel):
    """Daily usage statistics."""
    date: str
    total_tokens_in: int
    total_tokens_out: int
    request_count: int
    avg_latency_ms: float


class TimelineResponse(BaseModel):
    """Timeline response for usage."""
    days: list[DailyUsage]


@router.get("")
async def get_usage() -> UsageResponse:
    """Get aggregate usage statistics by model."""
    db = get_db()

    async with db.get_session() as session:
        result = await session.execute(select(UsageStat))
        stats = result.scalars().all()

        # Aggregate by model/provider
        model_stats = defaultdict(lambda: {
            "tokens_in": 0,
            "tokens_out": 0,
            "count": 0,
            "total_latency": 0,
            "provider": None,
        })

        for stat in stats:
            key = (stat.model, stat.provider)
            model_stats[key]["tokens_in"] += stat.tokens_in
            model_stats[key]["tokens_out"] += stat.tokens_out
            model_stats[key]["count"] += 1
            model_stats[key]["total_latency"] += stat.latency_ms
            model_stats[key]["provider"] = stat.provider

        models = []
        for (model, provider), data in model_stats.items():
            avg_latency = data["total_latency"] / max(data["count"], 1)

            # Estimate cost
            if provider == "ollama":
                estimated_cost = 0.0  # Local, no cost
            else:
                # $0.003 per 1k tokens (input + output combined)
                estimated_cost = ((data["tokens_in"] + data["tokens_out"]) / 1000) * 0.003

            models.append(ModelUsage(
                model=model,
                provider=provider,
                total_tokens_in=data["tokens_in"],
                total_tokens_out=data["tokens_out"],
                request_count=data["count"],
                avg_latency_ms=avg_latency,
                estimated_cost_usd=round(estimated_cost, 6),
            ))

        return UsageResponse(models=models)


@router.get("/timeline")
async def get_usage_timeline() -> TimelineResponse:
    """Get daily usage statistics for the last 7 days."""
    db = get_db()

    async with db.get_session() as session:
        result = await session.execute(select(UsageStat))
        stats = result.scalars().all()

        # Aggregate by day
        daily_stats = defaultdict(lambda: {
            "tokens_in": 0,
            "tokens_out": 0,
            "count": 0,
            "total_latency": 0,
        })

        now = datetime.utcnow()
        for i in range(7):
            day = (now - timedelta(days=i)).date()
            daily_stats[str(day)] = {
                "tokens_in": 0,
                "tokens_out": 0,
                "count": 0,
                "total_latency": 0,
            }

        for stat in stats:
            day_key = stat.created_at.date()
            if (now.date() - day_key).days < 7:
                day_str = str(day_key)
                daily_stats[day_str]["tokens_in"] += stat.tokens_in
                daily_stats[day_str]["tokens_out"] += stat.tokens_out
                daily_stats[day_str]["count"] += 1
                daily_stats[day_str]["total_latency"] += stat.latency_ms

        # Sort by date descending (most recent first)
        days = []
        for day_str in sorted(daily_stats.keys(), reverse=True):
            data = daily_stats[day_str]
            avg_latency = data["total_latency"] / max(data["count"], 1)

            days.append(DailyUsage(
                date=day_str,
                total_tokens_in=data["tokens_in"],
                total_tokens_out=data["tokens_out"],
                request_count=data["count"],
                avg_latency_ms=avg_latency,
            ))

        return TimelineResponse(days=days)

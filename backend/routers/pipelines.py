"""Pipelines router for multi-step processing."""

import uuid
import re
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_db, Pipeline
from providers.ollama import OllamaProvider
from providers.openai_compat import OpenAICompatProvider
from config import get_config

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])


class PipelineStep(BaseModel):
    """A step in a pipeline."""
    name: str
    model: str
    provider: str
    system_prompt: str | None = None
    input_template: str


class PipelineRequest(BaseModel):
    """Request to create or update a pipeline."""
    name: str
    description: str
    steps: list[PipelineStep]


class PipelineInfo(BaseModel):
    """Information about a pipeline."""
    id: str
    name: str
    description: str
    steps: list[PipelineStep]
    is_builtin: bool
    created_at: datetime | None = None


class PipelineRunRequest(BaseModel):
    """Request to run a pipeline."""
    input: str


class PipelineStepResult(BaseModel):
    """Result of executing a pipeline step."""
    step_name: str
    input: str
    output: str
    tokens: int | None = None
    latency_ms: float


class PipelineRunResult(BaseModel):
    """Result of running a pipeline."""
    pipeline_id: str
    steps: list[PipelineStepResult]
    final_output: str


BUILTIN_PIPELINES = [
    {
        "name": "Summarize & Translate",
        "description": "Summarize text and then translate to Spanish",
        "steps": [
            {
                "name": "Summarize",
                "model": "qwen2.5:0.5b",
                "provider": "ollama",
                "system_prompt": None,
                "input_template": "Summarize this in 3 bullet points:\n\n{{input}}"
            },
            {
                "name": "Translate to Spanish",
                "model": "qwen2.5:0.5b",
                "provider": "ollama",
                "system_prompt": None,
                "input_template": "Translate the following to Spanish:\n\n{{step_0_output}}"
            }
        ]
    },
    {
        "name": "Code Review & Test",
        "description": "Review code and then write unit tests",
        "steps": [
            {
                "name": "Code Review",
                "model": "qwen2.5:0.5b",
                "provider": "ollama",
                "system_prompt": None,
                "input_template": "Review this code for bugs, performance, and style:\n\n{{input}}"
            },
            {
                "name": "Write Tests",
                "model": "qwen2.5:0.5b",
                "provider": "ollama",
                "system_prompt": None,
                "input_template": "Write comprehensive unit tests for this code:\n\n{{input}}"
            }
        ]
    }
]


async def _ensure_builtin_pipelines():
    """Ensure built-in pipelines exist in database."""
    db = get_db()

    async with db.get_session() as session:
        from sqlalchemy import select

        for pipeline_data in BUILTIN_PIPELINES:
            # Check if already exists
            result = await session.execute(
                select(Pipeline).where(Pipeline.name == pipeline_data["name"])
            )
            existing = result.scalars().first()

            if not existing:
                pipeline = Pipeline(
                    id=str(uuid.uuid4()),
                    name=pipeline_data["name"],
                    description=pipeline_data["description"],
                    is_builtin=1,
                )

                # Convert step dicts to proper format
                steps_data = []
                for step in pipeline_data["steps"]:
                    steps_data.append({
                        "name": step["name"],
                        "model": step["model"],
                        "provider": step["provider"],
                        "system_prompt": step.get("system_prompt"),
                        "input_template": step["input_template"]
                    })

                pipeline.set_steps(steps_data)
                session.add(pipeline)


@router.get("")
async def list_pipelines() -> list[PipelineInfo]:
    """List all pipelines."""
    await _ensure_builtin_pipelines()
    db = get_db()

    async with db.get_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Pipeline).order_by(Pipeline.name))
        pipelines = result.scalars().all()

        return [
            PipelineInfo(
                id=p.id,
                name=p.name,
                description=p.description,
                steps=[PipelineStep(**step) for step in p.get_steps()],
                is_builtin=bool(p.is_builtin),
                created_at=p.created_at,
            )
            for p in pipelines
        ]


@router.post("")
async def create_pipeline(request: PipelineRequest) -> PipelineInfo:
    """Create a new pipeline."""
    db = get_db()

    pipeline = Pipeline(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        is_builtin=0,
    )

    # Store steps
    steps_data = [step.model_dump() for step in request.steps]
    pipeline.set_steps(steps_data)

    async with db.get_session() as session:
        session.add(pipeline)

    return PipelineInfo(
        id=pipeline.id,
        name=pipeline.name,
        description=pipeline.description,
        steps=request.steps,
        is_builtin=False,
        created_at=pipeline.created_at,
    )


@router.put("/{pipeline_id}")
async def update_pipeline(pipeline_id: str, request: PipelineRequest) -> PipelineInfo:
    """Update a pipeline."""
    db = get_db()

    async with db.get_session() as session:
        pipeline = await session.get(Pipeline, pipeline_id)
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")

        pipeline.name = request.name
        pipeline.description = request.description

        steps_data = [step.dict() for step in request.steps]
        pipeline.set_steps(steps_data)

    return PipelineInfo(
        id=pipeline.id,
        name=pipeline.name,
        description=pipeline.description,
        steps=request.steps,
        is_builtin=bool(pipeline.is_builtin),
        created_at=pipeline.created_at,
    )


@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: str) -> dict:
    """Delete a pipeline."""
    db = get_db()

    async with db.get_session() as session:
        pipeline = await session.get(Pipeline, pipeline_id)
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")

        if pipeline.is_builtin:
            raise HTTPException(status_code=400, detail="Cannot delete built-in pipelines")

        await session.delete(pipeline)

    return {"status": "deleted"}


@router.post("/{pipeline_id}/run")
async def run_pipeline(pipeline_id: str, request: PipelineRunRequest) -> PipelineRunResult:
    """Execute a pipeline."""
    config = get_config()
    db = get_db()

    async with db.get_session() as session:
        pipeline = await session.get(Pipeline, pipeline_id)
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")

        steps_data = pipeline.get_steps()

    # Execute each step sequentially
    step_results = []
    step_outputs = {}  # Store outputs for reference in next steps

    for step_index, step_data in enumerate(steps_data):
        step = PipelineStep(**step_data)

        # Prepare input by substituting variables
        step_input = step.input_template
        step_input = step_input.replace("{{input}}", request.input)

        # Replace references to previous step outputs
        for prev_idx in range(step_index):
            step_input = step_input.replace(
                f"{{{{step_{prev_idx}_output}}}}",
                step_outputs.get(f"step_{prev_idx}_output", "")
            )

        # Execute the step
        start_time = time.time()
        try:
            if step.provider == "ollama":
                provider = OllamaProvider()
                output = await provider.chat(
                    model=step.model,
                    messages=[
                        *([{"role": "system", "content": step.system_prompt}] if step.system_prompt else []),
                        {"role": "user", "content": step_input}
                    ],
                    stream=False
                )
            elif step.provider == "openai":
                if not config.openai_api_key:
                    raise HTTPException(status_code=400, detail="OpenAI API key not configured")
                provider = OpenAICompatProvider(
                    base_url="https://api.openai.com/v1",
                    api_key=config.openai_api_key,
                    model=step.model
                )
                output = await provider.chat(
                    messages=[
                        *([{"role": "system", "content": step.system_prompt}] if step.system_prompt else []),
                        {"role": "user", "content": step_input}
                    ],
                    stream=False
                )
            elif step.provider == "anthropic":
                if not config.claude_api_key:
                    raise HTTPException(status_code=400, detail="Claude API key not configured")
                provider = OpenAICompatProvider(
                    base_url="https://api.anthropic.com/v1",
                    api_key=config.claude_api_key,
                    model=step.model
                )
                output = await provider.chat(
                    messages=[
                        *([{"role": "system", "content": step.system_prompt}] if step.system_prompt else []),
                        {"role": "user", "content": step_input}
                    ],
                    stream=False
                )
            else:
                raise HTTPException(status_code=400, detail="Unknown provider")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pipeline step failed: {str(e)}")

        latency_ms = (time.time() - start_time) * 1000

        # Store output for next step
        step_outputs[f"step_{step_index}_output"] = output

        step_results.append(PipelineStepResult(
            step_name=step.name,
            input=step_input,
            output=output,
            tokens=len(output) // 4,  # Estimate
            latency_ms=latency_ms,
        ))

    final_output = step_outputs.get(f"step_{len(steps_data)-1}_output", "")

    return PipelineRunResult(
        pipeline_id=pipeline_id,
        steps=step_results,
        final_output=final_output,
    )

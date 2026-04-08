"""Templates router for prompt templates."""

import uuid
import re
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_db, Template

router = APIRouter(prefix="/api/templates", tags=["templates"])

BUILTIN_TEMPLATES = [
    {
        "name": "Code Review",
        "description": "Review code for bugs, performance, and style",
        "category": "development",
        "content": "Review this code for bugs, performance, and style:\n\n{{code}}",
        "variables": ["code"],
    },
    {
        "name": "Summarize",
        "description": "Summarize text into key bullet points",
        "category": "writing",
        "content": "Summarize the following in 3 bullet points:\n\n{{text}}",
        "variables": ["text"],
    },
    {
        "name": "Explain Like I'm 5",
        "description": "Explain a concept in simple terms",
        "category": "education",
        "content": "Explain this concept simply, as if to a 5-year-old:\n\n{{concept}}",
        "variables": ["concept"],
    },
    {
        "name": "Translate",
        "description": "Translate text to a specific language",
        "category": "writing",
        "content": "Translate the following to {{language}}:\n\n{{text}}",
        "variables": ["language", "text"],
    },
    {
        "name": "Debug Helper",
        "description": "Get help debugging code errors",
        "category": "development",
        "content": "Help me debug this error:\n\nCode:\n{{code}}\n\nError:\n{{error}}",
        "variables": ["code", "error"],
    },
    {
        "name": "Write Tests",
        "description": "Generate comprehensive unit tests",
        "category": "development",
        "content": "Write comprehensive unit tests for this function:\n\n{{code}}",
        "variables": ["code"],
    },
]


class TemplateRequest(BaseModel):
    """Request to create or update a template."""
    name: str
    description: str
    category: str
    content: str


class TemplateInfo(BaseModel):
    """Information about a template."""
    id: str
    name: str
    description: str
    category: str
    variables: list[str]
    is_builtin: bool
    created_at: datetime | None = None


class TemplateRunRequest(BaseModel):
    """Request to run a template."""
    variables: dict[str, str]
    model: str
    provider: str


async def _ensure_builtin_templates():
    """Ensure built-in templates exist in database."""
    db = get_db()

    async with db.get_session() as session:
        from sqlalchemy import select

        for template_data in BUILTIN_TEMPLATES:
            # Check if already exists
            result = await session.execute(
                select(Template).where(Template.name == template_data["name"])
            )
            existing = result.scalars().first()

            if not existing:
                template = Template(
                    id=str(uuid.uuid4()),
                    name=template_data["name"],
                    description=template_data["description"],
                    category=template_data["category"],
                    content=template_data["content"],
                    is_builtin=1,
                )
                template.set_variables(template_data["variables"])
                session.add(template)


@router.get("")
async def list_templates() -> list[TemplateInfo]:
    """List all templates."""
    await _ensure_builtin_templates()
    db = get_db()

    async with db.get_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Template).order_by(Template.name))
        templates = result.scalars().all()

        return [
            TemplateInfo(
                id=t.id,
                name=t.name,
                description=t.description,
                category=t.category,
                variables=t.get_variables(),
                is_builtin=bool(t.is_builtin),
                created_at=t.created_at,
            )
            for t in templates
        ]


@router.post("")
async def create_template(request: TemplateRequest) -> TemplateInfo:
    """Create a new template."""
    db = get_db()

    # Extract variables from content (patterns like {{variable_name}})
    variables = list(set(re.findall(r'\{\{(\w+)\}\}', request.content)))

    template = Template(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        category=request.category,
        content=request.content,
        is_builtin=0,
    )
    template.set_variables(variables)

    async with db.get_session() as session:
        session.add(template)

    return TemplateInfo(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        variables=variables,
        is_builtin=False,
        created_at=template.created_at,
    )


@router.put("/{template_id}")
async def update_template(template_id: str, request: TemplateRequest) -> TemplateInfo:
    """Update a template."""
    db = get_db()

    # Extract variables
    variables = list(set(re.findall(r'\{\{(\w+)\}\}', request.content)))

    async with db.get_session() as session:
        template = await session.get(Template, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        template.name = request.name
        template.description = request.description
        template.category = request.category
        template.content = request.content
        template.set_variables(variables)

    return TemplateInfo(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        variables=variables,
        is_builtin=bool(template.is_builtin),
        created_at=template.created_at,
    )


@router.delete("/{template_id}")
async def delete_template(template_id: str) -> dict:
    """Delete a template."""
    db = get_db()

    async with db.get_session() as session:
        template = await session.get(Template, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        if template.is_builtin:
            raise HTTPException(status_code=400, detail="Cannot delete built-in templates")

        await session.delete(template)

    return {"status": "deleted"}


@router.post("/{template_id}/run")
async def run_template(template_id: str, request: TemplateRunRequest) -> dict:
    """Run a template by substituting variables and calling chat."""
    from routers.chat import chat_endpoint, ChatRequest

    db = get_db()

    async with db.get_session() as session:
        template = await session.get(Template, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # Substitute variables
        prompt = template.content
        for var_name, var_value in request.variables.items():
            prompt = prompt.replace(f"{{{{{var_name}}}}}", var_value)

        # Call chat with the substituted prompt
        chat_request = ChatRequest(
            model=request.model,
            provider=request.provider,
            message=prompt,
        )

        response = await chat_endpoint(chat_request)

        return {
            "template_id": template_id,
            "prompt_used": prompt,
            "response": response.model_dump(),
        }

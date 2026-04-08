# Cortex AI

**Your local-first AI command center** — multi-model chat, prompt pipelines, templates, usage analytics, and a polished CLI. Works out of the box with [Ollama](https://ollama.com) (zero config) or any OpenAI-compatible API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Ollama](https://img.shields.io/badge/Ollama-supported-green.svg)](https://ollama.com)

**[Website](https://acunningham-ship-it.github.io/cortex-ai)** · **[GitHub](https://github.com/acunningham-ship-it/cortex-ai)**

---

## What is Cortex AI?

Cortex AI is a versatile developer platform that brings together everything you need to work with local AI models:

| Feature | Description |
|---|---|
| **Multi-model Chat** | Stream responses from any Ollama model or cloud AI |
| **Prompt Templates** | Save and reuse prompts with variable substitution |
| **AI Pipelines** | Chain multiple AI steps with output chaining |
| **Usage Dashboard** | Track tokens, latency, and estimated cost |
| **REST API** | 21 endpoints — integrate into your own apps |
| **CLI** | Full-featured terminal interface |
| **Plugin-ready** | Extensible provider and router architecture |

## Quick Start (30 seconds)

```bash
# 1. Clone and install
git clone https://github.com/acunningham-ship-it/cortex-ai.git
cd cortex-ai
pip install -e .

# 2. Start (auto-detects Ollama)
cortex serve

# 3. Open http://localhost:7337 in your browser
```

> **No API keys needed.** If [Ollama](https://ollama.com) is running, Cortex AI works immediately.

## Demo Mode

No Ollama? No problem:

```bash
cortex serve --demo
```

Demo mode uses mock responses so you can explore the full UI without any AI setup.

## Installation

### Option 1: pip install (recommended)

```bash
pip install cortex-ai
cortex serve
```

### Option 2: From source

```bash
git clone https://github.com/acunningham-ship-it/cortex-ai.git
cd cortex-ai
pip install -e .
cortex serve
```

### Option 3: Docker

```bash
docker-compose up
# Visit http://localhost:7337
```

## CLI Reference

```bash
# Start the server
cortex serve [--port 7337] [--host 0.0.0.0] [--demo]

# Chat directly from terminal
cortex chat "Explain async/await in Python"
cortex chat --model qwen2.5:7b "Review this code: $(cat myfile.py)"
cortex chat --stream "Write a bash script that..."

# List available models
cortex models

# Work with templates
cortex templates list
cortex templates run "Code Review" --var code="$(cat myfile.py)"

# Run a pipeline
cortex pipelines list
cortex pipelines run "Summarize & Translate" --input "Long text here..."

# View usage stats
cortex usage
```

## API Reference

The backend exposes 21 REST endpoints:

### Chat
```bash
# Non-streaming chat
POST /api/chat
{ "model": "qwen2.5:7b", "provider": "ollama", "message": "Hello" }

# Streaming (Server-Sent Events)
POST /api/chat/stream
{ "model": "qwen2.5:7b", "provider": "ollama", "message": "Write me a story..." }
```

### Models
```bash
GET /api/models
# Returns all Ollama models + configured cloud models
```

### Templates
```bash
GET  /api/templates          # List all templates
POST /api/templates          # Create custom template
POST /api/templates/{id}/run # Run with variable substitution
```

### Pipelines
```bash
GET  /api/pipelines          # List all pipelines
POST /api/pipelines/{id}/run # Execute pipeline
```

### Usage
```bash
GET /api/usage           # Aggregate stats by model
GET /api/usage/timeline  # Daily usage for last 7 days
```

Full OpenAPI docs at `http://localhost:7337/docs`

## Configuration

Copy and edit the example config:

```bash
cp config.example.yaml cortex.yaml
```

```yaml
# cortex.yaml
server:
  port: 7337
  host: "0.0.0.0"

ollama:
  url: "http://localhost:11434"

database:
  path: "~/.cortex/cortex.db"

# Optional: cloud AI providers
cloud_models:
  - id: "gpt-4o"
    name: "GPT-4o"
    provider: "openai"
    api_key: "${OPENAI_API_KEY}"
    base_url: "https://api.openai.com/v1"
  - id: "claude-3-5-sonnet"
    name: "Claude 3.5 Sonnet"
    provider: "anthropic"
    api_key: "${ANTHROPIC_API_KEY}"
    base_url: "https://api.anthropic.com/v1"
```

Environment variable overrides work too:
```bash
CORTEX_PORT=8080 CORTEX_OLLAMA_URL=http://remote:11434 cortex serve
```

## Architecture

```
cortex-ai/
├── backend/               # FastAPI server
│   ├── main.py            # App + startup
│   ├── config.py          # Configuration management
│   ├── database.py        # SQLAlchemy async ORM (SQLite)
│   ├── providers/
│   │   ├── ollama.py      # Ollama integration
│   │   └── openai_compat.py  # OpenAI-compatible (Claude, GPT, etc.)
│   └── routers/
│       ├── chat.py        # Chat + conversations
│       ├── models.py      # Model listing
│       ├── templates.py   # Prompt templates
│       ├── pipelines.py   # Multi-step pipelines
│       └── history.py     # Usage statistics
├── frontend/              # React + Tailwind web UI
│   └── src/
│       ├── components/
│       │   ├── Chat/      # Chat interface
│       │   ├── Dashboard/ # Usage analytics
│       │   ├── Pipeline/  # Pipeline builder
│       │   └── Templates/ # Template manager
│       └── hooks/         # React hooks
├── cli/                   # Typer CLI
│   └── cortex_cli/main.py
├── docs/                  # GitHub Pages site
├── examples/              # Example configs + scripts
└── pyproject.toml         # Package definition
```

## Built-in Content

### Prompt Templates (6)
- **Code Review** — Review code for bugs, performance, and style
- **Summarize** — Condense text to 3 bullet points
- **Explain Like I'm 5** — Simple explanations for complex topics
- **Translate** — Translate to any language
- **Debug Helper** — Diagnose code errors
- **Write Tests** — Generate unit tests for code

### Pipelines (2)
- **Summarize & Translate** — Summarize then translate output
- **Code Review & Test** — Review code then generate tests

## Supported Providers

| Provider | Models | API Key Required |
|---|---|---|
| **Ollama** | Any local model | No |
| **OpenAI** | GPT-4o, GPT-4, etc. | Yes |
| **Anthropic** | Claude 3.5, etc. | Yes |
| **Any OpenAI-compatible** | Custom models | Depends |

## Extending Cortex AI

### Add a Provider

```python
# backend/providers/my_provider.py
class MyProvider:
    async def chat(self, model: str, messages: list, stream: bool = False):
        # Your implementation
        ...
    
    async def list_models(self) -> list[dict]:
        return [{"id": "my-model", "name": "My Model"}]
```

### Add a Router

```python
# backend/routers/my_feature.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

@router.get("/")
async def list_items():
    return []
```

Register it in `backend/main.py`:
```python
from routers import my_feature
app.include_router(my_feature.router)
```

## Development

```bash
# Backend dev mode
cd backend && uvicorn main:app --reload --port 7337

# Frontend dev mode (in separate terminal)
cd frontend && npm install && npm run dev

# Run tests
pytest tests/ -v
```

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com) (optional, for local models)
- Node.js 18+ (only if building frontend from source)

## License

MIT — see [LICENSE](LICENSE)

---

Built with FastAPI, React, Tailwind CSS, SQLite, and ❤️

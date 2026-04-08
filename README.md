# Cortex AI ⚡

**Your local-first AI command center** — multi-model chat, prompt pipelines, templates, usage analytics, and a full CLI. Works instantly with [Ollama](https://ollama.com) (zero config) and supports Claude, OpenAI, and any OpenAI-compatible API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Ollama](https://img.shields.io/badge/Ollama-supported-green.svg)](https://ollama.com)

**[Website](https://acunningham-ship-it.github.io/cortex-ai)** · **[Docs](https://acunningham-ship-it.github.io/cortex-ai)** · **[GitHub](https://github.com/acunningham-ship-it/cortex-ai)**

---

## Why Cortex AI?

Most local AI tools are either too simple (one chat window) or too complex (full orchestration platforms). Cortex fills the gap:

| | Cortex AI | Open WebUI | Ollama CLI | Flowise |
|--|--|--|--|--|
| Chat UI | ✅ | ✅ | ❌ | ❌ |
| Pipeline builder | ✅ | ❌ | ❌ | ✅ |
| Prompt templates | ✅ | Limited | ❌ | ✅ |
| CLI interface | ✅ | ❌ | ✅ | ❌ |
| REST API | ✅ | ✅ | ❌ | ✅ |
| Usage tracking | ✅ | Limited | ❌ | ❌ |
| Zero config start | ✅ | ❌ | ✅ | ❌ |
| Cloud AI support | ✅ | ✅ | ❌ | ✅ |

---

## Quick Start (30 seconds)

```bash
# Install
pip install cortex-ai

# Start (auto-detects Ollama)
cortex serve

# Browser opens at http://localhost:7337 ✨
```

> **Zero config needed.** If [Ollama](https://ollama.com) is running locally, Cortex detects your models automatically.

---

## Features

### 💬 Multi-Model Chat
- Stream responses from any Ollama model or cloud API
- Switch models mid-conversation
- Persistent conversation history
- Markdown rendering with syntax highlighting

### ⛓️ Pipeline Builder
Chain multiple AI calls together with output passing:
```
Input → Summarize (qwen2.5:7b) → Translate to Spanish (qwen2.5:0.5b) → Output
```
Build in the UI or run from the CLI.

### 📋 Prompt Templates
6 built-in templates with `{{variable}}` substitution:
- Code Review, Debug Helper, Write Tests
- Summarize, Translate, Explain Like I'm 5

### 📊 Usage Dashboard
- Token counts per model
- Latency tracking
- Estimated savings vs. cloud API pricing

### ⚡ CLI
```bash
cortex serve                    # Start web server
cortex ask "What is Python?"    # Quick one-shot query
cortex ask --model qwen2.5:7b "Explain async/await"
echo "code" | cortex ask "Review this"  # Pipe stdin
cortex chat                     # Interactive terminal chat
cortex models                   # List available models
cortex status                   # Check server health
cortex run "Summarize & Translate" --input "text..."
```

---

## Installation

### From pip (recommended)
```bash
pip install cortex-ai
cortex serve
```

### From source
```bash
git clone https://github.com/acunningham-ship-it/cortex-ai.git
cd cortex-ai
pip install -e .
cortex serve
```

### Docker
```bash
docker-compose up
# Visit http://localhost:7337
```

---

## Configuration

Cortex works with zero config. For customization, copy the example config:

```bash
cp config.example.yaml cortex.yaml
```

```yaml
# cortex.yaml
ollama_url: "http://localhost:11434"
port: 7337
db_path: "~/.cortex/cortex.db"

# Optional: cloud API keys
# claude_api_key: "sk-ant-..."
# openai_api_key: "sk-..."

# Optional: add cloud models to the selector
cloud_models:
  - id: claude-haiku-4-5-20251001
    name: Claude Haiku 4.5
    provider: anthropic
```

**Environment variable overrides:**
```bash
CORTEX_OLLAMA_URL=http://remote:11434 cortex serve
CORTEX_CLAUDE_API_KEY=sk-ant-... cortex serve
CORTEX_PORT=8080 cortex serve
```

Config priority: env vars → `cortex.yaml` (project dir) → `~/.cortex/config.yaml` → defaults

---

## Architecture

```
cortex-ai/
├── backend/               # Python FastAPI server
│   ├── main.py            # App entry point, CORS, startup
│   ├── config.py          # YAML + env var configuration
│   ├── database.py        # SQLAlchemy async ORM (SQLite)
│   ├── providers/
│   │   ├── ollama.py      # Ollama local model integration
│   │   └── openai_compat.py  # Claude, OpenAI, any OpenAI-compat API
│   └── routers/
│       ├── chat.py        # /api/chat (streaming SSE + non-streaming)
│       ├── conversations.py  # /api/conversations CRUD
│       ├── models.py      # /api/models (Ollama + cloud)
│       ├── templates.py   # /api/templates (built-ins + custom)
│       ├── pipelines.py   # /api/pipelines (multi-step chains)
│       └── history.py     # /api/usage statistics
├── frontend/              # React 18 + TypeScript + Tailwind CSS
│   └── src/
│       ├── App.tsx        # Layout, routing, model selector
│       ├── components/
│       │   ├── Chat/      # ChatView, ChatMessage, ConversationList
│       │   ├── Dashboard/ # DashboardView, StatCard, TokenChart
│       │   ├── Pipeline/  # PipelineView, PipelineBuilder
│       │   └── Templates/ # TemplatesView, TemplateModal
│       ├── hooks/         # useModels, useHealth
│       └── lib/api.ts     # Typed API client
├── cli/cortex_cli/        # Typer CLI (cortex command)
├── docs/                  # GitHub Pages marketing site
├── examples/              # Example scripts
├── tests/                 # pytest test suite
├── config.example.yaml    # Configuration template
├── docker-compose.yml     # Docker deployment
└── pyproject.toml         # Package + dependencies
```

---

## REST API

All endpoints at `http://localhost:7337/api/`. Full interactive docs at `/docs`.

### Chat
```bash
# Non-streaming
curl -X POST http://localhost:7337/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "model": "qwen2.5:7b", "provider": "ollama"}'

# Streaming (SSE)
curl -X POST http://localhost:7337/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story...", "model": "qwen2.5:7b", "provider": "ollama"}'
```

### Models
```bash
GET /api/models         # All models (Ollama + configured cloud)
GET /api/conversations  # List conversation history
```

### Templates & Pipelines
```bash
GET /api/templates              # List templates
POST /api/templates/{id}/run    # Run template with variables
GET /api/pipelines              # List pipelines
POST /api/pipelines/{id}/run    # Execute pipeline: {"input": "text"}
```

### Usage
```bash
GET /api/usage          # Token stats by model
GET /api/usage/timeline # Daily stats (7 days)
GET /health             # Server health + Ollama status
```

---

## Built-in Templates

| Name | Variables | Description |
|------|-----------|-------------|
| Code Review | `{{code}}` | Bugs, performance, style |
| Debug Helper | `{{code}}`, `{{error}}` | Diagnose errors |
| Write Tests | `{{code}}` | Generate unit tests |
| Summarize | `{{text}}` | 3-bullet summary |
| Translate | `{{language}}`, `{{text}}` | Translate to any language |
| Explain Like I'm 5 | `{{concept}}` | Simple explanations |

## Built-in Pipelines

| Name | Steps | Description |
|------|-------|-------------|
| Summarize & Translate | 2 | Summarize → translate to Spanish |
| Code Review & Test | 2 | Review → generate tests |

---

## Extending Cortex AI

### Add a Provider

```python
# backend/providers/my_provider.py
class MyProvider:
    async def chat(self, model: str, messages: list, stream: bool = False):
        # Your implementation — return str or AsyncGenerator
        ...

    async def list_models(self) -> list[dict]:
        return [{"id": "my-model", "name": "My Model", "provider": "my_provider"}]
```

### Add a Router

```python
# backend/routers/my_feature.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

@router.get("")
async def list_items():
    return []
```

Register in `backend/main.py`:
```python
from routers import my_feature
app.include_router(my_feature.router)
```

---

## Development

```bash
# Backend with hot reload
cd backend && uvicorn main:app --reload --port 7337

# Frontend dev server (proxies /api to backend)
cd frontend && npm install && npm run dev

# Build frontend
cd frontend && npm run build

# Run tests
pytest tests/ -v
```

---

## Supported Providers

| Provider | Config Key | Notes |
|----------|-----------|-------|
| Ollama | `ollama_url` | Local, free, zero config |
| Anthropic Claude | `claude_api_key` | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| OpenAI | `openai_api_key` | GPT-5, GPT-4.1, o3, o4-mini |
| Any OpenAI-compat | custom `base_url` | Works with LM Studio, etc. |

---

## Requirements

- **Python 3.10+**
- **[Ollama](https://ollama.com)** — optional, for local models (recommended)
- **Node.js 18+** — only needed if building frontend from source

---

## License

MIT — see [LICENSE](LICENSE)

---

*Built with FastAPI · React · Tailwind CSS · SQLite · Ollama*

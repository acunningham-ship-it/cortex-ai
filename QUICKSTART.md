# Cortex AI Backend - Quick Start

## Installation (2 minutes)

```bash
cd cortex-ai/backend
pip install -r requirements.txt
```

## Configuration (1 minute)

```bash
cd cortex-ai
cp config.example.yaml cortex.yaml
# Edit cortex.yaml if needed (defaults work fine)
```

## Start Server (10 seconds)

```bash
cd cortex-ai/backend
python -m uvicorn main:app --reload
```

You should see:
```
============================================================
  CORTEX AI - Local-First Developer Platform
============================================================
  API:  http://localhost:7337
  Docs: http://localhost:7337/docs
  Port: 7337
  DB:   ~/.cortex/cortex.db
  Models: X local models loaded
============================================================
```

## Test It

**Health Check:**
```bash
curl http://localhost:7337/health
```

**List Models:**
```bash
curl http://localhost:7337/api/models
```

**Chat:**
```bash
curl -X POST http://localhost:7337/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "provider": "ollama",
    "message": "What is 2+2?"
  }'
```

**API Docs:**
- Open http://localhost:7337/docs in browser
- Try endpoints directly in Swagger UI

## What's Included

### 12 Complete Python Files
- **config.py** - Configuration management
- **database.py** - SQLite + SQLAlchemy async ORM
- **main.py** - FastAPI application
- **providers/ollama.py** - Ollama integration
- **providers/openai_compat.py** - Claude/OpenAI integration
- **routers/chat.py** - Chat endpoints (5)
- **routers/models.py** - Model listing
- **routers/templates.py** - Prompt templates (5 endpoints)
- **routers/pipelines.py** - Multi-step pipelines (5 endpoints)
- **routers/history.py** - Usage statistics

### 21 API Endpoints
- 5 Chat endpoints (including streaming)
- 1 Models endpoint
- 5 Templates endpoints (with 6 built-in templates)
- 5 Pipelines endpoints (with 2 example pipelines)
- 2 Usage/stats endpoints
- 3 System endpoints

### Built-in Templates (6)
1. Code Review
2. Summarize
3. Explain Like I'm 5
4. Translate
5. Debug Helper
6. Write Tests

### Built-in Pipelines (2)
1. Summarize & Translate
2. Code Review & Test

## Key Features

- **Async throughout** - All database ops and API calls are async
- **Streaming** - Server-Sent Events (SSE) for chat
- **Multiple providers** - Ollama, OpenAI, Claude
- **Auto-config** - Works with defaults, no setup needed
- **Demo mode** - Works without Ollama or API keys
- **Usage tracking** - Tokens, latency, cost estimation
- **Built-in templates & pipelines** - Ready to use
- **Full OpenAPI docs** - /docs endpoint

## Requirements Met

- FastAPI backend ✓
- SQLite database auto-init ✓
- Ollama provider ✓
- OpenAI-compatible provider ✓
- Streaming chat (SSE) ✓
- Conversation management ✓
- Prompt templates ✓
- Multi-step pipelines ✓
- Usage statistics ✓
- Configuration management ✓
- Error handling ✓
- Demo mode ✓

## Troubleshooting

**"Ollama not available"**
- Ensure Ollama running: `ollama serve`
- Or configure OpenAI API key in cortex.yaml

**"No models available"**
- Run: `ollama pull llama2`
- Or configure cloud API keys

**Database errors**
- Check ~/.cortex/ permissions
- Delete ~/.cortex/cortex.db to reset

## Files

```
cortex-ai/
├── backend/
│   ├── requirements.txt          (dependencies)
│   ├── config.py                 (configuration)
│   ├── database.py               (ORM models)
│   ├── main.py                   (FastAPI app)
│   ├── providers/
│   │   ├── ollama.py
│   │   └── openai_compat.py
│   └── routers/
│       ├── chat.py
│       ├── models.py
│       ├── templates.py
│       ├── pipelines.py
│       └── history.py
├── config.example.yaml           (config template)
├── BACKEND_SETUP.md             (full setup guide)
├── IMPLEMENTATION_SUMMARY.md    (detailed docs)
└── QUICKSTART.md                (this file)
```

## Next Steps

1. Install: `pip install -r requirements.txt`
2. Configure: `cp config.example.yaml cortex.yaml`
3. Run: `python -m uvicorn main:app --reload`
4. Test: `curl http://localhost:7337/health`
5. Explore: http://localhost:7337/docs

Done! Your Cortex AI backend is ready.

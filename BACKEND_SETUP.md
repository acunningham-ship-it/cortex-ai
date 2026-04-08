# Cortex AI Backend Setup Guide

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Cortex

Create `cortex.yaml` from the template:

```bash
cp config.example.yaml cortex.yaml
```

Edit `cortex.yaml` to customize:

```yaml
ollama_url: "http://localhost:11434"  # Ollama server URL
port: 7337                             # Backend port
db_path: "~/.cortex/cortex.db"        # Database location

# Optional: Add cloud API keys
# claude_api_key: "sk-ant-..."
# openai_api_key: "sk-..."

# Optional: Add cloud models to model list
cloud_models:
  - id: claude-haiku-4-5-20251001
    name: Claude Haiku 4.5
    provider: anthropic
```

### 3. Run the Server

```bash
cd backend
python -m uvicorn main:app --reload --port 7337
```

The server will:
- Initialize SQLite database at `~/.cortex/cortex.db`
- Seed built-in templates and pipelines
- Check Ollama availability
- Print startup banner with available models

## API Overview

### Core Endpoints

**Chat**
- `POST /api/chat` - Non-streaming chat
- `POST /api/chat/stream` - Streaming chat (SSE)
- `GET /api/conversations` - List conversations
- `GET /api/conversations/{id}` - Get conversation details
- `DELETE /api/conversations/{id}` - Delete conversation

**Models**
- `GET /api/models` - List available models (Ollama + cloud)

**Templates**
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/templates/{id}/run` - Run template with variables

**Pipelines**
- `GET /api/pipelines` - List pipelines
- `POST /api/pipelines` - Create pipeline
- `PUT /api/pipelines/{id}` - Update pipeline
- `DELETE /api/pipelines/{id}` - Delete pipeline
- `POST /api/pipelines/{id}/run` - Execute pipeline

**Usage & Stats**
- `GET /api/usage` - Aggregate usage by model
- `GET /api/usage/timeline` - Daily usage for last 7 days

**System**
- `GET /health` - Health check
- `GET /` - API info

## Environment Variables

Override config with environment variables:

```bash
CORTEX_OLLAMA_URL=http://localhost:11434
CORTEX_PORT=7337
CORTEX_DB_PATH=~/.cortex/cortex.db
CORTEX_CLAUDE_API_KEY=sk-ant-...
CORTEX_OPENAI_API_KEY=sk-...
```

## Architecture

### Providers
- **OllamaProvider** - Local models via Ollama
- **OpenAICompatProvider** - Claude, OpenAI, or any OpenAI-compatible API

### Database (SQLite + SQLAlchemy)
- `Conversation` - Chat sessions
- `Message` - Individual messages
- `Template` - Prompt templates with variable substitution
- `Pipeline` - Multi-step processing chains
- `UsageStat` - Token counts and latency

### Streaming
- Chat streaming uses Server-Sent Events (SSE)
- Frontend receives chunks as `data: {chunk: "..."}` JSON events
- Final event: `data: {done: true, latency_ms: ...}`

## Built-in Templates

1. **Code Review** - Review code for bugs/performance/style
2. **Summarize** - Summarize to 3 bullet points
3. **Explain Like I'm 5** - Simplify explanations
4. **Translate** - Translate to specified language
5. **Debug Helper** - Debug code errors
6. **Write Tests** - Generate unit tests

## Built-in Pipelines

1. **Summarize & Translate** - Summarize then translate to Spanish
2. **Code Review & Test** - Review code then generate tests

## Demo Mode

If no Ollama is running AND no API keys are configured:
- Server starts in demo mode
- Returns `/health` with `demo_mode: true`
- API endpoints return helpful error messages
- Good for frontend development without backend

## Production Considerations

1. **Database**: Set `db_path` to persistent location
2. **API Keys**: Use environment variables, not config files
3. **CORS**: Currently allows all origins - configure for production
4. **Static Files**: Frontend dist/ mounted at `/app` if it exists
5. **Logging**: Check stdout for detailed logs
6. **Error Handling**: All endpoints return proper HTTP error codes

## Testing

```bash
# Health check
curl http://localhost:7337/health

# List models
curl http://localhost:7337/api/models

# Chat (non-streaming)
curl -X POST http://localhost:7337/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:7b",
    "provider": "ollama",
    "message": "Hello, how are you?"
  }'

# Chat (streaming)
curl -X POST http://localhost:7337/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:7b",
    "provider": "ollama",
    "message": "Explain quantum computing"
  }'

# API Documentation
# Open http://localhost:7337/docs in browser
```

## Troubleshooting

**Ollama not found**
- Ensure Ollama is running: `ollama serve`
- Check URL in config: `curl http://localhost:11434/api/tags`

**Database errors**
- Check file permissions in `~/.cortex/`
- Restart server to reinitialize

**Missing models**
- List Ollama models: `ollama list`
- Pull a model: `ollama pull qwen2.5:7b`

**API Key errors**
- Verify key format (should start with `sk-`)
- Check environment variable export: `echo $CORTEX_CLAUDE_API_KEY`

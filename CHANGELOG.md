# Changelog

All notable changes to Cortex AI are documented here.

## [0.2.0] - 2026-04-08

### Added
- **AI Tools Hub** — unified interface to run CLI AI tools (Claude Code, Aider, custom tools) from within Cortex
  - `GET /api/tools` — list available/installed CLI tools
  - `POST /api/tools/{tool_id}/run` — execute a tool with input, get output
  - `GET /api/tools/{tool_id}/status` — check tool availability
  - Side-by-side comparison mode: run same prompt through multiple AI tools simultaneously
  - Demo mode: shows tool cards even without any CLI tools installed
- **Tools view** in the web UI — new navigation section for AI Tools Hub
- **Config support** for custom CLI tools via `cortex.yaml`

### Changed
- Upgraded UI polish across all views — premium look with improved typography, spacing, and animations
- Chat view now shows typing indicator, improved message bubbles, and empty state with suggested prompts
- Sidebar now shows version badge and improved nav hover states
- Bumped version to **v0.2.0**

### Fixed
- Demo mode improvements — works fully without any configured models or API keys
- Various small UI alignment issues

---

## [0.1.0] - 2026-04-07

### Added
- **Multi-model chat** — stream responses from Ollama or cloud APIs (Claude, OpenAI)
- **Prompt pipelines** — chain multiple AI calls with step output chaining
- **Prompt templates** — 6 built-in templates (Code Review, Summarize, Debug, etc.)
- **Usage dashboard** — token tracking, cost estimation, timeline graphs
- **CLI interface** — `cortex chat`, `cortex serve`, `cortex models`, `cortex demo`
- **REST API** — 21 endpoints with full OpenAPI docs
- **Zero-config Ollama** — auto-detects local Ollama instance and available models
- **Demo mode** — works out of the box without any API keys
- SQLite database for conversation history
- Docker + docker-compose support
- Configuration via `cortex.yaml` with environment variable overrides
- Plugin/extension system via config

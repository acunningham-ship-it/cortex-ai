"""Backend API tests using httpx."""

import httpx
import pytest
import time

# Base URL for the backend
BASE_URL = "http://localhost:7337"


@pytest.fixture
def client():
    """Create an httpx client for testing."""
    return httpx.Client(base_url=BASE_URL, timeout=60.0)


class TestHealth:
    """Test health endpoint."""

    def test_health_returns_200(self, client):
        """GET /health should return 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "ollama_available" in data
        assert "models_available" in data

    def test_health_has_demo_mode_field(self, client):
        """GET /health should include demo_mode."""
        response = client.get("/health")
        data = response.json()
        assert "demo_mode" in data
        assert isinstance(data["demo_mode"], bool)


class TestModels:
    """Test models endpoint."""

    def test_get_models_returns_list(self, client):
        """GET /api/models should return list."""
        response = client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_models_have_required_fields(self, client):
        """Each model should have id, name, provider."""
        response = client.get("/api/models")
        data = response.json()
        if data:
            model = data[0]
            assert "id" in model
            assert "name" in model
            assert "provider" in model

    def test_ollama_models_present(self, client):
        """At least one Ollama model should be present when Ollama is running."""
        health = client.get("/health").json()
        if not health.get("ollama_available"):
            pytest.skip("Ollama not available")
        response = client.get("/api/models")
        data = response.json()
        ollama_models = [m for m in data if m.get("provider") == "ollama"]
        assert len(ollama_models) > 0


class TestTemplates:
    """Test templates endpoint."""

    def test_get_templates_returns_list_with_builtins(self, client):
        """GET /api/templates should return list with built-ins."""
        response = client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_builtin_templates_exist(self, client):
        """Built-in templates should be available."""
        response = client.get("/api/templates")
        data = response.json()
        assert len(data) >= 6  # At least 6 built-in templates
        names = [t["name"] for t in data]
        assert any("Code Review" in n for n in names)
        assert any("Summarize" in n for n in names)

    def test_template_has_required_fields(self, client):
        """Templates should have required fields."""
        response = client.get("/api/templates")
        data = response.json()
        if data:
            t = data[0]
            assert "id" in t
            assert "name" in t
            assert "variables" in t
            assert isinstance(t["variables"], list)

    def test_create_and_delete_template(self, client):
        """Should be able to create and delete a template."""
        # Create
        payload = {
            "name": "Test Template",
            "description": "A test template",
            "category": "test",
            "content": "Hello {{name}}!",
            "variables": ["name"],
        }
        response = client.post("/api/templates", json=payload)
        assert response.status_code == 200
        template = response.json()
        assert template["name"] == "Test Template"
        template_id = template["id"]

        # Delete
        del_response = client.delete(f"/api/templates/{template_id}")
        assert del_response.status_code == 200


class TestChat:
    """Test chat endpoint."""

    def test_post_chat_works_with_model(self, client):
        """POST /api/chat should work with qwen2.5:0.5b."""
        health = client.get("/health").json()
        if not health.get("ollama_available"):
            pytest.skip("Ollama not available")
        payload = {
            "model": "qwen2.5:0.5b",
            "message": "Say the word OK and nothing else."
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "content" in data
        assert len(data["content"]) > 0

    def test_chat_creates_conversation(self, client):
        """Chat should create and return a conversation_id."""
        health = client.get("/health").json()
        if not health.get("ollama_available"):
            pytest.skip("Ollama not available")
        payload = {
            "model": "qwen2.5:0.5b",
            "message": "Say hi."
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] is not None

    def test_chat_auto_selects_model(self, client):
        """Chat should work without specifying model (auto-select)."""
        health = client.get("/health").json()
        if not health.get("ollama_available"):
            pytest.skip("Ollama not available")
        payload = {"message": "Say hi."}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200


class TestConversations:
    """Test conversations endpoint."""

    def test_get_conversations_returns_list(self, client):
        """GET /api/conversations should return list."""
        response = client.get("/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_conversation(self, client):
        """POST /api/conversations should create a new conversation."""
        response = client.post("/api/conversations", json={"title": "Test Conv"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Conv"
        assert "id" in data

    def test_delete_conversation(self, client):
        """Should be able to delete a conversation."""
        # Create one first
        conv = client.post("/api/conversations", json={"title": "To Delete"}).json()
        conv_id = conv["id"]

        # Delete it
        del_response = client.delete(f"/api/conversations/{conv_id}")
        assert del_response.status_code == 200

    def test_get_nonexistent_conversation_returns_404(self, client):
        """GET /api/conversations/{bad_id} should return 404."""
        response = client.get("/api/conversations/nonexistent-id-123")
        assert response.status_code == 404


class TestPipelines:
    """Test pipelines endpoint."""

    def test_get_pipelines_returns_list(self, client):
        """GET /api/pipelines should return list."""
        response = client.get("/api/pipelines")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_builtin_pipelines_present(self, client):
        """Built-in pipelines should be available."""
        response = client.get("/api/pipelines")
        data = response.json()
        assert len(data) >= 2  # At least 2 built-in pipelines
        names = [p["name"] for p in data]
        assert any("Summarize" in n for n in names)
        assert any("Code Review" in n for n in names)

    def test_pipeline_has_steps(self, client):
        """Pipelines should have steps."""
        response = client.get("/api/pipelines")
        data = response.json()
        if data:
            p = data[0]
            assert "steps" in p
            assert isinstance(p["steps"], list)
            assert len(p["steps"]) > 0

    def test_run_pipeline(self, client):
        """Should be able to run a built-in pipeline."""
        health = client.get("/health").json()
        if not health.get("ollama_available"):
            pytest.skip("Ollama not available")
        pipelines = client.get("/api/pipelines").json()
        if not pipelines:
            pytest.skip("No pipelines available")

        pipeline_id = pipelines[0]["id"]
        response = client.post(
            f"/api/pipelines/{pipeline_id}/run",
            json={"input": "Python is a programming language."}
        )
        assert response.status_code == 200
        data = response.json()
        assert "final_output" in data
        assert len(data["final_output"]) > 0


class TestUsage:
    """Test usage stats endpoint."""

    def test_get_usage_returns_stats(self, client):
        """GET /api/usage should return stats."""
        response = client.get("/api/usage")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "models" in data
        assert isinstance(data["models"], list)

    def test_usage_timeline(self, client):
        """GET /api/usage/timeline should return 7 days of data."""
        response = client.get("/api/usage/timeline")
        assert response.status_code == 200
        data = response.json()
        assert "days" in data
        assert len(data["days"]) == 7


class TestFrontend:
    """Test that the frontend and API docs are accessible."""

    def test_root_returns_api_info(self, client):
        """GET / should return API info JSON."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Cortex AI"
        assert "api" in data

    def test_api_docs_accessible(self, client):
        """GET /docs should serve FastAPI Swagger UI."""
        response = client.get("/docs")
        assert response.status_code == 200

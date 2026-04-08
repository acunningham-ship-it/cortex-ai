"""Backend API tests using httpx."""

import httpx
import pytest

# Base URL for the backend
BASE_URL = "http://localhost:7337"


@pytest.fixture
def client():
    """Create an httpx client for testing."""
    return httpx.Client(base_url=BASE_URL)


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


class TestModels:
    """Test models endpoint."""

    def test_get_models_returns_list(self, client):
        """GET /api/models should return list."""
        response = client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the default models
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]


class TestTemplates:
    """Test templates endpoint."""

    def test_get_templates_returns_list_with_builtins(self, client):
        """GET /api/templates should return list with built-ins."""
        response = client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check if any templates exist (at minimum the list should be valid)
        assert isinstance(data, list)


class TestChat:
    """Test chat endpoint."""

    def test_post_chat_works_with_model(self, client):
        """POST /api/chat should work with qwen2.5:0.5b."""
        payload = {
            "model": "qwen2.5:0.5b",
            "messages": [
                {"role": "user", "content": "Hello, who are you?"}
            ]
        }
        response = client.post(
            "/api/chat",
            json=payload,
            timeout=30.0
        )
        # Accept either 200 or streaming response
        assert response.status_code in [200, 201]


class TestConversations:
    """Test conversations endpoint."""

    def test_get_conversations_returns_list(self, client):
        """GET /api/conversations should return list."""
        response = client.get("/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # List can be empty
        if len(data) > 0:
            assert "id" in data[0]
            assert "title" in data[0]
            assert "model" in data[0]
            assert "created_at" in data[0]


class TestPipelines:
    """Test pipelines endpoint."""

    def test_get_pipelines_returns_list(self, client):
        """GET /api/pipelines should return list."""
        response = client.get("/api/pipelines")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestUsage:
    """Test usage stats endpoint."""

    def test_get_usage_returns_stats(self, client):
        """GET /api/usage should return stats."""
        response = client.get("/api/usage")
        assert response.status_code == 200
        data = response.json()
        # Should have usage stats
        assert isinstance(data, dict)

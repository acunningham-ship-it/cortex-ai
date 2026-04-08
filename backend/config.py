"""Configuration management for Cortex AI."""

import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

import yaml


@dataclass
class CloudModel:
    """Represents a cloud model configuration."""
    id: str
    name: str
    provider: str  # anthropic, openai, etc.


@dataclass
class Config:
    """Main configuration for Cortex AI."""
    ollama_url: str = "http://localhost:11434"
    port: int = 7337
    db_path: str = "~/.cortex/cortex.db"
    claude_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    cloud_models: list[CloudModel] = field(default_factory=list)
    tools: Optional[dict] = None

    def __post_init__(self):
        """Validate configuration."""
        self.db_path = os.path.expanduser(self.db_path)


def load_config() -> Config:
    """Load configuration from file or environment variables.

    Priority:
    1. Environment variables (CORTEX_*)
    2. cortex.yaml in current directory
    3. ~/.cortex/config.yaml
    4. Built-in defaults
    """
    config_dict = {}

    # Try to load from cortex.yaml in current directory
    current_dir_config = Path("cortex.yaml")
    if current_dir_config.exists():
        with open(current_dir_config) as f:
            config_dict = yaml.safe_load(f) or {}

    # Try to load from ~/.cortex/config.yaml
    if not config_dict:
        home_config = Path.home() / ".cortex" / "config.yaml"
        if home_config.exists():
            with open(home_config) as f:
                config_dict = yaml.safe_load(f) or {}

    # Override with environment variables
    if env_ollama := os.getenv("CORTEX_OLLAMA_URL"):
        config_dict["ollama_url"] = env_ollama

    if env_port := os.getenv("CORTEX_PORT"):
        config_dict["port"] = int(env_port)

    if env_db := os.getenv("CORTEX_DB_PATH"):
        config_dict["db_path"] = env_db

    if env_claude := os.getenv("CORTEX_CLAUDE_API_KEY"):
        config_dict["claude_api_key"] = env_claude

    if env_openai := os.getenv("CORTEX_OPENAI_API_KEY"):
        config_dict["openai_api_key"] = env_openai

    # Process cloud_models if present
    cloud_models = []
    if "cloud_models" in config_dict and config_dict["cloud_models"]:
        for model_dict in config_dict["cloud_models"]:
            cloud_models.append(CloudModel(
                id=model_dict["id"],
                name=model_dict["name"],
                provider=model_dict["provider"]
            ))
    config_dict["cloud_models"] = cloud_models

    # Keep tools config as-is if present
    if "tools" not in config_dict:
        config_dict["tools"] = None

    return Config(**config_dict)


_config: Optional[Config] = None


def get_config() -> Config:
    """Get or create the global configuration instance."""
    global _config
    if _config is None:
        _config = load_config()
        # Ensure ~/.cortex directory exists
        db_dir = Path(_config.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
    return _config

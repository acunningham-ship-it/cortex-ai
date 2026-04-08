#!/usr/bin/env python3
"""Example: Basic chat API usage."""

import httpx
import json

BASE_URL = "http://localhost:7337"


def main():
    """Run a simple chat example."""
    client = httpx.Client(base_url=BASE_URL)

    print("Cortex AI - Chat Example")
    print("=" * 50)

    # First, check available models
    print("\n1. Fetching available models...")
    response = client.get("/api/models")
    models = response.json()
    print(f"Found {len(models)} model(s)")
    if models:
        print(f"Models: {[m.get('id', m.get('name')) for m in models]}")

    # Send a chat message
    print("\n2. Sending a chat message...")
    payload = {
        "model": "qwen2.5:0.5b",
        "message": "What is the capital of France?"
    }
    response = client.post("/api/chat", json=payload, timeout=30.0)
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"Error: {response.text}")

    # Get conversation history
    print("\n3. Fetching conversation history...")
    response = client.get("/api/conversations")
    conversations = response.json()
    print(f"Total conversations: {len(conversations)}")
    if conversations:
        conv = conversations[0]
        print(f"Latest conversation:")
        print(f"  ID: {conv['id']}")
        print(f"  Title: {conv['title']}")
        print(f"  Model: {conv['model']}")
        print(f"  Messages: {conv['message_count']}")

    client.close()
    print("\n✓ Example completed")


if __name__ == "__main__":
    main()

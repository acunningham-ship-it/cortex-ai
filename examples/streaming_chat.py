#!/usr/bin/env python3
"""Example: Streaming chat with Server-Sent Events (SSE)."""

import httpx

BASE_URL = "http://localhost:7337"


def main():
    """Stream chat responses from the API."""
    client = httpx.Client(base_url=BASE_URL)

    print("Cortex AI - Streaming Chat Example")
    print("=" * 50)

    payload = {
        "model": "qwen2.5:0.5b",
        "messages": [
            {"role": "user", "content": "Explain quantum computing in simple terms."}
        ],
        "stream": True,
    }

    print("\nStreaming response from qwen2.5:0.5b:")
    print("-" * 50)

    try:
        with client.stream("POST", "/api/chat", json=payload, timeout=60.0) as response:
            if response.status_code == 200:
                # Handle streaming response
                for line in response.iter_lines():
                    if line.strip():
                        if line.startswith("data: "):
                            data = line[6:]  # Remove "data: " prefix
                            print(data, end="", flush=True)
                print("\n" + "-" * 50)
                print("✓ Stream completed")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
    except httpx.ReadTimeout:
        print("Request timed out")
    finally:
        client.close()


if __name__ == "__main__":
    main()

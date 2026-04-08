#!/usr/bin/env python3
"""Example: Create and execute a custom pipeline."""

import httpx
import json

BASE_URL = "http://localhost:7337"


def main():
    """Create a custom pipeline and execute it."""
    client = httpx.Client(base_url=BASE_URL)

    print("Cortex AI - Custom Pipeline Example")
    print("=" * 50)

    # First, check available pipelines
    print("\n1. Fetching available pipelines...")
    response = client.get("/api/pipelines")
    pipelines = response.json()
    print(f"Found {len(pipelines)} pipeline(s)")

    if pipelines:
        print("\nAvailable pipelines:")
        for pipeline in pipelines[:3]:
            print(f"  - {pipeline.get('name', 'Unknown')}")
            print(f"    Description: {pipeline.get('description', 'N/A')}")

    # Create a custom pipeline
    print("\n2. Creating a custom pipeline...")
    payload = {
        "name": "My Custom Pipeline",
        "description": "A pipeline for testing",
        "steps": [
            {
                "name": "step1",
                "type": "chat",
                "config": {
                    "model": "qwen2.5:0.5b",
                    "prompt": "What is machine learning?"
                }
            }
        ]
    }

    response = client.post("/api/pipelines", json=payload, timeout=30.0)
    if response.status_code in [200, 201]:
        result = response.json()
        pipeline_id = result.get("id")
        print(f"Pipeline created: {pipeline_id}")
        print(f"Response: {json.dumps(result, indent=2)}")
    else:
        print(f"Could not create pipeline: {response.status_code}")
        print(f"Response: {response.text}")

    # Execute a pipeline
    print("\n3. Executing a pipeline...")
    if pipelines:
        pipeline_id = pipelines[0].get("id")
        response = client.post(f"/api/pipelines/{pipeline_id}/execute", timeout=60.0)
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"Execution started")
            print(f"Result: {json.dumps(result, indent=2)}")
        else:
            print(f"Execution failed: {response.status_code}")

    print("\n✓ Pipeline example completed")
    client.close()


if __name__ == "__main__":
    main()

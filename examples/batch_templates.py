#!/usr/bin/env python3
"""Example: Run multiple templates in batch."""

import httpx
import json

BASE_URL = "http://localhost:7337"


def main():
    """Run multiple templates and display results."""
    client = httpx.Client(base_url=BASE_URL)

    print("Cortex AI - Batch Templates Example")
    print("=" * 50)

    # Fetch available templates
    print("\n1. Fetching available templates...")
    response = client.get("/api/templates")
    templates = response.json()
    print(f"Found {len(templates)} template(s)")

    if not templates:
        print("No templates available")
        client.close()
        return

    # Display available templates
    print("\nAvailable templates:")
    for i, template in enumerate(templates[:5], 1):  # Show first 5
        print(f"  {i}. {template.get('name', 'Unknown')}")
        print(f"     Category: {template.get('category', 'N/A')}")

    # Run chat with first template (if available)
    if templates:
        template = templates[0]
        template_id = template.get('id')

        print(f"\n2. Running template: {template.get('name')}")
        print("-" * 50)

        payload = {
            "model": "qwen2.5:0.5b",
            "template_id": template_id,
            "message": "Generate a brief example"
        }

        response = client.post("/api/chat", json=payload, timeout=30.0)
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"Result: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.status_code}")

    print("\n✓ Batch example completed")
    client.close()


if __name__ == "__main__":
    main()

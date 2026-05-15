"""Smoke-test Gemini API key and configured CONSILIUM models."""

import os
import sys

from dotenv import load_dotenv
from litellm import AuthenticationError, completion

load_dotenv()

candidate_keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GOOGLE_API_KEY"),
]
api_key = next(
    (
        key.strip()
        for key in candidate_keys
        if key and key.strip() and key.strip() != "your-google-api-key-here"
    ),
    None,
)
if not api_key:
    raise RuntimeError("Missing GEMINI_API_KEY or GOOGLE_API_KEY in .env")

os.environ["GEMINI_API_KEY"] = api_key
os.environ["GOOGLE_API_KEY"] = api_key

MODELS = {
    "specialist": "gemini/gemini-2.5-pro",
    "moderator": "gemini/gemini-3-flash-preview",
}

for role, model in MODELS.items():
    print(f"\n[{role}] testing {model}")
    try:
        response = completion(
            model=model,
            messages=[{"role": "user", "content": "Reply with exactly: CONSILIUM_OK"}],
            max_tokens=1024,
            temperature=0,
            reasoning_effort="low",
        )
        text = response.choices[0].message.content or ""
        if "CONSILIUM" not in text:
            raise RuntimeError(f"Unexpected response content: {text!r}")
        print(f"  output: {text}")
    except AuthenticationError:
        print("  ERROR: authentication failed. Check the Gemini key in .env.")
        sys.exit(1)
    except Exception as exc:
        print(f"  ERROR: {type(exc).__name__}: {exc}")
        sys.exit(1)

print("\nGemini smoke test complete.")

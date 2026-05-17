import json
import re
from typing import Any


def safe_json_parse(text: str) -> dict[str, Any]:
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return _normalize_json_object(parsed)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return _normalize_json_object(parsed)

    raise ValueError(f"Could not parse JSON object from model output: {text[:300]}")


def _normalize_json_object(parsed: dict[str, Any]) -> dict[str, Any]:
    confidence = parsed.get("confidence")
    if isinstance(confidence, str):
        lowered = confidence.strip().lower()
        if lowered in {"very high", "high"}:
            parsed["confidence"] = 0.9
        elif lowered in {"medium", "moderate"}:
            parsed["confidence"] = 0.6
        elif lowered in {"low", "very low"}:
            parsed["confidence"] = 0.3
    return parsed

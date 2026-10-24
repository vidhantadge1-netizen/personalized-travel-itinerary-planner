import os

from ai.base import AIProvider
from ai.gemini_provider import GeminiAIProvider
from ai.mock_provider import MockAIProvider


def get_ai_provider() -> AIProvider:
    """Return the configured AI provider.

    Supports `gemini` and `mock`. If `gemini` is selected but GEMINI_API_KEY
    is not configured or the API is unavailable, it safely falls back to `mock`.
    """
    provider_name = os.getenv("AI_PROVIDER", "mock").strip().lower()

    if provider_name == "gemini":
        return GeminiAIProvider()

    if provider_name in ("", "mock"):
        return MockAIProvider()

    return MockAIProvider()


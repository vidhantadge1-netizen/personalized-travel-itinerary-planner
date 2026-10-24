import base64
import json
import os
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

_CLIENT: Optional[Client] = None


class SupabaseConfigError(RuntimeError):
    """Raised when env values are missing or unsafe for this project."""


def get_supabase_config() -> dict:
    """Read Supabase settings from environment variables."""
    return {
        "url": os.getenv("SUPABASE_URL", "").strip(),
        "key": os.getenv("SUPABASE_KEY", "").strip(),
    }


def is_supabase_configured() -> bool:
    config = get_supabase_config()
    url_ready = config["url"].startswith("https://") and "YOUR_PROJECT_REF" not in config["url"]
    return bool(url_ready and config["key"])


def key_role(api_key: str) -> str:
    """Best-effort role from a Supabase key. Does not treat the key as a secret in logs."""
    if not api_key:
        return "missing"
    if api_key.startswith("sb_secret_"):
        return "service_role"
    if api_key.startswith("sb_publishable_"):
        return "anon"
    parts = api_key.split(".")
    if len(parts) != 3:
        return "unknown"
    padded = parts[1] + "=" * (-len(parts[1]) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")))
    except (ValueError, json.JSONDecodeError):
        return "unknown"
    return str(payload.get("role") or "unknown")


def _assert_safe_key(api_key: str) -> None:
    role = key_role(api_key)
    if role == "service_role":
        raise SupabaseConfigError(
            "SUPABASE_KEY looks like a secret/service-role key. "
            "Use the publishable (anon) key in backend/.env instead."
        )


def get_supabase_client() -> Optional[Client]:
    """Create the official supabase-py client from env vars."""
    global _CLIENT
    if not is_supabase_configured():
        return None
    if _CLIENT is None:
        config = get_supabase_config()
        _assert_safe_key(config["key"])
        _CLIENT = create_client(config["url"], config["key"])
    return _CLIENT

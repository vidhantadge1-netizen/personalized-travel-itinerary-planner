from typing import Optional, Tuple

from db.supabase_client import (
    SupabaseConfigError,
    get_supabase_client,
    is_supabase_configured,
)

TRIP_COLUMNS = "id,destination,days,budget,interests,traveler_type,created_at"
ITINERARY_COLUMNS = "id,trip_id,provider,summary,plan,created_at"

_LAST_STATUS = "not_configured"
_LAST_DETAIL = "SUPABASE_URL and publishable SUPABASE_KEY are not set in backend/.env"


def supabase_status() -> Tuple[str, str]:
    return _LAST_STATUS, _LAST_DETAIL


def _set_status(status: str, detail: str) -> None:
    global _LAST_STATUS, _LAST_DETAIL
    _LAST_STATUS = status
    _LAST_DETAIL = detail


def verify_schema_and_read_access() -> bool:
    """Confirm trips/itineraries exist with expected columns and SELECT is allowed.

    This does not modify rows. INSERT is checked later on the first save.
    RLS policy names cannot be listed with the publishable REST key; enable RLS
    and anon SELECT/INSERT policies in the Supabase SQL editor (see docs/sql).
    """
    if not is_supabase_configured():
        _set_status(
            "not_configured",
            "Add your publishable key to backend/.env as SUPABASE_KEY.",
        )
        return False

    try:
        client = get_supabase_client()
        if client is None:
            _set_status("not_configured", "Supabase client was not created.")
            return False
        client.table("trips").select(TRIP_COLUMNS).limit(1).execute()
        client.table("itineraries").select(ITINERARY_COLUMNS).limit(1).execute()
    except SupabaseConfigError as exc:
        _set_status("not_ready", str(exc))
        return False
    except Exception as exc:
        _set_status("not_ready", str(exc))
        return False

    _set_status(
        "ready",
        "trips and itineraries are readable with the expected columns.",
    )
    return True


def get_verified_client() -> Optional[object]:
    if verify_schema_and_read_access():
        return get_supabase_client()
    return None

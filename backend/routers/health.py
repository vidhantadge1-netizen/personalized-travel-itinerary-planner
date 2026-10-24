import os

from fastapi import APIRouter

from ai.factory import get_ai_provider
from db.schema_guard import supabase_status, verify_schema_and_read_access
from models.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    verify_schema_and_read_access()
    status, detail = supabase_status()
    provider = get_ai_provider()
    return HealthResponse(
        status="ok",
        ai_provider=provider.name,
        supabase_status=status,
        supabase_detail=detail,
    )


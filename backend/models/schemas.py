from typing import List, Optional

from pydantic import BaseModel, Field


class TripRequest(BaseModel):
    destination: str = Field(..., min_length=1, examples=["Goa"])
    days: int = Field(..., ge=1, le=14, examples=[3])
    budget: str = Field(..., examples=["moderate"])
    interests: List[str] = Field(default_factory=list, examples=[["beaches", "food"]])
    traveler_type: Optional[str] = Field(default="solo", examples=["solo"])


class TripResponse(BaseModel):
    id: int
    destination: str
    days: int
    budget: str
    interests: List[str] = Field(default_factory=list)
    traveler_type: Optional[str] = "solo"


class DayPlan(BaseModel):
    day: int
    title: str
    activities: List[str]
    estimated_cost: Optional[str] = None


class ItineraryResponse(BaseModel):
    id: int
    trip_id: Optional[int] = None
    destination: str
    days: int
    summary: str
    provider: str
    plan: List[DayPlan]


class HealthResponse(BaseModel):
    status: str
    ai_provider: str
    supabase_status: str
    supabase_detail: Optional[str] = None

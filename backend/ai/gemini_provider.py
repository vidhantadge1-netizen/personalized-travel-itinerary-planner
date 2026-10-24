import logging
import os
from typing import List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from ai.base import AIProvider
from ai.mock_provider import MockAIProvider
from models.schemas import DayPlan, ItineraryResponse, TripRequest

logger = logging.getLogger(__name__)


class GeneratedDayPlan(BaseModel):
    day: int = Field(..., description="Day number starting at 1")
    title: str = Field(..., description="Descriptive headline for the day")
    activities: List[str] = Field(..., description="List of activities planned for this day")
    estimated_cost: Optional[str] = Field(default=None, description="Estimated budget or cost bracket for this day")


class GeneratedItinerary(BaseModel):
    summary: str = Field(..., description="A concise summary of the overall trip")
    plan: List[GeneratedDayPlan] = Field(..., description="List of day-by-day plans")


class GeminiAIProvider(AIProvider):
    """Google Gemini AI provider using the official google-genai SDK."""

    name = "gemini"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._explicit_api_key = api_key
        self._explicit_model = model
        self._fallback = MockAIProvider()

    @property
    def api_key(self) -> str:
        if self._explicit_api_key is not None:
            return self._explicit_api_key
        from dotenv import load_dotenv

        load_dotenv(override=True)
        return os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY") or ""

    @property
    def model(self) -> str:
        if self._explicit_model is not None:
            return self._explicit_model
        return os.getenv("AI_MODEL") or "gemini-3.5-flash-lite"

    def generate_itinerary(
        self, trip: TripRequest, itinerary_id: int
    ) -> ItineraryResponse:
        current_api_key = self.api_key.strip()
        # 1. Fallback if no API key is provided
        if not current_api_key:
            logger.warning("GEMINI_API_KEY is not configured. Falling back to MockAIProvider.")
            return self._fallback.generate_itinerary(trip, itinerary_id)

        try:
            client = genai.Client(
                api_key=current_api_key,
                http_options=types.HttpOptions(timeout=30000),
            )

            interests_str = (
                ", ".join(trip.interests) if trip.interests else "sightseeing and local exploration"
            )
            prompt = (
                f"You are a professional travel planner. Create an authentic, personalized, "
                f"structured {trip.days}-day travel itinerary for {trip.destination}.\n"
                f"- Destination: {trip.destination}\n"
                f"- Duration: exactly {trip.days} day(s)\n"
                f"- Budget category: {trip.budget}\n"
                f"- Traveler type: {trip.traveler_type or 'solo'}\n"
                f"- Interests: {interests_str}\n\n"
                f"Requirements:\n"
                f"1. Generate exactly {trip.days} day entries in 'plan', numbered sequentially 1 to {trip.days}.\n"
                f"2. Each day must include a descriptive title and 2 to 4 realistic activities matching the destination and traveler profile.\n"
                f"3. Provide an engaging 1-2 sentence overall summary.\n"
            )

            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeneratedItinerary,
                    temperature=0.7,
                ),
            )

            raw_text = response.text
            if not raw_text or not raw_text.strip():
                raise ValueError("Gemini returned empty response text")

            parsed = GeneratedItinerary.model_validate_json(raw_text)

            if not parsed.plan:
                raise ValueError("Gemini generated an itinerary with an empty plan")

            sanitized_plan: List[DayPlan] = []
            for item in parsed.plan:
                cleaned_activities = [act.strip() for act in item.activities if act.strip()]
                if not cleaned_activities:
                    cleaned_activities = [f"Explore {trip.destination} highlights"]
                sanitized_plan.append(
                    DayPlan(
                        day=int(item.day),
                        title=item.title.strip() or f"Day {item.day} in {trip.destination}",
                        activities=cleaned_activities,
                        estimated_cost=item.estimated_cost or trip.budget,
                    )
                )

            return ItineraryResponse(
                id=int(itinerary_id),
                destination=trip.destination,
                days=trip.days,
                summary=parsed.summary.strip() or f"A {trip.days}-day trip to {trip.destination}.",
                provider=self.name,
                plan=sanitized_plan,
            )

        except Exception as exc:
            logger.error("Gemini itinerary generation failed: %s. Falling back to MockAIProvider.", exc)
            return self._fallback.generate_itinerary(trip, itinerary_id)

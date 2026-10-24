from models.schemas import DayPlan, ItineraryResponse, TripRequest

from ai.base import AIProvider


class MockAIProvider(AIProvider):
    """Local sample itinerary so the project runs without an AI API key."""

    name = "mock"

    def generate_itinerary(
        self, trip: TripRequest, itinerary_id: int
    ) -> ItineraryResponse:
        interests = trip.interests or ["local food", "sightseeing"]
        interest_text = ", ".join(interests)
        plan = []

        for day in range(1, trip.days + 1):
            plan.append(
                DayPlan(
                    day=day,
                    title=f"Day {day} in {trip.destination}",
                    activities=[
                        f"Morning: explore a highlight related to {interests[0]}",
                        f"Afternoon: {interest_text} experience at a {trip.budget} budget",
                        f"Evening: relaxed dinner for a {trip.traveler_type} traveler",
                    ],
                    estimated_cost=trip.budget,
                )
            )

        return ItineraryResponse(
            id=int(itinerary_id),
            destination=trip.destination,
            days=trip.days,
            summary=(
                f"A {trip.days}-day {trip.budget} trip to {trip.destination} "
                f"focused on {interest_text}."
            ),
            provider=self.name,
            plan=plan,
        )

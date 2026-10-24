from abc import ABC, abstractmethod

from models.schemas import ItineraryResponse, TripRequest


class AIProvider(ABC):
    """Provider-independent itinerary generator.

    Swap implementations (mock, OpenAI, Gemini) without changing routers.
    """

    name: str = "base"

    @abstractmethod
    def generate_itinerary(
        self, trip: TripRequest, itinerary_id: int
    ) -> ItineraryResponse:
        raise NotImplementedError

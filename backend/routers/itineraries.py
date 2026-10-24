from fastapi import APIRouter, HTTPException

from models.schemas import ItineraryResponse, TripRequest
from services.itinerary_service import create_itinerary, get_itinerary, get_latest_itinerary

router = APIRouter(prefix="/itineraries", tags=["itineraries"])


@router.post("", response_model=ItineraryResponse)
def generate_itinerary(trip: TripRequest) -> ItineraryResponse:
    return create_itinerary(trip)


@router.get("/latest", response_model=ItineraryResponse)
def read_latest_itinerary() -> ItineraryResponse:
    itinerary = get_latest_itinerary()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="No itineraries found")
    return itinerary


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
def read_itinerary(itinerary_id: int) -> ItineraryResponse:
    itinerary = get_itinerary(itinerary_id)
    if itinerary is None:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itinerary

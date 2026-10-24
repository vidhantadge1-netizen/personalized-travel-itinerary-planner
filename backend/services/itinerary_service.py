import itertools
import logging
import time
from typing import Dict, Optional, Union

from ai.factory import get_ai_provider
from db.itinerary_repository import fetch_itinerary, fetch_latest_itinerary, save_itinerary
from db.schema_guard import get_verified_client
from models.schemas import ItineraryResponse, TripRequest

logger = logging.getLogger(__name__)

# In-memory fallback when Supabase is not configured or not verified.
_ITINERARIES: Dict[int, ItineraryResponse] = {}
_id_counter = itertools.count(1)


def create_itinerary(trip: TripRequest) -> ItineraryResponse:
    provider = get_ai_provider()
    # Temporary numeric ID for initial generation
    temp_id = int(time.time() * 1000)
    itinerary = provider.generate_itinerary(trip, temp_id)

    if get_verified_client() is not None:
        try:
            if save_itinerary(trip, itinerary):
                return itinerary
        except Exception as exc:
            logger.error("Failed to save itinerary to database: %s", exc)

    fallback_id = next(_id_counter)
    itinerary.id = fallback_id
    _ITINERARIES[fallback_id] = itinerary
    return itinerary


def get_itinerary(itinerary_id: Union[int, str]) -> Optional[ItineraryResponse]:
    try:
        numeric_id = int(itinerary_id)
    except (ValueError, TypeError):
        return None

    if get_verified_client() is not None:
        try:
            stored = fetch_itinerary(numeric_id)
            if stored is not None:
                return stored
        except Exception as exc:
            logger.error("Failed to fetch itinerary %s from database: %s", numeric_id, exc)

    return _ITINERARIES.get(numeric_id)


def get_latest_itinerary() -> Optional[ItineraryResponse]:
    if get_verified_client() is not None:
        try:
            stored = fetch_latest_itinerary()
            if stored is not None:
                return stored
        except Exception as exc:
            logger.error("Failed to fetch latest itinerary from database: %s", exc)

    if _ITINERARIES:
        latest_id = max(_ITINERARIES.keys())
        return _ITINERARIES.get(latest_id)
    return None


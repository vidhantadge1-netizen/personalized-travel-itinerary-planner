import unittest
from unittest.mock import MagicMock, patch

from db.itinerary_repository import fetch_itinerary, fetch_latest_itinerary, save_itinerary
from models.schemas import DayPlan, ItineraryResponse, TripRequest


class ItineraryPersistenceTests(unittest.TestCase):
    def test_schema_validates_and_stores_numeric_id(self):
        sample_id = 1000001
        sample_trip_id = 999999
        itin = ItineraryResponse(
            id=sample_id,
            trip_id=sample_trip_id,
            destination="Paris",
            days=3,
            summary="3-day cultural tour",
            provider="mock",
            plan=[DayPlan(day=1, title="Arrival", activities=["Check-in"])],
        )
        self.assertIsInstance(itin.id, int)
        self.assertEqual(itin.id, sample_id)
        self.assertEqual(itin.trip_id, sample_trip_id)

    def test_schema_rejects_non_numeric_id(self):
        with self.assertRaises(Exception):
            ItineraryResponse(
                id="not-a-number",
                destination="Paris",
                days=3,
                summary="3-day cultural tour",
                provider="mock",
                plan=[],
            )

    def test_fetch_itinerary_rejects_invalid_id(self):
        result = fetch_itinerary("invalid-id")
        self.assertIsNone(result)

    def test_save_itinerary_calls_supabase_with_numeric_ids(self):
        mock_client = MagicMock()
        mock_trips_table = MagicMock()
        mock_itin_table = MagicMock()

        # Mock database returning generated BIGINT ids
        mock_trips_table.insert.return_value.execute.return_value.data = [
            {"id": 999999, "destination": "Jaipur"}
        ]
        mock_itin_table.insert.return_value.execute.return_value.data = [
            {"id": 1, "trip_id": 999999}
        ]

        def table_selector(name):
            if name == "trips":
                return mock_trips_table
            if name == "itineraries":
                return mock_itin_table
            return MagicMock()

        mock_client.table.side_effect = table_selector

        with patch("db.itinerary_repository.get_verified_client", return_value=mock_client):
            trip_req = TripRequest(
                destination="Jaipur",
                days=3,
                budget="moderate",
                interests=["culture"],
                traveler_type="solo",
            )
            itin_resp = ItineraryResponse(
                id=0,
                destination="Jaipur",
                days=3,
                summary="Jaipur trip",
                provider="mock",
                plan=[DayPlan(day=1, title="Forts", activities=["Amber Fort"])],
            )
            success = save_itinerary(trip_req, itin_resp)
            self.assertTrue(success)

            # Verify trips insert payload does not force id (lets Postgres identity generate it)
            trip_insert_call = mock_trips_table.insert.call_args[0][0]
            self.assertNotIn("id", trip_insert_call)
            self.assertEqual(trip_insert_call["destination"], "Jaipur")

            # Verify itineraries insert payload references the returned db_trip_id 999999
            itin_insert_call = mock_itin_table.insert.call_args[0][0]
            self.assertEqual(itin_insert_call["trip_id"], 999999)
            self.assertEqual(itin_resp.id, 1)
            self.assertEqual(itin_resp.trip_id, 999999)

    def test_generate_and_reload_persisted_itinerary(self):
        """Simulate generating an itinerary, saving it to database, then refreshing/reloading it."""
        mock_client = MagicMock()
        mock_trips_table = MagicMock()
        mock_itin_table = MagicMock()

        # Mock database returning generated BIGINT ids
        mock_trips_table.insert.return_value.execute.return_value.data = [
            {"id": 999999, "destination": "Kyoto"}
        ]
        mock_itin_table.insert.return_value.execute.return_value.data = [
            {"id": 105, "trip_id": 999999}
        ]

        # Mock database select by ID (fetch_itinerary) and select latest (fetch_latest_itinerary)
        db_row = {
            "id": 105,
            "trip_id": 999999,
            "provider": "mock",
            "summary": "3-day Kyoto cultural journey",
            "plan": [{"day": 1, "title": "Temples", "activities": ["Kinkaku-ji"]}],
            "itinerary": [{"day": 1, "title": "Temples", "activities": ["Kinkaku-ji"]}],
            "trips": {"destination": "Kyoto", "days": 3},
        }
        mock_itin_table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            db_row
        ]
        mock_itin_table.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            db_row
        ]

        def table_selector(name):
            if name == "trips":
                return mock_trips_table
            if name == "itineraries":
                return mock_itin_table
            return MagicMock()

        mock_client.table.side_effect = table_selector

        with patch("db.itinerary_repository.get_verified_client", return_value=mock_client):
            trip_req = TripRequest(
                destination="Kyoto",
                days=3,
                budget="moderate",
                interests=["culture"],
                traveler_type="solo",
            )
            itin_resp = ItineraryResponse(
                id=0,
                destination="Kyoto",
                days=3,
                summary="3-day Kyoto cultural journey",
                provider="mock",
                plan=[DayPlan(day=1, title="Temples", activities=["Kinkaku-ji"])],
            )
            # Step 1: Save generated itinerary to database
            saved = save_itinerary(trip_req, itin_resp)
            self.assertTrue(saved)
            self.assertEqual(itin_resp.id, 105)
            self.assertEqual(itin_resp.trip_id, 999999)

            # Step 2: Simulate browser refresh/reload by ID (GET /itineraries/105)
            reloaded_by_id = fetch_itinerary(105)
            self.assertIsNotNone(reloaded_by_id)
            self.assertEqual(reloaded_by_id.id, 105)
            self.assertEqual(reloaded_by_id.trip_id, 999999)
            self.assertEqual(reloaded_by_id.destination, "Kyoto")
            self.assertEqual(reloaded_by_id.days, 3)
            self.assertEqual(len(reloaded_by_id.plan), 1)
            self.assertEqual(reloaded_by_id.plan[0].title, "Temples")

            # Step 3: Simulate browser reload or reopening Itinerary tab via latest
            reloaded_latest = fetch_latest_itinerary()
            self.assertIsNotNone(reloaded_latest)
            self.assertEqual(reloaded_latest.id, 105)
            self.assertEqual(reloaded_latest.trip_id, 999999)
            self.assertEqual(reloaded_latest.destination, "Kyoto")
            self.assertEqual(reloaded_latest.summary, "3-day Kyoto cultural journey")


if __name__ == "__main__":
    unittest.main()


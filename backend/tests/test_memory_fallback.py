import unittest
from unittest import mock

from fastapi.testclient import TestClient

from main import app


class MemoryFallbackTests(unittest.TestCase):
    def test_health_reports_supabase_not_configured(self):
        with unittest.mock.patch.dict("os.environ", {"SUPABASE_KEY": "", "SUPABASE_URL": ""}):
            client = TestClient(app)
            response = client.get("/health")
            self.assertEqual(response.status_code, 200)
            body = response.json()
            self.assertEqual(body["status"], "ok")
            self.assertEqual(body["supabase_status"], "not_configured")

    def test_create_and_get_itinerary_without_supabase(self):
        from ai.mock_provider import MockAIProvider

        with (
            unittest.mock.patch("services.itinerary_service.get_verified_client", return_value=None),
            unittest.mock.patch("services.itinerary_service.get_ai_provider", return_value=MockAIProvider()),
        ):
            client = TestClient(app)
            created = client.post(
                "/itineraries",
                json={
                    "destination": "Goa",
                    "days": 2,
                    "budget": "moderate",
                    "interests": ["food"],
                    "traveler_type": "solo",
                },
            )
            self.assertEqual(created.status_code, 200)
            payload = created.json()
            self.assertEqual(payload["provider"], "mock")
            fetched = client.get(f"/itineraries/{payload['id']}")
            self.assertEqual(fetched.status_code, 200)
            self.assertEqual(fetched.json()["destination"], "Goa")
            latest = client.get("/itineraries/latest")
            self.assertEqual(latest.status_code, 200)
            self.assertEqual(latest.json()["id"], payload["id"])
            self.assertEqual(latest.json()["destination"], "Goa")


if __name__ == "__main__":
    unittest.main()

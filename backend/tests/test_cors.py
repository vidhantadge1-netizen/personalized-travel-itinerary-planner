import unittest
from fastapi.testclient import TestClient

from main import app


class CorsConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_cors_allows_vercel_production_origin(self):
        for origin in [
            "https://personalized-travel-itinerary-plann-eta.vercel.app",
            "https://personalized-travel-itinerary-planner-eta.vercel.app",
        ]:
            response = self.client.options(
                "/itineraries",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "content-type",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers.get("access-control-allow-origin"), origin)


    def test_cors_allows_vercel_preview_domains(self):
        origin = "https://personalized-travel-itinerary-planner-git-main.vercel.app"
        response = self.client.options(
            "/itineraries",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), origin)

    def test_cors_allows_local_dev(self):
        origin = "http://localhost:5173"
        response = self.client.options(
            "/itineraries",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), origin)

    def test_cors_blocks_unauthorized_origins(self):
        origin = "https://unauthorized-travel-site.com"
        response = self.client.options(
            "/itineraries",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

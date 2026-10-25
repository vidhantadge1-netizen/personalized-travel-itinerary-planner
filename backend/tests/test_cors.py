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

    def test_cors_allows_get_health_from_vercel(self):
        origin = "https://personalized-travel-itinerary-plann-eta.vercel.app"
        response = self.client.get(
            "/health",
            headers={"Origin": origin},
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


    def test_cors_preflight_health_from_exact_vercel_origin(self):
        origin = "https://personalized-travel-itinerary-plann-eta.vercel.app"
        response = self.client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), origin)
        allow_methods = response.headers.get("access-control-allow-methods", "")
        for method in ["GET", "POST", "PUT", "DELETE", "OPTIONS"]:
            self.assertIn(method, allow_methods)

    def test_cors_preflight_allows_required_methods_and_headers(self):
        origin = "https://personalized-travel-itinerary-plann-eta.vercel.app"
        for method in ["GET", "POST", "PUT", "DELETE"]:
            response = self.client.options(
                "/itineraries",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": method,
                    "Access-Control-Request-Headers": "content-type, authorization",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers.get("access-control-allow-origin"), origin)

    def test_normalize_origin_trims_whitespace_and_slashes(self):
        from main import normalize_origin
        self.assertEqual(normalize_origin("  https://example.com/  "), "https://example.com")
        self.assertEqual(normalize_origin("https://example.com///"), "https://example.com")
        self.assertEqual(normalize_origin(""), "")


if __name__ == "__main__":
    unittest.main()

import json
import unittest
from unittest.mock import MagicMock, patch

from ai.factory import get_ai_provider
from ai.gemini_provider import GeminiAIProvider, GeneratedDayPlan, GeneratedItinerary
from ai.mock_provider import MockAIProvider
from models.schemas import TripRequest


class GeminiProviderTests(unittest.TestCase):
    def setUp(self):
        self.trip = TripRequest(
            destination="Rome",
            days=3,
            budget="moderate",
            interests=["history", "food"],
            traveler_type="couple",
        )

    def test_factory_returns_gemini_provider_when_configured(self):
        with patch.dict("os.environ", {"AI_PROVIDER": "gemini"}):
            provider = get_ai_provider()
            self.assertIsInstance(provider, GeminiAIProvider)
            self.assertEqual(provider.name, "gemini")

    def test_factory_returns_mock_provider_by_default(self):
        with patch.dict("os.environ", {"AI_PROVIDER": "mock"}):
            provider = get_ai_provider()
            self.assertIsInstance(provider, MockAIProvider)
            self.assertEqual(provider.name, "mock")

    def test_fallback_to_mock_when_api_key_is_missing(self):
        provider = GeminiAIProvider(api_key="")
        itinerary = provider.generate_itinerary(self.trip, 100)
        self.assertEqual(itinerary.id, 100)
        self.assertEqual(itinerary.destination, "Rome")
        self.assertEqual(itinerary.days, 3)
        self.assertEqual(len(itinerary.plan), 3)
        self.assertEqual(itinerary.provider, "mock")

    @patch("ai.gemini_provider.genai.Client")
    def test_successful_gemini_generation_and_validation(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        fake_itinerary = GeneratedItinerary(
            summary="A fantastic 3-day couple trip exploring Rome's historic wonders and local cuisine.",
            plan=[
                GeneratedDayPlan(
                    day=1,
                    title="Ancient Colosseum & Forum",
                    activities=["Tour the Colosseum", "Stroll through the Roman Forum", "Dinner in Monti"],
                    estimated_cost="moderate",
                ),
                GeneratedDayPlan(
                    day=2,
                    title="Vatican City & Trastevere",
                    activities=["Visit St. Peter's Basilica", "Vatican Museums", "Evening pasta in Trastevere"],
                    estimated_cost="moderate",
                ),
                GeneratedDayPlan(
                    day=3,
                    title="Pantheon & Borghese Gardens",
                    activities=["Explore the Pantheon", "Picnic at Villa Borghese", "Espresso near Piazza Navona"],
                    estimated_cost="moderate",
                ),
            ],
        )

        mock_response = MagicMock()
        mock_response.text = fake_itinerary.model_dump_json()
        mock_client.models.generate_content.return_value = mock_response

        provider = GeminiAIProvider(api_key="test-gemini-key")
        result = provider.generate_itinerary(self.trip, 42)

        self.assertEqual(result.id, 42)
        self.assertEqual(result.destination, "Rome")
        self.assertEqual(result.days, 3)
        self.assertEqual(result.provider, "gemini")
        self.assertIn("Colosseum", result.summary + result.plan[0].title)
        self.assertEqual(len(result.plan), 3)
        self.assertEqual(result.plan[0].day, 1)
        self.assertEqual(result.plan[0].activities, ["Tour the Colosseum", "Stroll through the Roman Forum", "Dinner in Monti"])

    @patch("ai.gemini_provider.genai.Client")
    def test_fallback_when_gemini_api_raises_exception(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.models.generate_content.side_effect = RuntimeError("Quota exceeded (429)")

        provider = GeminiAIProvider(api_key="test-gemini-key")
        result = provider.generate_itinerary(self.trip, 42)

        # Must fall back gracefully to mock provider without crashing
        self.assertEqual(result.id, 42)
        self.assertEqual(result.destination, "Rome")
        self.assertEqual(result.provider, "mock")
        self.assertEqual(len(result.plan), 3)

    @patch("ai.gemini_provider.genai.Client")
    def test_fallback_when_gemini_returns_invalid_json(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.text = "NOT JSON OUTPUT"
        mock_client.models.generate_content.return_value = mock_response

        provider = GeminiAIProvider(api_key="test-gemini-key")
        result = provider.generate_itinerary(self.trip, 42)

        # Must fall back gracefully to mock provider
        self.assertEqual(result.id, 42)
        self.assertEqual(result.provider, "mock")
        self.assertEqual(len(result.plan), 3)


if __name__ == "__main__":
    unittest.main()

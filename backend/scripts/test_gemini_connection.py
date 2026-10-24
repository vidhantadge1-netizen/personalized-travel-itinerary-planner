import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env", override=True)

from ai.gemini_provider import GeminiAIProvider
from models.schemas import TripRequest


def test_gemini_connection():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY") or ""
    model = os.getenv("AI_MODEL") or "gemini-3.5-flash-lite"

    print("=" * 60)
    print("Testing Google Gemini API Integration")
    print("=" * 60)
    print(f"Configured Model: {model}")

    if not api_key.strip():
        print("\n❌ GEMINI_API_KEY is currently empty in backend/.env.")
        print("To test real Gemini generation:")
        print("1. Get a free API key from Google AI Studio: https://aistudio.google.com/app/apikey")
        print("2. Add it to backend/.env:")
        print("   GEMINI_API_KEY=AIzaSy...")
        print("   AI_PROVIDER=gemini")
        print("3. Re-run this script: python scripts/test_gemini_connection.py")
        print("\nNote: When GEMINI_API_KEY is missing, the planner automatically uses the mock provider fallback.")
        return False

    print("\nAttempting live generation with Google GenAI SDK...")
    provider = GeminiAIProvider(api_key=api_key.strip(), model=model)
    trip = TripRequest(
        destination="Kyoto",
        days=2,
        budget="moderate",
        interests=["temples", "matcha"],
        traveler_type="solo",
    )

    result = provider.generate_itinerary(trip, itinerary_id=999)

    if result.provider == "gemini":
        print("\n✅ SUCCESS: Real Google Gemini API request succeeded!")
        print(f"Destination: {result.destination}")
        print(f"Summary: {result.summary}")
        print(f"Days generated: {len(result.plan)}")
        for day in result.plan:
            print(f"\n  Day {day.day}: {day.title}")
            for act in day.activities:
                print(f"   - {act}")
        return True
    else:
        print("\n⚠️ Generation completed via fallback (provider='mock'). Check the error logged above.")
        return False


if __name__ == "__main__":
    test_gemini_connection()

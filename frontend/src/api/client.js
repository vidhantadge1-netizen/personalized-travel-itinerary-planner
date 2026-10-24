const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error("Backend health check failed");
  }
  return response.json();
}

export async function generateItinerary(trip) {
  const response = await fetch(`${API_URL}/itineraries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not generate itinerary");
  }

  return response.json();
}

export async function getItinerary(itineraryId) {
  const response = await fetch(`${API_URL}/itineraries/${itineraryId}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Could not fetch itinerary with id ${itineraryId}`);
  }
  return response.json();
}

export async function getLatestItinerary() {
  const response = await fetch(`${API_URL}/itineraries/latest`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const detail = await response.text();
    throw new Error(detail || "Could not fetch latest itinerary");
  }
  return response.json();
}


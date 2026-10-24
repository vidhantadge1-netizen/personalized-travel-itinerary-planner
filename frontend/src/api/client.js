const rawApiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const API_URL = rawApiUrl.replace(/\/+$/, "");

export async function getHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed (${response.status})`);
    }
    return response.json();
  } catch (err) {
    throw new Error(`Unable to reach backend at ${API_URL}: ${err.message}`);
  }
}

export async function generateItinerary(trip) {
  let response;
  try {
    response = await fetch(`${API_URL}/itineraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    });
  } catch (err) {
    throw new Error(
      `Unable to reach backend at ${API_URL}. Check VITE_API_URL and CORS: ${err.message}`
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Could not generate itinerary (${response.status})`);
  }

  return response.json();
}

export async function getItinerary(itineraryId) {
  let response;
  try {
    response = await fetch(`${API_URL}/itineraries/${itineraryId}`);
  } catch (err) {
    throw new Error(`Unable to reach backend at ${API_URL}: ${err.message}`);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Could not fetch itinerary with id ${itineraryId}`);
  }
  return response.json();
}

export async function getLatestItinerary() {
  let response;
  try {
    response = await fetch(`${API_URL}/itineraries/latest`);
  } catch (err) {
    console.warn(`Could not reach backend at ${API_URL}:`, err.message);
    return null;
  }

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const detail = await response.text();
    throw new Error(detail || "Could not fetch latest itinerary");
  }
  return response.json();
}



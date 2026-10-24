# API

Base URL for local development: `http://127.0.0.1:8000`

Interactive docs: `http://127.0.0.1:8000/docs`

## `GET /health`

Checks that the API is running.

Example response:

```json
{
  "status": "ok",
  "ai_provider": "mock",
  "supabase_status": "not_configured",
  "supabase_detail": "Add your publishable key to backend/.env as SUPABASE_KEY."
}
```

`supabase_status` is `not_configured`, `not_ready`, or `ready`. Rows are
saved to Supabase only when it is `ready`.

## `POST /itineraries`

Generates an itinerary using the configured AI provider (mock for now).

Request body:

```json
{
  "destination": "Goa",
  "days": 3,
  "budget": "moderate",
  "interests": ["beaches", "food"],
  "traveler_type": "solo"
}
```

Example response (shape):

```json
{
  "id": "uuid",
  "destination": "Goa",
  "days": 3,
  "summary": "A 3-day moderate trip to Goa focused on beaches, food.",
  "provider": "mock",
  "plan": [
    {
      "day": 1,
      "title": "Day 1 in Goa",
      "activities": ["Morning: ...", "Afternoon: ...", "Evening: ..."],
      "estimated_cost": "moderate"
    }
  ]
}
```

## `GET /itineraries/{id}`

Returns an itinerary created earlier in this server process.

- `200` with the itinerary JSON
- `404` if the id is unknown

Restarting the backend clears this in-memory store until Supabase is connected.

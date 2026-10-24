from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import health, itineraries

app = FastAPI(
    title="Personalized Travel Itinerary Planner",
    description="College project API. AI calls go through a provider-independent adapter.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(itineraries.router)


@app.get("/")
def root() -> dict:
    return {
        "message": "Personalized Travel Itinerary Planner API",
        "docs": "/docs",
        "health": "/health",
    }

import os
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


def normalize_origin(origin: str) -> str:
    """Trim whitespace and remove trailing slashes from an origin URL."""
    return origin.strip().rstrip("/") if origin else ""


# Allowed origins for local dev, Vercel production and preview deployments
raw_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://personalized-travel-itinerary-plann-eta.vercel.app",
    "https://personalized-travel-itinerary-plann.vercel.app",
    "https://personalized-travel-itinerary-planner-eta.vercel.app",
    "https://personalized-travel-itinerary-planner.vercel.app",
]

default_origins = [
    normalize_origin(o) for o in raw_default_origins if normalize_origin(o)
]

env_origins = [
    normalize_origin(o)
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if normalize_origin(o)
]
frontend_url = normalize_origin(os.getenv("FRONTEND_URL", ""))
if frontend_url and frontend_url not in default_origins:
    env_origins.append(frontend_url)

allowed_origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://[a-zA-Z0-9_-]+\.vercel\.app$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
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
        "version": "0.2.0-cors-fixed",
        "allowed_origins": allowed_origins,
    }


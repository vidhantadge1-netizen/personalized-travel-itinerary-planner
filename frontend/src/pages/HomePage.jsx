import React from "react";
import {
  SparklesIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  BookmarkIcon,
  CheckCircleIcon,
} from "../components/Icons.jsx";
import {
  HERO_BANNER_IMAGE,
  POPULAR_DESTINATIONS,
  getDestinationImage,
} from "../utils/destinations.js";

export default function HomePage({
  health,
  healthError,
  onCheckHealth,
  onNavigate,
  onSelectInspiration,
  latestItinerary,
  savedTrips = [],
  onOpenItinerary,
}) {
  const hasRealData = Boolean(savedTrips.length > 0 || latestItinerary);
  const totalTripsCount = savedTrips.length > 0
    ? savedTrips.length
    : latestItinerary
    ? 1
    : 0;

  // Active latest trip to highlight
  const activeLatest =
    latestItinerary || (savedTrips.length > 0 ? savedTrips[0] : null);

  // Recent trips up to 3
  const recentList = savedTrips.length > 0
    ? savedTrips.slice(0, 3)
    : latestItinerary
    ? [latestItinerary]
    : [];

  return (
    <div className="home-dashboard">
      {/* 1. Welcoming Hero Section */}
      <section className="hero-section" aria-label="Welcome Hero">
        <div className="hero-media-wrap">
          <img
            src={HERO_BANNER_IMAGE}
            alt="Scenic luxury travel destination"
            className="hero-background-img"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80";
            }}
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge-pill">
            <SparklesIcon size={14} className="sparkle-gold" />
            <span>AI-Powered Travel Intelligence</span>
          </div>

          <h1 className="hero-headline">Your Next Adventure Starts Here</h1>
          <p className="hero-subtitle">
            Plan personalized trips with the power of AI.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary btn-hero-cta"
              onClick={() => onNavigate("planner")}
            >
              <SparklesIcon size={18} />
              <span>Plan a New Trip</span>
            </button>

            {totalTripsCount > 0 && (
              <button
                type="button"
                className="secondary btn-hero-saved"
                onClick={() => onNavigate("saved")}
              >
                <BookmarkIcon size={16} />
                <span>View Saved Trips ({totalTripsCount})</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Real Data Summary Cards (Only shown if reliable data is available) */}
      {hasRealData && (
        <section className="stats-section" aria-label="Trip Statistics">
          <div className="stats-grid">
            {/* Total Trips */}
            <div className="stat-card">
              <div className="stat-icon-wrap blue">
                <BookmarkIcon size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Saved Itineraries</span>
                <span className="stat-value">{totalTripsCount}</span>
                <span className="stat-subtext">Persisted in Supabase</span>
              </div>
            </div>

            {/* Latest Destination Highlight */}
            {activeLatest && (
              <div className="stat-card highlight-card">
                <div className="stat-icon-wrap indigo">
                  <MapPinIcon size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Latest Itinerary</span>
                  <span className="stat-value truncate">{activeLatest.destination}</span>
                  <span className="stat-subtext">
                    {activeLatest.days} Days · {activeLatest.provider || "AI"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-stat-action"
                  onClick={() => onOpenItinerary(activeLatest.id)}
                  title="Open this itinerary"
                  aria-label={`Open itinerary for ${activeLatest.destination}`}
                >
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            )}

            {/* AI Engine Status */}
            <div className="stat-card">
              <div className="stat-icon-wrap green">
                <SparklesIcon size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">AI Generation Engine</span>
                <span className="stat-value">
                  {health?.ai_provider ? "Gemini AI" : "Gemini 3.5"}
                </span>
                <span className="stat-subtext">
                  FastAPI · {health?.supabase_status === "ready" ? "Supabase Online" : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Recent Itineraries Section (if reliable data available) */}
      {recentList.length > 0 && (
        <section className="recent-section" aria-label="Recent Itineraries">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Recent Itineraries</h2>
              <p className="section-subtitle">
                Pick up where you left off with your AI-generated travel schedules.
              </p>
            </div>
            {savedTrips.length > 3 && (
              <button
                type="button"
                className="secondary btn-view-all"
                onClick={() => onNavigate("saved")}
              >
                <span>View All ({savedTrips.length})</span>
                <ArrowRightIcon size={14} />
              </button>
            )}
          </div>

          <div className="recent-grid">
            {recentList.map((item) => {
              const photo = getDestinationImage(item.destination);
              return (
                <div key={item.id} className="recent-card">
                  <div className="recent-card-img-wrap">
                    <img
                      src={photo}
                      alt={item.destination}
                      className="recent-card-img"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
                      }}
                    />
                    <div className="recent-card-overlay" />
                    <span className="recent-card-days">
                      <CalendarIcon size={12} />
                      <span>{item.days} {item.days === 1 ? "Day" : "Days"}</span>
                    </span>
                  </div>

                  <div className="recent-card-body">
                    <h3 className="recent-card-title">{item.destination}</h3>
                    <p className="recent-card-snippet">{item.summary}</p>
                    <div className="recent-card-footer">
                      <span className="recent-provider-tag">
                        <SparklesIcon size={12} />
                        <span>{item.provider || "gemini"}</span>
                      </span>
                      <button
                        type="button"
                        className="btn-open-recent"
                        onClick={() => onOpenItinerary(item.id)}
                      >
                        <span>View Plan</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Popular Destinations & Travel Inspiration */}
      <section className="inspiration-section" aria-label="Travel Inspiration">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Popular Destinations to Inspire You</h2>
            <p className="section-subtitle">
              Select any destination to jumpstart your personalized Gemini AI itinerary.
            </p>
          </div>
        </div>

        <div className="inspiration-grid">
          {POPULAR_DESTINATIONS.map((dest) => (
            <div
              key={dest.destination}
              className="inspiration-card"
              onClick={() => onSelectInspiration && onSelectInspiration(dest)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectInspiration && onSelectInspiration(dest);
                }
              }}
              aria-label={`Plan trip to ${dest.destination}`}
            >
              <div className="inspiration-media">
                <img
                  src={dest.image}
                  alt={dest.destination}
                  className="inspiration-img"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
                <div className="inspiration-gradient" />
                <span className="inspiration-country">{dest.country}</span>
              </div>

              <div className="inspiration-info">
                <div className="inspiration-header-row">
                  <h3 className="inspiration-name">{dest.destination}</h3>
                  <span className="inspiration-duration">{dest.days} Days</span>
                </div>
                <p className="inspiration-tagline">{dest.tagline}</p>
                <div className="inspiration-footer">
                  <span className="inspiration-cta">
                    <span>Plan Itinerary</span>
                    <ArrowRightIcon size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Backend Health & System Status Bar */}
      <section className="system-health-card" aria-label="Backend Diagnostics">
        <div className="health-left">
          <div className="health-status-badge">
            <span className="pulse-indicator" />
            <span className="health-title">System Status:</span>
            <span className="health-val">
              {health ? "Operational" : "Checking..."}
            </span>
          </div>
          {health && (
            <p className="health-detail">
              Backend: <strong>{health.status}</strong> · AI Provider:{" "}
              <strong>{health.ai_provider}</strong> · Supabase:{" "}
              <strong>{health.supabase_status}</strong>
            </p>
          )}
          {healthError && <p className="health-error-text">⚠️ {healthError}</p>}
        </div>

        <button
          type="button"
          className="secondary btn-check-health"
          onClick={onCheckHealth}
          title="Verify API and Database health"
        >
          <RefreshCwIcon size={14} />
          <span>Verify Health</span>
        </button>
      </section>
    </div>
  );
}

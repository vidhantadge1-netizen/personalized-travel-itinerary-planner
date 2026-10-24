import React, { useState } from "react";
import {
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  Trash2Icon,
  SearchIcon,
  ArrowRightIcon,
  BookmarkIcon,
} from "../components/Icons.jsx";
import { getDestinationImage } from "../utils/destinations.js";

export default function SavedTripsPage({
  savedTrips = [],
  onSelectTrip,
  onDeleteTrip,
  onPlanNew,
  onLookupById,
  lookupLoading = false,
  lookupError = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [lookupIdInput, setLookupIdInput] = useState("");

  const filteredTrips = savedTrips.filter((item) => {
    if (!searchQuery.trim()) return true;
    const dest = (item.destination || "").toLowerCase();
    const summary = (item.summary || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return dest.includes(query) || summary.includes(query);
  });

  function handleLookupSubmit(e) {
    e.preventDefault();
    const cleanId = lookupIdInput.trim();
    if (!cleanId) return;
    if (onLookupById) {
      onLookupById(cleanId);
    }
  }

  return (
    <div className="saved-trips-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Saved Itineraries</h1>
          <p className="page-subtitle">
            Revisit your custom AI-crafted travel plans stored in your cloud account.
          </p>
        </div>
        <button
          type="button"
          className="primary btn-plan-new-header"
          onClick={() => onPlanNew && onPlanNew()}
        >
          <SparklesIcon size={16} />
          <span>Plan a New Trip</span>
        </button>
      </div>

      {/* Database ID Direct Lookup Utility */}
      <div className="lookup-box-card">
        <form onSubmit={handleLookupSubmit} className="lookup-form">
          <div className="lookup-input-group">
            <label htmlFor="lookup-id-input" className="lookup-label">
              <span>Open Itinerary by Database ID</span>
            </label>
            <div className="lookup-controls">
              <input
                id="lookup-id-input"
                type="number"
                placeholder="Enter trip ID (e.g. 15)..."
                value={lookupIdInput}
                onChange={(e) => setLookupIdInput(e.target.value)}
                className="lookup-input"
                min="1"
              />
              <button
                type="submit"
                className="secondary btn-lookup"
                disabled={!lookupIdInput.trim() || lookupLoading}
              >
                {lookupLoading ? "Fetching..." : "Fetch from Database"}
              </button>
            </div>
          </div>
        </form>
        {lookupError && <p className="lookup-error-msg">⚠️ {lookupError}</p>}
      </div>

      {/* Search & Filter Bar */}
      {savedTrips.length > 0 && (
        <div className="search-filter-bar">
          <div className="search-input-wrap">
            <SearchIcon size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by destination (e.g. Goa, Paris)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Filter saved trips"
            />
          </div>
          <span className="results-count">
            Showing {filteredTrips.length} of {savedTrips.length} saved trips
          </span>
        </div>
      )}

      {/* Grid of Saved Trips */}
      {filteredTrips.length > 0 ? (
        <div className="saved-trips-grid">
          {filteredTrips.map((trip) => {
            const photo = getDestinationImage(trip.destination);
            return (
              <div key={trip.id} className="saved-trip-card">
                <div className="saved-card-media">
                  <img
                    src={photo}
                    alt={trip.destination}
                    className="saved-card-img"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div className="saved-card-gradient" />
                  <div className="saved-card-badge-row">
                    <span className="badge-saved-duration">
                      <CalendarIcon size={12} />
                      <span>{trip.days} {trip.days === 1 ? "Day" : "Days"}</span>
                    </span>
                    {trip.id && (
                      <span className="badge-saved-id">ID #{trip.id}</span>
                    )}
                  </div>
                </div>

                <div className="saved-card-body">
                  <h3 className="saved-card-title">{trip.destination}</h3>
                  <p className="saved-card-summary">{trip.summary}</p>

                  <div className="saved-card-meta">
                    <span className="saved-card-provider">
                      <SparklesIcon size={12} />
                      <span>
                        {trip.provider === "gemini" ? "Gemini AI" : trip.provider || "AI"}
                      </span>
                    </span>
                    {trip.plan && (
                      <span className="saved-card-activities-count">
                        {trip.plan.length} days scheduled
                      </span>
                    )}
                  </div>

                  <div className="saved-card-actions">
                    <button
                      type="button"
                      className="primary btn-open-itinerary"
                      onClick={() => onSelectTrip(trip.id)}
                    >
                      <span>Open Itinerary</span>
                      <ArrowRightIcon size={14} />
                    </button>
                    {onDeleteTrip && (
                      <button
                        type="button"
                        className="btn-delete-saved"
                        onClick={() => onDeleteTrip(trip.id)}
                        title="Remove from saved list"
                        aria-label={`Remove ${trip.destination} from saved list`}
                      >
                        <Trash2Icon size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : savedTrips.length > 0 ? (
        <div className="no-matches-card">
          <p>No saved trips match "{searchQuery}".</p>
          <button
            type="button"
            className="secondary"
            onClick={() => setSearchQuery("")}
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="empty-saved-state">
          <div className="empty-saved-icon">
            <BookmarkIcon size={44} />
          </div>
          <h2>No Saved Trips Yet</h2>
          <p>
            When you generate a travel itinerary with Gemini AI, it will be automatically
            saved and accessible here.
          </p>
          <button
            type="button"
            className="primary btn-empty-cta"
            onClick={() => onPlanNew && onPlanNew()}
          >
            <SparklesIcon size={16} />
            <span>Plan Your First Trip</span>
          </button>
        </div>
      )}
    </div>
  );
}

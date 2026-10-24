import React, { useState, useEffect } from "react";
import {
  MapPinIcon,
  CalendarIcon,
  WalletIcon,
  UsersIcon,
  SparklesIcon,
  CompassIcon,
} from "./Icons.jsx";

const PRESET_INTERESTS = [
  { id: "beaches", label: "Beaches & Coastal", emoji: "🏖️" },
  { id: "food", label: "Food & Culinary", emoji: "🍜" },
  { id: "culture", label: "History & Culture", emoji: "🏛️" },
  { id: "adventure", label: "Adventure & Hiking", emoji: "🏔️" },
  { id: "shopping", label: "Shopping & Bazaars", emoji: "🛍️" },
  { id: "art", label: "Art & Museums", emoji: "🎨" },
  { id: "nightlife", label: "Nightlife & Music", emoji: "🌙" },
  { id: "wellness", label: "Wellness & Spa", emoji: "🧘" },
  { id: "photography", label: "Scenic Photography", emoji: "📸" },
  { id: "nature", label: "Nature & Wildlife", emoji: "🌿" },
];

const BUDGET_OPTIONS = [
  {
    id: "budget",
    title: "Budget",
    desc: "Hostels, street food & smart transit",
    icon: "🪙",
  },
  {
    id: "moderate",
    title: "Moderate",
    desc: "Boutique stays, local dining & tours",
    icon: "💳",
  },
  {
    id: "luxury",
    title: "Luxury",
    desc: "5-star resorts, fine dining & private guides",
    icon: "✨",
  },
];

const TRAVELER_OPTIONS = [
  { id: "solo", title: "Solo", desc: "Independent discovery", icon: "👤" },
  { id: "couple", title: "Couple", desc: "Romantic & relaxed", icon: "👥" },
  { id: "family", title: "Family", desc: "Kid-friendly & flexible", icon: "👨‍👩‍👧‍👦" },
  { id: "friends", title: "Friends", desc: "Lively & group fun", icon: "🎒" },
];

const POPULAR_SUGGESTIONS = [
  "Goa",
  "Tokyo",
  "Paris",
  "Bali",
  "Swiss Alps",
  "New York",
  "Rome",
];

const LOADING_STEPS = [
  "Analyzing your traveler profile and style...",
  "Consulting Gemini AI for hidden gems & attractions...",
  "Structuring custom day-by-day schedule & activities...",
  "Calculating realistic cost brackets and timings...",
  "Saving your verified itinerary to Supabase...",
];

export default function TripForm({ onSubmit, loading, initialValues }) {
  const [destination, setDestination] = useState(initialValues?.destination || "Goa");
  const [days, setDays] = useState(initialValues?.days || 3);
  const [budget, setBudget] = useState(initialValues?.budget || "moderate");
  const [travelerType, setTravelerType] = useState(initialValues?.traveler_type || "solo");
  const [interests, setInterests] = useState(
    Array.isArray(initialValues?.interests)
      ? initialValues.interests
      : ["beaches", "food"]
  );
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Sync with initialValues if they change externally (e.g. user clicked inspiration on home)
  useEffect(() => {
    if (initialValues?.destination) setDestination(initialValues.destination);
    if (initialValues?.days) setDays(initialValues.days);
    if (initialValues?.budget) setBudget(initialValues.budget);
    if (initialValues?.traveler_type) setTravelerType(initialValues.traveler_type);
    if (Array.isArray(initialValues?.interests) && initialValues.interests.length > 0) {
      setInterests(initialValues.interests);
    }
  }, [initialValues]);

  // Animated loading step ticker while Gemini is generating
  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingStepIndex(0);
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  function toggleInterest(id) {
    if (loading) return;
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleAddCustomInterest(e) {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const trimmed = customInterestInput.trim().toLowerCase();
      if (trimmed && !interests.includes(trimmed)) {
        setInterests((prev) => [...prev, trimmed]);
        setCustomInterestInput("");
      }
    }
  }

  function removeInterest(tag) {
    if (loading) return;
    setInterests((prev) => prev.filter((item) => item !== tag));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    const trimmedDest = destination.trim();
    if (!trimmedDest) {
      setValidationError("Please enter a travel destination (e.g. Goa, Tokyo, Paris).");
      return;
    }

    const numericDays = Number(days);
    if (isNaN(numericDays) || numericDays < 1 || numericDays > 14) {
      setValidationError("Trip duration must be between 1 and 14 days.");
      return;
    }

    setValidationError("");

    const finalInterests =
      interests.length > 0 ? interests : ["sightseeing", "local exploration"];

    onSubmit({
      destination: trimmedDest,
      days: numericDays,
      budget,
      traveler_type: travelerType,
      interests: finalInterests,
    });
  }

  return (
    <div className="trip-form-card">
      {loading ? (
        <div className="generator-loading-state" role="status" aria-live="polite">
          <div className="loading-animation-container">
            <div className="pulsing-compass">
              <CompassIcon size={48} className="spin-slow" />
            </div>
            <div className="glowing-ai-ring" />
          </div>

          <div className="loading-content">
            <span className="badge-ai-generating">
              <SparklesIcon size={14} /> Gemini AI Generation in Progress
            </span>
            <h2 className="loading-headline">
              Crafting your {days}-day itinerary for {destination}...
            </h2>
            <p className="loading-step-text">
              {LOADING_STEPS[loadingStepIndex]}
            </p>

            <div className="loading-progress-bar">
              <div className="loading-progress-indeterminate" />
            </div>
            <p className="loading-subtext">
              Gemini AI models your personalized schedule and saves it securely to Supabase.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-container" noValidate>
          {validationError && (
            <div className="form-error-banner" role="alert">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Section 1: Destination */}
          <div className="form-section">
            <label htmlFor="destination-input" className="form-label">
              <span className="label-icon-wrapper">
                <MapPinIcon size={18} />
              </span>
              <span className="label-title">Where do you want to go?</span>
              <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="destination-input"
                name="destination"
                type="text"
                placeholder="e.g. Goa, Tokyo, Paris, Bali, Swiss Alps..."
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (validationError) setValidationError("");
                }}
                required
                disabled={loading}
                className="destination-input"
              />
            </div>

            {/* Quick destination suggestion pills */}
            <div className="suggestion-pills-row">
              <span className="suggestion-label">Popular destinations:</span>
              <div className="suggestion-pills">
                {POPULAR_SUGGESTIONS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`suggestion-pill ${
                      destination.toLowerCase() === city.toLowerCase() ? "selected" : ""
                    }`}
                    onClick={() => {
                      setDestination(city);
                      if (validationError) setValidationError("");
                    }}
                    disabled={loading}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Days Duration */}
          <div className="form-section">
            <div className="duration-header">
              <label htmlFor="days-slider" className="form-label">
                <span className="label-icon-wrapper">
                  <CalendarIcon size={18} />
                </span>
                <span className="label-title">Trip Duration</span>
              </label>
              <div className="days-counter-pill">
                <span className="counter-val">{days}</span>
                <span className="counter-unit">{days === 1 ? "Day" : "Days"}</span>
              </div>
            </div>

            <div className="days-slider-container">
              <button
                type="button"
                className="step-btn"
                onClick={() => setDays((prev) => Math.max(1, prev - 1))}
                disabled={days <= 1 || loading}
                aria-label="Decrease trip days"
              >
                −
              </button>
              <input
                id="days-slider"
                type="range"
                min="1"
                max="14"
                step="1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={loading}
                className="days-range-slider"
                aria-label="Trip duration slider (1 to 14 days)"
              />
              <button
                type="button"
                className="step-btn"
                onClick={() => setDays((prev) => Math.min(14, prev + 1))}
                disabled={days >= 14 || loading}
                aria-label="Increase trip days"
              >
                +
              </button>
            </div>
            <div className="slider-ticks">
              <span>1 day</span>
              <span>7 days</span>
              <span>14 days</span>
            </div>
          </div>

          {/* Section 3: Budget Selection */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon-wrapper">
                <WalletIcon size={18} />
              </span>
              <span className="label-title">Select Your Budget Style</span>
            </label>
            <div className="options-grid three-col" role="radiogroup" aria-label="Budget options">
              {BUDGET_OPTIONS.map((item) => {
                const isSelected = budget === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setBudget(item.id)}
                    disabled={loading}
                  >
                    <div className="option-card-header">
                      <span className="option-icon">{item.icon}</span>
                      <span className="option-title">{item.title}</span>
                    </div>
                    <p className="option-desc">{item.desc}</p>
                    <div className="option-check-circle" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Traveler Type */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon-wrapper">
                <UsersIcon size={18} />
              </span>
              <span className="label-title">Who is traveling?</span>
            </label>
            <div className="options-grid four-col" role="radiogroup" aria-label="Traveler type">
              {TRAVELER_OPTIONS.map((item) => {
                const isSelected = travelerType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setTravelerType(item.id)}
                    disabled={loading}
                  >
                    <div className="option-card-header">
                      <span className="option-icon">{item.icon}</span>
                      <span className="option-title">{item.title}</span>
                    </div>
                    <p className="option-desc">{item.desc}</p>
                    <div className="option-check-circle" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Interests & Experiences */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon-wrapper">
                <SparklesIcon size={18} />
              </span>
              <span className="label-title">What are you interested in?</span>
              <span className="label-helper-inline">(Select all that match)</span>
            </label>

            <div className="interests-chip-grid" role="group" aria-label="Trip interests">
              {PRESET_INTERESTS.map((item) => {
                const isSelected = interests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    className={`interest-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleInterest(item.id)}
                    disabled={loading}
                  >
                    <span className="chip-emoji">{item.emoji}</span>
                    <span className="chip-text">{item.label}</span>
                    {isSelected && <span className="chip-active-mark">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom tags input */}
            <div className="custom-interest-row">
              <input
                type="text"
                placeholder="Add custom interest (e.g. Scuba, Wine tasting, Coffee)..."
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                onKeyDown={handleAddCustomInterest}
                disabled={loading}
                className="custom-interest-input"
                aria-label="Add custom interest"
              />
              <button
                type="button"
                className="secondary btn-add-custom"
                onClick={handleAddCustomInterest}
                disabled={!customInterestInput.trim() || loading}
              >
                + Add Tag
              </button>
            </div>

            {/* Selected tags list */}
            {interests.length > 0 && (
              <div className="selected-tags-container">
                <span className="tags-label">Active interests:</span>
                <div className="active-tags-list">
                  {interests.map((tag) => (
                    <span key={tag} className="tag-pill">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="btn-remove-tag"
                        onClick={() => removeInterest(tag)}
                        title={`Remove ${tag}`}
                        aria-label={`Remove interest ${tag}`}
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="primary btn-generate-trip"
              disabled={loading || !destination.trim()}
            >
              <SparklesIcon size={18} />
              <span>Generate AI Itinerary with Gemini</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

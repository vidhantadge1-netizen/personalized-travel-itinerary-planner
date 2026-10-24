import React from "react";
import { CompassIcon, SparklesIcon, BookmarkIcon, MapPinIcon } from "./Icons.jsx";

export default function Navbar({
  activePage,
  onNavigate,
  savedCount = 0,
  hasActiveItinerary = false,
  health,
  onCheckHealth,
}) {
  const pages = [
    { id: "home", label: "Dashboard" },
    { id: "planner", label: "Plan Trip" },
    {
      id: "itinerary",
      label: "Current Itinerary",
      badge: hasActiveItinerary ? "Active" : null,
    },
    {
      id: "saved",
      label: "Saved Trips",
      badge: savedCount > 0 ? String(savedCount) : null,
    },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <div
          className="brand"
          onClick={() => onNavigate("home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate("home");
          }}
          aria-label="WanderAI Home"
        >
          <div className="brand-logo">
            <CompassIcon size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">WanderAI</span>
            <span className="brand-subtitle">AI Travel Planner</span>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main Navigation">
          {pages.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="nav-actions">
          <div
            className="ai-pill"
            title={
              health
                ? `FastAPI: ${health.status} | AI: ${health.ai_provider} | DB: ${health.supabase_status}`
                : "AI Travel Intelligence Powered by Google Gemini"
            }
          >
            <span className="status-indicator-dot" />
            <SparklesIcon size={14} className="ai-pill-icon" />
            <span className="ai-pill-text">
              {health?.ai_provider ? `Gemini AI` : "Gemini AI"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

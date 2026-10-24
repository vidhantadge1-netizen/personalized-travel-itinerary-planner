import React from "react";
import ItineraryCard from "../components/ItineraryCard.jsx";
import { CompassIcon } from "../components/Icons.jsx";

export default function ItineraryPage({
  itinerary,
  loading,
  onNavigateHome,
  onPlanNew,
}) {
  return (
    <div className="itinerary-page-container">
      {loading ? (
        <div className="itinerary-loading-card" role="status" aria-live="polite">
          <div className="loading-spinner-wrap">
            <CompassIcon size={36} className="spin-slow" />
          </div>
          <h3>Loading Itinerary...</h3>
          <p>Retrieving persisted travel plan from the Supabase database.</p>
        </div>
      ) : (
        <ItineraryCard
          itinerary={itinerary}
          onNavigateHome={onNavigateHome}
          onPlanNew={onPlanNew}
        />
      )}
    </div>
  );
}

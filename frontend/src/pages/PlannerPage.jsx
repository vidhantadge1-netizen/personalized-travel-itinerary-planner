import React from "react";
import TripForm from "../components/TripForm.jsx";
import { SparklesIcon } from "../components/Icons.jsx";

export default function PlannerPage({
  onGenerate,
  loading,
  error,
  initialValues,
}) {
  return (
    <div className="planner-page-container">
      <div className="planner-page-header">
        <span className="badge-pill planner-tag">
          <SparklesIcon size={14} />
          <span>AI Itinerary Generator</span>
        </span>
        <h1 className="planner-headline">Craft Your Dream Travel Plan</h1>
        <p className="planner-description">
          Tell Gemini AI your travel preferences, duration, and interests. We'll craft a
          personalized day-by-day schedule, suggest curated activities, and store your
          itinerary securely in the cloud.
        </p>
      </div>

      {error && (
        <div className="error-alert-banner" role="alert">
          <div className="error-alert-content">
            <strong>Generation Notice:</strong> {error}
          </div>
        </div>
      )}

      <TripForm
        onSubmit={onGenerate}
        loading={loading}
        initialValues={initialValues}
      />
    </div>
  );
}

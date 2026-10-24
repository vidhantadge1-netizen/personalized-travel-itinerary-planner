import { useEffect, useState } from "react";
import {
  generateItinerary,
  getHealth,
  getItinerary,
  getLatestItinerary,
} from "./api/client.js";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ItineraryPage from "./pages/ItineraryPage.jsx";
import PlannerPage from "./pages/PlannerPage.jsx";
import SavedTripsPage from "./pages/SavedTripsPage.jsx";

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem("active_page") || "home");
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialPlannerValues, setInitialPlannerValues] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Saved trips list initialized from localStorage
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const stored = localStorage.getItem("saved_trips");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync saved trip helper
  function addOrUpdateSavedTrip(item) {
    if (!item || !item.id) return;
    setSavedTrips((prev) => {
      const existingIdx = prev.findIndex(
        (t) => String(t.id) === String(item.id)
      );
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = item;
      } else {
        updated = [item, ...prev];
      }
      try {
        localStorage.setItem("saved_trips", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save trips to localStorage:", err);
      }
      return updated;
    });
  }

  function handleDeleteSavedTrip(id) {
    setSavedTrips((prev) => {
      const updated = prev.filter((item) => String(item.id) !== String(id));
      try {
        localStorage.setItem("saved_trips", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not update saved trips:", err);
      }
      return updated;
    });
  }

  async function loadPersistedItinerary(preferredId = null) {
    const idToFetch = preferredId || localStorage.getItem("last_itinerary_id");
    setLoadingItinerary(true);
    try {
      if (idToFetch) {
        try {
          const item = await getItinerary(idToFetch);
          if (item) {
            setItinerary(item);
            addOrUpdateSavedTrip(item);
            return item;
          }
        } catch (fetchErr) {
          console.warn("Could not fetch itinerary by id:", fetchErr);
        }
      }
      const latest = await getLatestItinerary();
      if (latest) {
        setItinerary(latest);
        localStorage.setItem("last_itinerary_id", String(latest.id));
        addOrUpdateSavedTrip(latest);
        return latest;
      }
    } catch (err) {
      console.warn("No persisted itinerary could be retrieved:", err);
    } finally {
      setLoadingItinerary(false);
    }
    return null;
  }

  // Load backend health and latest persisted itinerary on mount
  useEffect(() => {
    handleCheckHealth();
    loadPersistedItinerary();
  }, []);

  function handleNavigate(targetPage) {
    setPage(targetPage);
    localStorage.setItem("active_page", targetPage);
    if (targetPage === "itinerary" && !itinerary) {
      loadPersistedItinerary();
    }
  }

  async function handleCheckHealth() {
    setHealthError("");
    try {
      const data = await getHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setHealthError(err.message || "Failed to reach backend");
    }
  }

  async function handleGenerate(trip) {
    setLoading(true);
    setError("");
    try {
      const result = await generateItinerary(trip);
      setItinerary(result);
      if (result?.id) {
        localStorage.setItem("last_itinerary_id", String(result.id));
        addOrUpdateSavedTrip(result);
      }
      localStorage.setItem("active_page", "itinerary");
      setPage("itinerary");
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // When user selects an itinerary from home or saved trips
  async function handleOpenItinerary(id) {
    if (!id) return;
    setLoadingItinerary(true);
    try {
      const item = await getItinerary(id);
      if (item) {
        setItinerary(item);
        addOrUpdateSavedTrip(item);
        localStorage.setItem("last_itinerary_id", String(item.id));
        handleNavigate("itinerary");
      }
    } catch (err) {
      console.warn("Could not fetch selected itinerary:", err);
      // Fallback: check if we already have it in savedTrips
      const found = savedTrips.find((t) => String(t.id) === String(id));
      if (found) {
        setItinerary(found);
        handleNavigate("itinerary");
      }
    } finally {
      setLoadingItinerary(false);
    }
  }

  // Direct database ID lookup from Saved Trips page
  async function handleLookupById(id) {
    setLookupLoading(true);
    setLookupError("");
    try {
      const found = await getItinerary(id);
      if (found) {
        setItinerary(found);
        addOrUpdateSavedTrip(found);
        localStorage.setItem("last_itinerary_id", String(found.id));
        handleNavigate("itinerary");
      } else {
        setLookupError(`No itinerary found with ID #${id}`);
      }
    } catch (err) {
      setLookupError(err.message || `Could not fetch itinerary #${id}`);
    } finally {
      setLookupLoading(false);
    }
  }

  // Quick fill from inspiration cards on home page
  function handleSelectInspiration(dest) {
    setInitialPlannerValues({
      destination: dest.destination,
      days: dest.days,
      budget: dest.budget,
      traveler_type: dest.traveler_type,
      interests: dest.interests,
    });
    handleNavigate("planner");
  }

  return (
    <div className="app-layout">
      <Navbar
        activePage={page}
        onNavigate={handleNavigate}
        savedCount={savedTrips.length}
        hasActiveItinerary={Boolean(itinerary)}
        health={health}
        onCheckHealth={handleCheckHealth}
      />

      <main className="main-content" id="main-content">
        {page === "home" && (
          <HomePage
            health={health}
            healthError={healthError}
            onCheckHealth={handleCheckHealth}
            onNavigate={handleNavigate}
            onSelectInspiration={handleSelectInspiration}
            latestItinerary={itinerary}
            savedTrips={savedTrips}
            onOpenItinerary={handleOpenItinerary}
          />
        )}

        {page === "planner" && (
          <PlannerPage
            onGenerate={handleGenerate}
            loading={loading}
            error={error}
            initialValues={initialPlannerValues}
          />
        )}

        {page === "itinerary" && (
          <ItineraryPage
            itinerary={itinerary}
            loading={loadingItinerary}
            onNavigateHome={() => handleNavigate("home")}
            onPlanNew={() => handleNavigate("planner")}
          />
        )}

        {page === "saved" && (
          <SavedTripsPage
            savedTrips={savedTrips}
            onSelectTrip={handleOpenItinerary}
            onDeleteTrip={handleDeleteSavedTrip}
            onPlanNew={() => handleNavigate("planner")}
            onLookupById={handleLookupById}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
          />
        )}
      </main>

      <footer className="app-footer no-print">
        <div className="footer-container">
          <p className="footer-brand">
            <strong>WanderAI</strong> · Personalized AI Travel Itinerary Planner
          </p>
          <p className="footer-credits">
            Powered by <strong>Google Gemini 3.5 Flash</strong>, FastAPI, and Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
}

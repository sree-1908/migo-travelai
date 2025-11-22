// agents/budgetAgent.js

const { estimateCostForPlace } = require("../utils/costEstimator");

/**
 * Budget Agent
 * ------------
 * Takes:
 * - places (from placesAgent)
 * - budget (number, e.g. 1500)
 * - travelStyle (optional string)
 *
 * Returns a simple 1-day itinerary:
 * - morning, afternoon, evening slots
 * - estimated total attraction cost
 */

function budgetAgent(placesResult, budget, travelStyle) {
  if (!placesResult || !placesResult.ok || !Array.isArray(placesResult.places)) {
    return {
      ok: false,
      error: "No valid places data passed to budgetAgent",
    };
  }

  const effectiveBudget = budget || 1500; // default if not provided
  const places = placesResult.places;

  // Filter out obvious hotels etc.
  let visitable = places.filter((p) => {
    const t = (p.tourism || "").toLowerCase();
    const name = (p.name || "").toLowerCase();

    if (t === "hotel" || name.includes("hotel")) return false;
    return true;
  });

  // If nothing left after filtering, fall back to *all* places
  if (visitable.length === 0) {
    visitable = places;
  }

  if (visitable.length === 0) {
    return {
      ok: false,
      error: "No suitable attractions to build an itinerary",
    };
  }

  // Simple approach:
  // Pick up to 3 places for morning, afternoon, evening in order.
  const selected = visitable.slice(0, 3);

  let totalAttractionCost = 0;
  const slots = {
    morning: null,
    afternoon: null,
    evening: null,
  };

  const slotNames = ["morning", "afternoon", "evening"];

  selected.forEach((place, index) => {
    const { costCategory, estimatedCost } = estimateCostForPlace(place);
    if (costCategory === "skip") return;

    totalAttractionCost += estimatedCost;

    const slotKey = slotNames[index] || "evening";

    slots[slotKey] = {
      name: place.name,
      tourism: place.tourism,
      amenity: place.amenity,
      costCategory,
      estimatedCost,
    };
  });

  const remainingBudget = effectiveBudget - totalAttractionCost;

  return {
    ok: true,
    budget: effectiveBudget,
    estimatedAttractionCost: totalAttractionCost,
    remainingBudget,
    travelStyle: travelStyle || null,
    slots,
  };
}

module.exports = budgetAgent;

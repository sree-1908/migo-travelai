// utils/costEstimator.js

/**
 * Very simple heuristic cost estimator for a place.
 * This is NOT real pricing, just categories to build a budget-friendly plan.
 */

function estimateCostForPlace(place) {
  const t = (place.tourism || "").toLowerCase();
  const l = (place.leisure || "").toLowerCase();
  const a = (place.amenity || "").toLowerCase();
  const name = (place.name || "").toLowerCase();

  // Default
  let costCategory = "low";
  let estimatedCost = 100; // INR

  // Nature / parks / free-ish stuff
  if (l === "park" || name.includes("park") || name.includes("lake") || name.includes("garden")) {
    costCategory = "free_or_cheap";
    estimatedCost = 50;
  }

  // Museums, attractions, temples typically moderate
  if (
    t === "attraction" ||
    t === "museum" ||
    a === "place_of_worship" ||
    name.includes("museum") ||
    name.includes("temple") ||
    name.includes("palace")
  ) {
    costCategory = "moderate";
    estimatedCost = 200;
  }

  // If it's a zoo, safari, or very big thing, make it higher
  if (name.includes("safari") || name.includes("national park") || name.includes("zoo")) {
    costCategory = "higher";
    estimatedCost = 400;
  }

  // Hotels are not "attractions" for daytime visits in our plan
    // Hotels can still be visited (cafes, rooftops, etc.), treat them as moderate cost
  if (t === "hotel" || name.includes("hotel")) {
    costCategory = "moderate";
    estimatedCost = 200;
  }


  return { costCategory, estimatedCost };
}

module.exports = { estimateCostForPlace };

// agents/parserAgent.js

/**
 * Migo's Parser Agent
 * -------------------
 * This agent reads the user's query string and tries to understand:
 * - placeName          : where the user wants to go
 * - budget             : how much they want to spend (in number)
 * - wantsWeather       : are they asking about weather/temperature?
 * - wantsPlaces        : are they asking about places to visit?
 * - wantsItinerary     : are they asking for a plan/itinerary?
 * - travelStyle        : optional hint, like "peaceful", "adventurous", etc.
 */

function parseBudget(text) {
  const lower = text.toLowerCase();

  // Only treat numbers as budget if there is a budget-like phrase
  // Examples: under 1500, within 1000, budget 800, less than 2000
  const budgetPattern =
    /(under|within|below|less than|upto|up to|budget|around|about)\s+(\d[\d,]*)/i;

  const match = lower.match(budgetPattern);
  if (!match) return null;

  const rawNum = match[2].replace(/,/g, "");
  const value = parseInt(rawNum, 10);
  if (Number.isNaN(value)) return null;

  return value;
}

function cleanPlaceCandidate(candidate) {
  if (!candidate) return null;

  // Remove common time words like "tomorrow", "today", "tonight" etc.
  let cleaned = candidate.replace(
    /\b(today|tomorrow|tonight|next week|this weekend|next weekend)\b/gi,
    ""
  );

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function parsePlaceName(text) {
  const cleanText = text.replace(/\s+/g, " ");

  // 1) Patterns like "to Bangalore", "in Bangalore", "for Bangalore", "at Bangalore"
  const placeRegex =
    /\b(?:to|in|for|at)\s+([A-Za-z\s]+?)(?:[,.!?]| under| within| with| on| tomorrow| today|$)/i;
  let match = cleanText.match(placeRegex);
  if (match && match[1]) {
    return cleanPlaceCandidate(match[1]);
  }

  // 2) Patterns like "near Hyderabad", "around Mysore"
  const nearRegex =
    /\b(?:near|around)\s+([A-Za-z\s]+?)(?:[,.!?]| under| within| with| on| tomorrow| today|$)/i;
  match = cleanText.match(nearRegex);
  if (match && match[1]) {
    return cleanPlaceCandidate(match[1]);
  }

  // 3) Patterns like "going to Kolkata", "go to Chennai tomorrow"
  const goRegex =
    /\bgo(?:ing)?\s+to\s+([A-Za-z\s]+?)(?:[,.!?]| under| within| with| on| tomorrow| today|$)/i;
  match = cleanText.match(goRegex);
  if (match && match[1]) {
    return cleanPlaceCandidate(match[1]);
  }

  return null;
}

function detectIntents(text) {
  const lower = text.toLowerCase();

  const wantsWeather =
    lower.includes("weather") ||
    lower.includes("temperature") ||
    lower.includes("temp") ||
    lower.includes("hot") ||
    lower.includes("cold") ||
    lower.includes("rain");

  let wantsPlaces =
    lower.includes("places to visit") ||
    lower.includes("places i can visit") ||
    lower.includes("tourist") ||
    lower.includes("attractions") ||
    lower.includes("see") ||
    lower.includes("visit");

  let wantsItinerary =
    lower.includes("itinerary") ||
    lower.includes("plan my trip") ||
    lower.includes("plan a trip") ||
    lower.includes("1 day trip") ||
    lower.includes("one day trip") ||
    lower.includes("day plan") ||
    lower.includes("trip plan");

  // Extra heuristic: "plan" + "trip" anywhere in the text
  if (lower.includes("plan") && lower.includes("trip")) {
    wantsItinerary = true;
  }

  return { wantsWeather, wantsPlaces, wantsItinerary };
}

function detectTravelStyle(text) {
  const lower = text.toLowerCase();

  if (lower.includes("peaceful") || lower.includes("calm") || lower.includes("relax"))
    return "relaxed";
  if (lower.includes("adventure") || lower.includes("trek") || lower.includes("thrill"))
    return "adventurous";
  if (lower.includes("nature") || lower.includes("green") || lower.includes("park"))
    return "nature";
  if (lower.includes("history") || lower.includes("heritage") || lower.includes("museum"))
    return "cultural";

  return null; // general
}

function parserAgent(userQuery) {
  const rawQuery = (userQuery || "").trim();
  const clean = rawQuery.replace(/\s+/g, " ");

  const budget = parseBudget(clean);
  const placeName = parsePlaceName(clean);
  const intents = detectIntents(clean);
  const travelStyle = detectTravelStyle(clean);

  // If user didn't specify any intent, assume they want places + itinerary
  if (!intents.wantsWeather && !intents.wantsPlaces && !intents.wantsItinerary) {
    intents.wantsPlaces = true;
    intents.wantsItinerary = true;
  }

  // If they asked for an itinerary, they implicitly care about places too
  if (intents.wantsItinerary && !intents.wantsPlaces) {
    intents.wantsPlaces = true;
  }
  const lower = rawQuery.toLowerCase();

// very simple: if user mentions "tomorrow", we treat it as tomorrow's forecast
const when =
  lower.includes("tomorrow") || lower.includes("tmrw") ? "tomorrow" : "today";


  return {
    rawQuery,
    placeName,
    budget,
    ...intents,
    travelStyle,
    when,
  };
}

module.exports = parserAgent;

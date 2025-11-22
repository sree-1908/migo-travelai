// agents/orchestrator.js
const parserAgent = require("./parserAgent");
const geocodeAgent = require("./geocodeAgent");
const weatherAgent = require("./weatherAgent");
const placesAgent = require("./placesAgent");
const budgetAgent = require("./budgetAgent");

// Helper to pick a nice city label
function getCityLabel(parsed, geoResult) {
  if (geoResult && geoResult.ok && geoResult.displayName) {
    return geoResult.displayName.split(",")[0]; // e.g. "Bengaluru"
  }
  if (parsed.placeName) return parsed.placeName;
  return "this place";
}

async function orchestrator(userQuery) {
  const parsed = parserAgent(userQuery);

  let geoResult = null;
  let weatherResult = null;
  let placesResult = null;
  let itineraryResult = null;

  // Build a friendly preference summary from parsed info
  function buildPreferenceLine() {
    const parts = [];

    if (parsed.placeName) {
      parts.push(`a day in **${parsed.placeName}**`);
    }

    if (parsed.budget) {
      parts.push(`around **₹${parsed.budget}**`);
    }

    if (parsed.travelStyle === "relaxed") {
      parts.push("with a calm, relaxed vibe");
    } else if (parsed.travelStyle === "adventurous") {
      parts.push("with something a bit adventurous");
    }

    if (!parsed.wantsWeather && parsed.wantsPlaces && !parsed.wantsItinerary) {
      parts.push("mainly to explore places to visit");
    } else if (parsed.wantsItinerary) {
      parts.push("with a clear 1-day plan");
    }

    if (parts.length === 0) return null;

    const first = parts[0];
    const rest = parts.slice(1);
    let text = first;
    if (rest.length > 0) {
      text += " " + rest.map((p) => p.replace(/^with /, "with")).join(", ");
    }

    return `Got it — you’re looking for ${text}. Let me plan around that.`;
  }

  const preferenceLine = buildPreferenceLine();

  // --- GEOCODING ---
  if (parsed.placeName) {
    geoResult = await geocodeAgent(parsed.placeName);
  }

  const cityLabel = getCityLabel(parsed, geoResult);

  // If user gave a place but geocoding failed
  if (parsed.placeName && (!geoResult || !geoResult.ok)) {
    const lines = [];
    lines.push("👋 Hi, I’m Migo, your travel companion.");
    lines.push("");
    lines.push(
      `I tried to look up “${parsed.placeName}”, but I couldn’t find it or the location service blocked me.`
    );
    lines.push("Can you try another nearby city or rephrase the place name?");

    return {
      answer: lines.join("\n"),
      parsed,
      geocode: geoResult,
      weather: weatherResult,
      places: placesResult,
      itinerary: itineraryResult,
    };
  }

  // --- WEATHER ---
  if (parsed.wantsWeather && geoResult && geoResult.ok) {
    weatherResult = await weatherAgent(geoResult.lat, geoResult.lon);
  }

  // --- PLACES ---
  if (parsed.wantsPlaces && geoResult && geoResult.ok) {
    placesResult = await placesAgent(geoResult.lat, geoResult.lon);
  }

  // --- ITINERARY / BUDGET ---
  if (
    parsed.wantsItinerary &&
    placesResult &&
    placesResult.ok &&
    Array.isArray(placesResult.places) &&
    placesResult.places.length > 0
  ) {
    itineraryResult = budgetAgent(placesResult, parsed.budget, parsed.travelStyle);
  }

  // --- BUILD NATURAL ANSWER ---

  const lines = [];
  lines.push("👋 Hi, I’m Migo, your travel companion.");
  lines.push("");

  if (preferenceLine) {
    lines.push(preferenceLine);
    lines.push("");
  }

  // CASE 1: WEATHER ONLY
  if (parsed.wantsWeather && !parsed.wantsPlaces && !parsed.wantsItinerary) {
    if (weatherResult && weatherResult.ok) {
      const temp = weatherResult.temperatureC.toFixed(1);
      const desc = weatherResult.description;
      const rainText =
        weatherResult.rainChance != null
          ? ` with about ${weatherResult.rainChance}% chance of rain`
          : "";

      lines.push(
        `In **${cityLabel}** it’s currently around **${temp}°C**, ${desc}${rainText}.`
      );
    } else {
      lines.push(
        `I tried to fetch the weather for **${cityLabel}**, but the weather service failed.`
      );
    }

    return {
      answer: lines.join("\n"),
      parsed,
      geocode: geoResult,
      weather: weatherResult,
      places: placesResult,
      itinerary: itineraryResult,
    };
  }

  // CASE 2: PLACES ONLY
  if (parsed.wantsPlaces && !parsed.wantsWeather && !parsed.wantsItinerary) {
    if (placesResult && placesResult.ok && placesResult.places.length > 0) {
      lines.push(`Here are some places you can visit in and around **${cityLabel}**:`);
      lines.push("");
      placesResult.places.forEach((p, index) => {
        lines.push(`   ${index + 1}. **${p.name}**`);
      });
    } else if (placesResult && placesResult.ok && placesResult.places.length === 0) {
      lines.push(
        `I couldn’t find clear tourist spots near **${cityLabel}**, but I can still help you plan a day there.`
      );
    } else {
      lines.push(
        `I tried to look up attractions around **${cityLabel}**, but there was an issue contacting the places service.`
      );
    }

    return {
      answer: lines.join("\n"),
      parsed,
      geocode: geoResult,
      weather: weatherResult,
      places: placesResult,
      itinerary: itineraryResult,
    };
  }

  // CASE 3: WEATHER + PLACES (+ ITINERARY)
  // This covers “plan my trip”, “1 day trip under X”, “weather and places I can visit”, etc.

  // Weather part
  if (parsed.wantsWeather) {
    if (weatherResult && weatherResult.ok) {
      const temp = weatherResult.temperatureC.toFixed(1);
      const desc = weatherResult.description;
      const rainText =
        weatherResult.rainChance != null
          ? ` with about ${weatherResult.rainChance}% chance of rain`
          : "";

      lines.push(
        `In **${cityLabel}** it’s currently around **${temp}°C**, ${desc}${rainText}.`
      );
      lines.push("");
    } else {
      lines.push(
        `I tried to fetch the weather for **${cityLabel}**, but the weather service failed.`
      );
      lines.push("");
    }
  }

  // Places part
  if (parsed.wantsPlaces) {
    if (placesResult && placesResult.ok && placesResult.places.length > 0) {
      lines.push("Here are some places you can go:");
      lines.push("");
      placesResult.places.forEach((p, index) => {
        lines.push(`   ${index + 1}. **${p.name}**`);
      });
      lines.push("");
    } else if (placesResult && placesResult.ok && placesResult.places.length === 0) {
      lines.push(
        `I couldn’t find specific attractions near **${cityLabel}**, but I can still suggest a general plan.`
      );
      lines.push("");
    } else {
      lines.push(
        `I tried to fetch nearby attractions around **${cityLabel}**, but the places service failed.`
      );
      lines.push("");
    }
  }

  // Itinerary part (if requested)
  if (parsed.wantsItinerary) {
    if (itineraryResult && itineraryResult.ok) {
      const s = itineraryResult.slots;
      const hasAnySlot = s.morning || s.afternoon || s.evening;

      if (hasAnySlot) {
        const isBudgeted = !!itineraryResult.budget;
        const budgetLine = isBudgeted
          ? `Here’s a simple 1-day **budget-friendly** plan for **${cityLabel}**:`
          : `Here’s a simple 1-day plan for **${cityLabel}**:`;

        lines.push(budgetLine);

        if (s.morning) {
          lines.push(
            `   🌅 Morning: **${s.morning.name}** (approx ₹${s.morning.estimatedCost})`
          );
        }
        if (s.afternoon) {
          lines.push(
            `   🌤 Afternoon: **${s.afternoon.name}** (approx ₹${s.afternoon.estimatedCost})`
          );
        }
        if (s.evening) {
          lines.push(
            `   🌆 Evening: **${s.evening.name}** (approx ₹${s.evening.estimatedCost})`
          );
        }

        if (isBudgeted) {
          lines.push(
            `   💰 Estimated attraction spend: ~₹${itineraryResult.estimatedAttractionCost}`
          );
          lines.push(
            `   💸 Your budget: ₹${itineraryResult.budget} · Left for food & travel: ~₹${Math.max(
              itineraryResult.remainingBudget,
              0
            )}`
          );
        }

        lines.push("");
      } else {
        lines.push(
          "I couldn’t build a detailed hour-by-hour plan, but those places are a good starting point for a 1-day trip."
        );
        lines.push("");
      }
    } else {
      lines.push(
        "I tried to build a day plan, but there wasn’t enough attraction data to create a full itinerary."
      );
      lines.push("");
    }
  }

  // Fallback if nothing above added meaningful content (very unlikely)
  if (lines.length <= 2) {
    lines.push(
      "Tell me where you’re going and what matters to you (budget, peaceful, must-see spots), and I’ll plan around that. 🙂"
    );
  }

  return {
    answer: lines.join("\n"),
    parsed,
    geocode: geoResult,
    weather: weatherResult,
    places: placesResult,
    itinerary: itineraryResult,
  };
}

module.exports = orchestrator;

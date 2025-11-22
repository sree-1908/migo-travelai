// agents/geocodeAgent.js

const axios = require("axios");

/**
 * Geocode Agent
 * -------------
 * Uses Nominatim (OpenStreetMap) to convert a place name like "Bangalore"
 * into coordinates (lat, lon) and a nice display name.
 */

async function geocodeAgent(placeName) {
  const trimmed = (placeName || "").trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "No place name provided to geocodeAgent",
    };
  }

  const url = "https://nominatim.openstreetmap.org/search";

  try {
    const response = await axios.get(url, {
      params: {
        q: trimmed,
        format: "json",
        limit: 1,
      },
      headers: {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MigoTravel/1.0 (contact: gayatrisreeja19@gmail.com)"
},

    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return {
        ok: false,
        notFound: true,
        error: `No results found for "${trimmed}"`,
      };
    }

    const best = data[0];

    return {
      ok: true,
      placeNameInput: trimmed,
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
      displayName: best.display_name,
      raw: best,
    };
  } catch (err) {
    console.error("Error in geocodeAgent:", err.message);

    return {
      ok: false,
      error: "Failed to contact geocoding service",
      details: err.message,
    };
  }
}

module.exports = geocodeAgent;

// agents/placesAgent.js

const axios = require("axios");

/**
 * Places Agent
 * ------------
 * Uses Overpass API (OpenStreetMap) to find tourist attractions
 * around the given coordinates.
 *
 * We try to focus on REAL attractions:
 * - tourism = attraction, museum, gallery, zoo, theme_park, viewpoint, hotel
 * - historic = * (forts, palaces, etc.)
 * - leisure = park, garden
 */

async function placesAgent(lat, lon) {
  if (lat == null || lon == null) {
    return {
      ok: false,
      error: "Missing coordinates for placesAgent",
    };
  }

  const radiusMeters = 15000;

  const overpassQuery = `
    [out:json][timeout:25];
    (
      // Real attractions
      node(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|gallery|zoo|theme_park|viewpoint|hotel"];
      way(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|gallery|zoo|theme_park|viewpoint|hotel"];
      relation(around:${radiusMeters},${lat},${lon})["tourism"~"attraction|museum|gallery|zoo|theme_park|viewpoint|hotel"];

      // Famous historical places
      node(around:${radiusMeters},${lat},${lon})["historic"];
      way(around:${radiusMeters},${lat},${lon})["historic"];
      relation(around:${radiusMeters},${lat},${lon})["historic"];

      // Parks & gardens
      node(around:${radiusMeters},${lat},${lon})["leisure"~"park|garden"];
      way(around:${radiusMeters},${lat},${lon})["leisure"~"park|garden"];
      relation(around:${radiusMeters},${lat},${lon})["leisure"~"park|garden"];
    );
    out center 40;
  `;

  try {
    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      overpassQuery,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );

    const data = response.data;

    if (!data.elements || data.elements.length === 0) {
      return {
        ok: true,
        places: [],
        rawCount: 0,
      };
    }

    const mapped = data.elements
      .map((el) => {
        const tags = el.tags || {};
        const name = tags.name;
        if (!name) return null;

        const tourism = tags.tourism || null;
        const leisure = tags.leisure || null;
        const amenity = tags.amenity || null;
        const historic = tags.historic || null;

        // Compute a simple "priority score" so famous attractions
        // come before generic hotels, etc.
        let score = 0;

        if (historic) score += 3; // forts, palaces, monuments
        if (
          tourism === "attraction" ||
          tourism === "museum" ||
          tourism === "gallery" ||
          tourism === "zoo" ||
          tourism === "theme_park" ||
          tourism === "viewpoint"
        ) {
          score += 3;
        }

        if (leisure === "park" || leisure === "garden") {
          score += 2;
        }

        if (tourism === "hotel") {
          score += 1; // keep but lower priority
        }

        // Very generic religious places (no tourism tag) can be noisy.
        const lowerName = name.toLowerCase();
        if (
          amenity === "place_of_worship" &&
          !tourism && // only skip if it's *just* a local religious place
          (lowerName.includes("masjid") ||
            lowerName.includes("mosque") ||
            lowerName.includes("darga") ||
            lowerName.includes("church"))
        ) {
          return null;
        }

        return {
          id: el.id,
          name,
          tourism,
          leisure,
          amenity,
          historic,
          lat: el.lat || (el.center && el.center.lat) || null,
          lon: el.lon || (el.center && el.center.lon) || null,
          score,
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) {
      return {
        ok: true,
        places: [],
        rawCount: 0,
      };
    }

    // Sort by score (best attractions first)
    const sorted = mapped.sort((a, b) => b.score - a.score);

    // Take top 5
    const topPlaces = sorted.slice(0, 5).map(({ score, ...rest }) => rest);

    return {
      ok: true,
      places: topPlaces,
      rawCount: mapped.length,
    };
  } catch (err) {
    console.error("Error in placesAgent:", err.message);
    return {
      ok: false,
      error: "Failed to contact places service",
      details: err.message,
    };
  }
}

module.exports = placesAgent;

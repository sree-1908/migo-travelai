// agents/weatherAgent.js

const axios = require("axios");

/**
 * Weather Agent
 * -------------
 * Uses Open-Meteo to fetch current weather + rain probability.
 */

function mapWeatherCodeToDescription(code) {

  if (code === 0) return "clear sky";
  if ([1, 2].includes(code)) return "mainly clear";
  if (code === 3) return "overcast";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55].includes(code)) return "drizzle";
  if ([61, 63, 65].includes(code)) return "rain";
  if ([71, 73, 75].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorms";

  return "variable conditions";
}

async function weatherAgent(lat, lon) {
  if (lat == null || lon == null) {
    return {
      ok: false,
      error: "Missing coordinates for weatherAgent",
    };
  }

  const url = "https://api.open-meteo.com/v1/forecast";

  try {
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: "precipitation_probability",
        timezone: "auto",
      },
    });

    const data = response.data;

    if (!data.current_weather) {
      return {
        ok: false,
        error: "No current weather data returned",
      };
    }

    const temperatureC = data.current_weather.temperature;
    const weatherCode = data.current_weather.weathercode;
    const description = mapWeatherCodeToDescription(weatherCode);

    let rainChance = null;
    if (
      data.hourly &&
      Array.isArray(data.hourly.precipitation_probability) &&
      data.hourly.precipitation_probability.length > 0
    ) {
      // Just take the first value as a simple approximation
      rainChance = data.hourly.precipitation_probability[0];
    }

    return {
      ok: true,
      temperatureC,
      rainChance,
      description,
      raw: data,
    };
  } catch (err) {
    console.error("Error in weatherAgent:", err.message);
    return {
      ok: false,
      error: "Failed to contact weather service",
      details: err.message,
    };
  }
}

module.exports = weatherAgent;

 Migo · Multi-Agent Travel AI Companion

Migo is a multi-agent tourism system 

It acts as a smart, budget-aware travel companion that understands natural language, fetches real-time data from open APIs, and plans simple 1-day trips.

 What Migo Can Do

Ask Migo things like:

- `Plan a calm 1 day trip to Mysore under 1200 and tell me the weather and places I should visit.`
- `Suggest 5 tourist attractions near Bangalore`
- `I’m going to Kolkata tomorrow, what’s the temperature and chance of rain there?`
- `Plan a 1 day trip to Pondicherry under 900`

Migo will:

- Detect the city, budget, intent (weather / places / itinerary), and travel style (e.g. “peaceful” → relaxed).
- Use Nominatim to geocode the place into coordinates.
- Use Open-Meteo to fetch today’s weather**.
- Use Overpass (OpenStreetMap) to fetch nearby tourist-like places.
- Build a simple 1-day budget-friendly itinerary (morning / afternoon / evening) that fits within your budget.

The UI is a small chat interface where Migo introduces itself, suggests sample prompts, and responds like a friendly human travel buddy.


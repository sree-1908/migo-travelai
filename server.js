// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");

const orchestrator = require("./agents/orchestrator");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Migo backend is running 🚀" });
});

// Main AI route
app.post("/api/query", async (req, res) => {
  try {
    const userQuery = (req.body.query || "").trim();

    if (!userQuery) {
      return res.status(400).json({
        error: "Missing 'query' in request body",
      });
    }

    const migoResponse = await orchestrator(userQuery);

    return res.json(migoResponse);
  } catch (err) {
    console.error("Error in /api/query:", err);
    return res.status(500).json({
      error: "Migo ran into a problem while processing your request.",
      details: err.message,
    });
  }
});

// (Frontend will be added later)
// app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`✅ Migo backend running at http://localhost:${PORT}`);
});

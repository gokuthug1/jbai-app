const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Simplified CORS for now
app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`;

// When a request hits /api/server, Vercel routes it here with a path of "/"
app.post('/', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }

  try {
    const { contents } = req.body;
    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${API_KEY}`,
      { contents },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error proxying to Google API:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch response from the AI model.",
      error: error.response?.data?.error || "An internal server error occurred.",
    });
  }
});

module.exports = app;
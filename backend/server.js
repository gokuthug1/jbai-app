// Import necessary packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express app
const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'https://jbai-app.vercel.app',
  'http://localhost:3000', 
  'http://127.0.0.1:5500' 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Use middleware IN THE CORRECT ORDER
app.use(cors(corsOptions));
app.use(express.json());

// --- Environment Variables & API Configuration ---
const API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`;

// --- Health Check Route ---
// This will be accessible at https://jbai-app.vercel.app/api/
app.get("/", (req, res) => {
  res.json({
    message: "Backend server is alive!",
    apiKeyLoaded: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});

// --- API Route ---
// Vercel's rewrite rule sends requests for "/api/generate" to this function
// with the path "/generate", so we listen for "/generate".
app.post('/generate', async (req, res) => {
  if (!API_KEY) {
    console.error("API key is missing on request to /generate");
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }

  try {
    const { contents, systemInstruction } = req.body;

    if (!Array.isArray(contents)) {
        return res.status(400).json({ message: "Invalid request format: 'contents' must be an array." });
    }

    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${API_KEY}`,
      { contents, systemInstruction },
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

// --- Export the app for Vercel ---
// This is the crucial part that allows Vercel to handle the app as a serverless function.
module.exports = app;
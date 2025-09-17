// Import necessary packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express app
const app = express();

// --- CORS Configuration ---
// Let's make this more robust for debugging.
// This will explicitly allow your frontend and also work for local testing.
const allowedOrigins = [
  'https://jbai-app.vercel.app',
  'http://localhost:3000', // In case you test locally
  'http://127.0.0.1:5500' // For VS Code Live Server
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

// Use middleware IN THE CORRECT ORDER
app.use(cors(corsOptions)); // Use your specific options here
app.use(express.json());   // Then, enable the server to parse JSON

// --- Environment Variables & API Configuration ---
const API_KEY = process.env.GOOGLE_API_KEY;
const PORT = process.env.PORT || 3000;
// Updated model to a generally available and performant one.
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

// --- NEW DEBUGGING ROUTE (Health Check) ---
// This will help us see if the server is alive and if the API key is loaded.
app.get("/", (req, res) => {
  res.json({
    message: "Backend server is alive!",
    apiKeyLoaded: !!API_KEY, // This will be true if the key is loaded, false otherwise
    timestamp: new Date().toISOString()
  });
});

// --- API Route ---
app.post('/api/generate', async (req, res) => {
  // NEW DEBUGGING: Check for API key on every request
  if (!API_KEY) {
    console.error("API key is missing on request to /api/generate");
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }

  try {
    const { contents, systemInstruction } = req.body;

    // Validate that contents is an array before sending
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
    // Enhanced error logging
    console.error("Error proxying to Google API:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch response from the AI model.",
      error: error.response?.data?.error || "An internal server error occurred.",
    });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on port ${PORT}`);
  if (!API_KEY) {
    console.warn("⚠️  Warning: GOOGLE_API_KEY is not set in the environment variables.");
  }
});

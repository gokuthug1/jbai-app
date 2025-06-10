// Import necessary packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // This loads the variables from .env into process.env

// Initialize the Express app
const app = express();

// Use middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the server to parse JSON request bodies

// Get the API key and Port from environment variables
const API_KEY = process.env.GOOGLE_API_KEY;
const PORT = process.env.PORT || 3000;

// Check if the API key is available
if (!API_KEY) {
  console.error("FATAL ERROR: GOOGLE_API_KEY is not defined in the .env file.");
  process.exit(1); // Exit the application if the key is missing
}

// Define the Google API URL
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;

// Create a POST endpoint to proxy requests to the Google Gemini API
app.post('/api/generate', async (req, res) => {
  try {
    // The client will send the 'contents' and 'systemInstruction' in the request body
    const { contents, systemInstruction } = req.body;

    // Make a POST request to the actual Google API
    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${API_KEY}`,
      {
        contents,
        systemInstruction,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Send the response from the Google API back to our client
    res.json(response.data);

  } catch (error) {
    console.error("Error proxying to Google API:", error.response ? error.response.data : error.message);
    // Send a detailed error back to the client
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch response from the AI model.",
      error: error.response?.data?.error || "An internal server error occurred.",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;
// Using a stable and widely available model.
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

app.post('/api/server', async (req, res) => {
  // Check if the API key is configured on the server
  if (!GOOGLE_API_KEY) {
    console.error("Server configuration error: GOOGLE_API_KEY is missing.");
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }

  try {
    // --- FIX: Receive BOTH contents and systemInstruction from the frontend ---
    const { contents, systemInstruction } = req.body;

    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      // --- FIX: Send BOTH objects to the Google Gemini API ---
      { contents, systemInstruction },
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json(response.data);

  } catch (error) {
    // Provide more detailed error logging for easier debugging on Vercel
    console.error("Error calling Google API:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    res.status(error.response?.status || 500).json({ 
        message: "Failed to fetch from the AI model.",
        details: error.response?.data || "No additional details available."
    });
  }
});

export default app;

import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`;

app.post('/api/server', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    console.error("Server configuration error: GOOGLE_API_KEY is missing.");
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }

  try {
    const { contents, systemInstruction, toolsConfig } = req.body;

    if (!contents) {
        return res.status(400).json({ message: "Bad Request: 'contents' field is missing." });
    }

    // Construct Tools Array based on frontend settings
    const tools = [];
    if (toolsConfig?.googleSearch) {
        tools.push({ googleSearch: {} });
    }
    if (toolsConfig?.codeExecution) {
        tools.push({ codeExecution: {} });
    }

    // Construct Payload
    const payload = {
        contents,
        systemInstruction,
        // Only attach tools if enabled
        ...(tools.length > 0 && { tools })
    };

    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Error calling Google API:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    res.status(error.response?.status || 500).json({ 
        message: "Failed to fetch from the AI model.",
        details: error.response?.data || "No additional details available."
    });
  }
});

export default app;
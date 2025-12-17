import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'; // Added for local development

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;

const MODEL_NAME = 'gemini-2.5-flash'; 
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

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

    const tools = [];
    if (toolsConfig?.googleSearch) {
        tools.push({ googleSearch: {} });
    }
    if (toolsConfig?.codeExecution) {
        tools.push({ codeExecution: {} });
    }

    const payload = {
        contents,
        systemInstruction,
        // Only attach tools property if the array is not empty
        ...(tools.length > 0 && { tools })
    };

    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.json(response.data);

  } catch (error) {
    // Enhanced error logging
    const status = error.response?.status || 500;
    const details = error.response?.data || error.message;
    console.error(`Error calling Google API (${status}):`, JSON.stringify(details, null, 2));
    
    res.status(status).json({ 
        message: "Failed to fetch from the AI model.",
        details: details
    });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
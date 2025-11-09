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
    return res.status(500).json({ message: "Server configuration error: API Key is missing." });
  }
  try {
    const { contents } = req.body;
    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      { contents },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error in API function:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ message: "Failed to fetch from AI model." });
  }
});

export default app;
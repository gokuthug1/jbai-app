import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;

// Text Generation Models
const MODEL_NAME = 'gemini-2.5-pro'; 
const TITLE_MODEL_NAME = 'gemini-2.0-flash-lite';

// Image Generation Model (MUST use Imagen, not Gemini)
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const TITLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TITLE_MODEL_NAME}:generateContent`;

// Note: Imagen uses :predict, not :generateContent
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL_NAME}:predict`;

/**
 * POST /api/server - Main API endpoint for chat requests
 */
app.post('/api/server', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ 
      message: "Server configuration error: API Key is missing.",
      error: "CONFIG_ERROR"
    });
  }

  try {
    const { contents, systemInstruction, toolsConfig } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ 
        message: "Bad Request: 'contents' array is required.",
        error: "INVALID_CONTENTS"
      });
    }

    // Build tools array
    const tools = [];
    if (toolsConfig && typeof toolsConfig === 'object') {
      if (toolsConfig.googleSearch === true) tools.push({ googleSearch: {} });
      if (toolsConfig.codeExecution === true) tools.push({ codeExecution: {} });
    }

    const payload = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(tools.length > 0 && { tools })
    };

    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Chat API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      message: "Failed to fetch response.",
      error: "API_ERROR",
      details: error.response?.data
    });
  }
});

/**
 * POST /api/title - Endpoint for generating conversation titles
 */
app.post('/api/title', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: "CONFIG_ERROR" });

  try {
    const { contents } = req.body;
    const payload = {
      contents,
      generationConfig: { maxOutputTokens: 50, temperature: 0.7 }
    };

    const response = await axios.post(
      `${TITLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Title API Error:", error.message);
    res.status(500).json({ error: "TITLE_GENERATION_FAILED" });
  }
});

/**
 * POST /api/image - Endpoint for generating images
 * Uses imagen-3.0-generate-001 via the :predict endpoint
 */
app.post('/api/image', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: "CONFIG_ERROR" });

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "MISSING_PROMPT" });
    }

    // Payload structure for Imagen REST API
    const payload = {
      instances: [
        { prompt: prompt.trim() }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1" // Default square
      }
    };

    const response = await axios.post(
      `${IMAGE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 
      }
    );

    // Parse Imagen Response
    // Structure: { predictions: [ { bytesBase64Encoded: "...", mimeType: "image/png" } ] }
    const predictions = response.data.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error('No image predictions returned');
    }

    const imageObj = predictions[0];
    const base64Data = imageObj.bytesBase64Encoded;
    const mimeType = imageObj.mimeType || 'image/png';

    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);

  } catch (error) {
    console.error("Image Generation Error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "Failed to generate image.",
      error: "IMAGE_GENERATION_FAILED",
      details: error.response?.data
    });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
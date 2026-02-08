import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuration ---
const { GOOGLE_API_KEY } = process.env;
const MODEL_NAME = 'gemini-2.5-flash';
const TITLE_MODEL_NAME = 'gemini-2.5-flash-lite';
const IMAGE_MODEL_NAME = 'imagen-4.0-fast-generate-001';

const GOOGLE_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// --- Security Middleware ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false, 
  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

app.use(limiter);

// --- API Helper ---
const callGoogleApi = async (model, payload, endpoint = 'generateContent', timeout = 60000) => {
  if (!GOOGLE_API_KEY) {
    throw new Error('Server configuration error: API Key is missing.');
  }
  const url = `${GOOGLE_API_BASE_URL}/${model}:${endpoint}?key=${GOOGLE_API_KEY}`;
  return axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout,
  });
};

// --- API Endpoints ---
app.post('/api/server', async (req, res, next) => {
  try {
    const { contents, systemInstruction, toolsConfig } = req.body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({
        message: "Bad Request: 'contents' array is required and must not be empty.",
        error: "INVALID_CONTENTS"
      });
    }

    const tools = [];
    if (toolsConfig && typeof toolsConfig === 'object') {
      const isAgent = toolsConfig.agentMode === true;
      if (toolsConfig.googleSearch === true || isAgent) tools.push({ googleSearch: {} });
      if (toolsConfig.codeExecution === true || isAgent) tools.push({ codeExecution: {} });
    }

    const payload = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(tools.length > 0 && { tools })
    };

    const response = await callGoogleApi(MODEL_NAME, payload);
    res.json(response.data);

  } catch (error) {
    next(error);
  }
});

app.post('/api/title', async (req, res, next) => {
  try {
    const { contents } = req.body;
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ message: "Bad Request: 'contents' is required." });
    }
    const payload = {
      contents,
      generationConfig: { maxOutputTokens: 50, temperature: 0.7 }
    };
    const response = await callGoogleApi(TITLE_MODEL_NAME, payload, 'generateContent', 30000);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/image', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: "MISSING_PROMPT", message: "A non-empty prompt is required." });
    }

    const payload = {
      instances: [{ prompt: prompt.trim() }],
      parameters: { sampleCount: 1, aspectRatio: "1:1" }
    };

    const response = await callGoogleApi(IMAGE_MODEL_NAME, payload, 'predict');
    const predictions = response.data.predictions;
    if (!predictions || predictions.length === 0 || !predictions[0].bytesBase64Encoded) {
        throw new Error('Invalid image response from API');
    }

    const imageObj = predictions[0];
    const imageBuffer = Buffer.from(imageObj.bytesBase64Encoded, 'base64');

    res.setHeader('Content-Type', imageObj.mimeType || 'image/png');
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);

  } catch (error) {
    next(error);
  }
});

// --- Error Handling Middleware ---
const errorHandler = (error, req, res, next) => {
    console.error(`${req.path} Error:`, error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({
        message: "An unexpected error occurred.",
        error: error.name || "API_ERROR",
        details: error.response?.data || error.message
    });
};

app.use(errorHandler);


// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
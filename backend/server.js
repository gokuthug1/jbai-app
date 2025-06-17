// --- Import necessary packages ---
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // For local development

// UPDATED: Import the official Google Cloud Vertex AI library
const { VertexAI } = require('@google-cloud/vertexai');

// --- Initialization ---
const app = express();
const port = process.env.PORT || 3000;

// --- CORS Configuration (Your robust setup is kept) ---
const allowedOrigins = [
  'https://jbai-app.vercel.app', // Your production frontend
  'http://localhost:3000',
  'http://127.0.0.1:5500' // For VS Code Live Server
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from this origin.'));
    }
  }
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(express.json());

// --- UPDATED: Google Cloud Vertex AI Configuration ---
// The SDK will automatically use the environment variables and secret file
// you set up in Render (GOOGLE_PROJECT_ID, GOOGLE_LOCATION, GOOGLE_APPLICATION_CREDENTIALS)
let vertex_ai;
if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_LOCATION) {
  vertex_ai = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID,
    location: process.env.GOOGLE_LOCATION,
  });
} else {
  console.warn("⚠️  Google Cloud credentials are not fully configured. API calls will fail.");
}

// --- Health Check Route (Unchanged) ---
app.get("/", (req, res) => {
  res.json({
    message: "J.B.A.I. Backend is alive!",
    // Check if the VertexAI instance was created successfully
    vertexAiInitialized: !!vertex_ai,
    timestamp: new Date().toISOString()
  });
});

// --- UPDATED: Text Generation API Route ---
// This now uses the Vertex AI SDK for better security and simplicity.
app.post('/api/generate', async (req, res) => {
  if (!vertex_ai) {
    return res.status(500).json({ message: "Server is not configured for AI requests." });
  }

  try {
    const { contents, systemInstruction } = req.body;

    // Select the text generation model
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: "gemini-1.5-flash-preview-05-20", // Your specified text model
      systemInstruction: systemInstruction,
    });

    const result = await generativeModel.generateContent({ contents });

    // The SDK provides a clean response object
    res.json(result.response);

  } catch (error) {
    console.error("Error in /api/generate:", error);
    res.status(500).json({
      message: "Failed to fetch text response from the AI model.",
      error: error.message,
    });
  }
});


// --- NEW: Image Generation API Route ---
app.post('/api/generate-image', async (req, res) => {
  if (!vertex_ai) {
    return res.status(500).json({ message: "Server is not configured for AI requests." });
  }

  try {
    // Get the prompt and model from the request body
    const { prompt, model } = req.body;

    if (!prompt || !model) {
      return res.status(400).json({ message: "Missing 'prompt' or 'model' in request body." });
    }

    // Initialize the Imagen model
    const imageModel = vertex_ai.preview.getGenerativeModel({ model: model });

    // Send the prompt to the model
    const imageResult = await imageModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Extract the base64-encoded image data from the response
    const b64Json = imageResult.response.candidates[0].content.parts[0].fileData.data;

    if (!b64Json) {
      throw new Error("No image data found in API response.");
    }

    // Send the base64 data back to the frontend
    res.json({ b64Json: b64Json });

  } catch (error) {
    console.error("Error in /api/generate-image:", error);
    res.status(500).json({
      message: "Failed to generate image.",
      error: error.message,
    });
  }
});


// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ J.B.A.I. Backend server is running on port ${port}`);
});

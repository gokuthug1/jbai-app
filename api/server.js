import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'; // Added for local development

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;

const MODEL_NAME = 'gemini-2.5-pro'; 
const TITLE_MODEL_NAME = 'gemini-2.5-pro;
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const TITLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TITLE_MODEL_NAME}:generateContent`;

/**
 * POST /api/server - Main API endpoint for chat requests
 * Validates input and forwards requests to Google Gemini API
 */
app.post('/api/server', async (req, res) => {
  // Validate API key
  if (!GOOGLE_API_KEY || typeof GOOGLE_API_KEY !== 'string') {
    console.error("Server configuration error: GOOGLE_API_KEY is missing or invalid.");
    return res.status(500).json({ 
      message: "Server configuration error: API Key is missing.",
      error: "CONFIG_ERROR"
    });
  }

  try {
    const { contents, systemInstruction, toolsConfig } = req.body;

    // Validate required fields
    if (!contents) {
      return res.status(400).json({ 
        message: "Bad Request: 'contents' field is required.",
        error: "MISSING_CONTENTS"
      });
    }

    if (!Array.isArray(contents)) {
      return res.status(400).json({ 
        message: "Bad Request: 'contents' must be an array.",
        error: "INVALID_CONTENTS_TYPE"
      });
    }

    // Validate contents structure
    const isValidContent = contents.every(content => 
      content && 
      typeof content === 'object' &&
      typeof content.role === 'string' &&
      Array.isArray(content.parts)
    );

    if (!isValidContent) {
      return res.status(400).json({ 
        message: "Bad Request: Invalid contents structure. Each content must have 'role' and 'parts'.",
        error: "INVALID_CONTENTS_STRUCTURE"
      });
    }

    // Build tools array
    const tools = [];
    if (toolsConfig && typeof toolsConfig === 'object') {
      if (toolsConfig.googleSearch === true) {
        tools.push({ googleSearch: {} });
      }
      if (toolsConfig.codeExecution === true) {
        tools.push({ codeExecution: {} });
      }
    }

    // Build payload
    const payload = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(tools.length > 0 && { tools })
    };

    // Make request to Google API
    const response = await axios.post(
      `${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 second timeout
      }
    );

    // Validate response
    if (!response.data) {
      throw new Error('Empty response from Google API');
    }

    res.json(response.data);

  } catch (error) {
    // Enhanced error handling
    let status = 500;
    let message = "Failed to fetch from the AI model.";
    let errorCode = "UNKNOWN_ERROR";
    let details = null;

    if (error.response) {
      // API responded with error status
      status = error.response.status || 500;
      details = error.response.data;
      
      if (status === 400) {
        message = "Invalid request to AI model.";
        errorCode = "BAD_REQUEST";
      } else if (status === 401) {
        message = "Authentication failed. Please check API key.";
        errorCode = "AUTH_ERROR";
      } else if (status === 429) {
        message = "Rate limit exceeded. Please try again later.";
        errorCode = "RATE_LIMIT";
      } else if (status === 500 || status === 503) {
        message = "AI service is temporarily unavailable.";
        errorCode = "SERVICE_UNAVAILABLE";
      }
    } else if (error.request) {
      // Request made but no response
      message = "Network error: Could not reach AI service.";
      errorCode = "NETWORK_ERROR";
    } else if (error.code === 'ECONNABORTED') {
      message = "Request timeout. The request took too long to complete.";
      errorCode = "TIMEOUT";
    } else {
      // Error setting up request
      message = error.message || message;
    }

    console.error(`Error calling Google API (${status}):`, {
      errorCode,
      message: error.message,
      details: details ? JSON.stringify(details, null, 2) : null
    });
    
    res.status(status).json({ 
      message,
      error: errorCode,
      ...(details && { details })
    });
  }
});

/**
 * POST /api/title - Endpoint for generating conversation titles
 * Uses gemini-3-flash-preview (same as main model to avoid rate limits)
 */
app.post('/api/title', async (req, res) => {
  // Validate API key
  if (!GOOGLE_API_KEY || typeof GOOGLE_API_KEY !== 'string') {
    console.error("Server configuration error: GOOGLE_API_KEY is missing or invalid.");
    return res.status(500).json({ 
      message: "Server configuration error: API Key is missing.",
      error: "CONFIG_ERROR"
    });
  }

  try {
    const { contents } = req.body;

    // Validate required fields
    if (!contents) {
      return res.status(400).json({ 
        message: "Bad Request: 'contents' field is required.",
        error: "MISSING_CONTENTS"
      });
    }

    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ 
        message: "Bad Request: 'contents' must be a non-empty array.",
        error: "INVALID_CONTENTS_TYPE"
      });
    }

    // Build payload for title generation
    const payload = {
      contents,
      generationConfig: {
        maxOutputTokens: 50, // Titles should be short
        temperature: 0.7, // Slightly creative for better titles
      }
    };

    // Make request to Google API with title model
    const response = await axios.post(
      `${TITLE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 second timeout for title generation
      }
    );

    // Validate response
    if (!response.data) {
      throw new Error('Empty response from Google API');
    }

    res.json(response.data);

  } catch (error) {
    // Enhanced error handling
    let status = 500;
    let message = "Failed to generate title.";
    let errorCode = "UNKNOWN_ERROR";
    let details = null;

    if (error.response) {
      status = error.response.status || 500;
      details = error.response.data;
      
      if (status === 400) {
        message = "Invalid request for title generation.";
        errorCode = "BAD_REQUEST";
      } else if (status === 401) {
        message = "Authentication failed. Please check API key.";
        errorCode = "AUTH_ERROR";
      } else if (status === 429) {
        message = "Rate limit exceeded. Please try again later.";
        errorCode = "RATE_LIMIT";
      } else if (status === 500 || status === 503) {
        message = "Title generation service is temporarily unavailable.";
        errorCode = "SERVICE_UNAVAILABLE";
      }
    } else if (error.request) {
      message = "Network error: Could not reach title generation service.";
      errorCode = "NETWORK_ERROR";
    } else if (error.code === 'ECONNABORTED') {
      message = "Request timeout. The request took too long to complete.";
      errorCode = "TIMEOUT";
    } else {
      message = error.message || message;
    }

    console.error(`Error calling Google API for title generation (${status}):`, {
      errorCode,
      message: error.message,
      details: details ? JSON.stringify(details, null, 2) : null
    });
    
    res.status(status).json({ 
      message,
      error: errorCode,
      ...(details && { details })
    });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
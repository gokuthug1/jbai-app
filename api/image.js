import axios from "axios";

// Updated to use the correct Imagen model and predict endpoint
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL_NAME}:predict`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({
      error: "CONFIG_ERROR",
      message: "GOOGLE_API_KEY is missing"
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "MISSING_PROMPT",
        message: "Prompt must be a non-empty string"
      });
    }

    // Correct payload for Imagen
    const payload = {
      instances: [
        { prompt: prompt.trim() }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
      }
    };

    const response = await axios.post(
      `${IMAGE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 60000 }
    );

    // Correct response parsing for Imagen
    const predictions = response.data?.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned");
    }

    const imageObj = predictions[0];
    const buffer = Buffer.from(imageObj.bytesBase64Encoded, "base64");
    const mimeType = imageObj.mimeType || "image/png";

    res.setHeader("Content-Type", mimeType);
    res.send(buffer);

  } catch (error) {
    console.error("Image API error:", error.response?.data || error.message);
    res.status(500).json({
      error: "IMAGE_GENERATION_FAILED",
      message: "Failed to generate image",
      details: error.response?.data
    });
  }
}
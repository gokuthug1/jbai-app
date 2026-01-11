import axios from "axios";

const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL_NAME}:generateContent`;

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

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt.trim() }]
      }]
    };

    const response = await axios.post(
      `${IMAGE_API_URL}?key=${GOOGLE_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 60000 }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(p => p.inlineData);

    if (!imagePart) {
      throw new Error("No image data returned");
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");

    res.setHeader("Content-Type", imagePart.inlineData.mimeType || "image/png");
    res.send(buffer);

  } catch (error) {
    console.error("Image API error:", error.response?.data || error.message);
    res.status(500).json({
      error: "IMAGE_GENERATION_FAILED",
      message: "Failed to generate image"
    });
  }
}
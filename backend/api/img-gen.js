// api/img-gen.js
import Replicate from "replicate";

// Instantiate the Replicate client with your API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Ensure the API token is configured
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN is not configured." });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // We are using the Stable Diffusion XL model here.
    // You can find more models on replicate.com/explore
    const model = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
    
    const output = await replicate.run(model, {
      input: {
        prompt: prompt,
        // You can add other parameters here, like negative_prompt, width, height, etc.
      }
    });

    // The model returns an array of image URLs. We'll send the first one.
    if (output && output.length > 0) {
      res.status(200).json({ imageUrl: output[0] });
    } else {
      throw new Error("Failed to generate image.");
    }

  } catch (error) {
    console.error("Error calling Replicate API:", error);
    res.status(500).json({ error: "Failed to generate image. " + error.message });
  }
}
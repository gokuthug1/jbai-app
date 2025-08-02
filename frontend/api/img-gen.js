// frontend/api/img-gen.js
// This function now calls the Hugging Face API
async function queryHuggingFace(data) {
const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
if (!API_TOKEN) {
throw new Error("HUGGINGFACE_API_TOKEN is not configured.");
}
    // We're switching to a free, fast model on Hugging Face.
// This one is great for getting started.
const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

const response = await fetch(API_URL, {
    headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
});

// Hugging Face returns the image directly, not as JSON.
// If it's not successful, it returns JSON with an error.
if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.error || "Failed to query Hugging Face API.");
}

const result = await response.blob();
return result;
    }
export default async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ message: 'Method not allowed' });
}
    try {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    const imageBlob = await queryHuggingFace({ "inputs": prompt });
    
    // We need to send the image back to the browser.
    // We set the correct content type and send the image data.
    res.setHeader('Content-Type', 'image/jpeg');
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    res.status(200).send(imageBuffer);

} catch (error) {
    console.error("Error calling Hugging Face API:", error);
    // Ensure we send back a JSON error if something goes wrong
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: "Failed to generate image. " + error.message });
}
    }

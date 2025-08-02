// api/img-gen.js
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get Cloudflare credentials from environment variables
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  // Ensure credentials are configured
  if (!accountId || !apiToken) {
    return res.status(500).json({ error: "Cloudflare credentials are not configured." });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const model = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const cfResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    // If Cloudflare returns an error, forward it to the client
    if (!cfResponse.ok) {
        const errorText = await cfResponse.text();
        console.error("Cloudflare API Error:", errorText);
        // Ensure the error response is JSON
        return res.status(cfResponse.status).json({ error: `Failed to generate image. Upstream error: ${errorText}` });
    }

    // The response is the raw image data. We stream it back to the client.
    res.setHeader('Content-Type', 'image/png');
    // Vercel's environment supports web streams, so we can pipe it directly.
    return new Response(cfResponse.body, {
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error("Error calling Cloudflare API:", error);
    res.status(500).json({ error: "Failed to generate image. " + error.message });
  }
}

// File: /api/img-gen.js

export default async function handler(request, response) {
    // We only accept POST requests for this endpoint
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = request.body;

    if (!prompt) {
        return response.status(400).json({ error: 'Prompt is required' });
    }

    // These environment variables are securely pulled from your Vercel project settings
    const apiKey = process.env.GOOGLE_API_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;
    
    // Static configuration for the API call
    const location = 'us-central1';
    const model = 'imagen-4.0-generate-preview-06-06';
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    try {
        // Call the Google Vertex AI API
        const apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // This is the correct header for using an API Key with Vertex AI
                'x-goog-api-key': apiKey 
            },
            body: JSON.stringify({
                "instances": [{ "prompt": prompt }],
                "parameters": {
                    "sampleCount": 1,
                    "mimeType": "image/png"
                }
            })
        });

        // Check if the API call itself was successful
        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error('Google API Error:', errorData); // Log the detailed error on the server
            throw new Error(errorData.error.message || `Server error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const base64String = data?.predictions?.[0]?.bytesBase64Encoded;

        if (!base64String) {
            throw new Error('API returned a response but no image data was found.');
        }

        // Send the successful response back to the client-side code
        return response.status(200).json({
            imageUrl: `data:image/png;base64,${base64String}`
        });

    } catch (error) {
        // Catch any errors during the process and send a generic 500 error
        console.error('Error in the img-gen serverless function:', error);
        return response.status(500).json({ error: error.message });
    }
}

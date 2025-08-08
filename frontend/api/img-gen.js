// File: /api/img-gen.js
import { GoogleAuth } from 'google-auth-library';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { prompt } = request.body;
        if (!prompt) {
            return response.status(400).json({ error: 'Prompt is required' });
        }

        // Parse the JSON credentials from the Vercel environment variable
        const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
        if (!credentialsJson) {
            throw new Error('Google credentials are not set in Vercel environment variables.');
        }
        const credentials = JSON.parse(credentialsJson);

        // Create an auth client with the service account
        const auth = new GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        
        // Get an OAuth2 access token
        const accessToken = await auth.getAccessToken();
        const projectId = await auth.getProjectId();

        const location = 'us-central1';
        const model = 'imagen-4.0-generate-preview-06-06';
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

        const apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Use the OAuth2 token for authorization
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                "instances": [{ "prompt": prompt }],
                "parameters": { "sampleCount": 1, "mimeType": "image/png" }
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error('Google API Error:', errorData);
            throw new Error(errorData.error.message || `Server error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const base64String = data?.predictions?.[0]?.bytesBase64Encoded;

        if (!base64String) {
            throw new Error('API returned a response but no image data was found.');
        }

        return response.status(200).json({
            imageUrl: `data:image/png;base64,${base64String}`
        });

    } catch (error) {
        console.error('Error in the img-gen serverless function:', error);
        return response.status(500).json({ error: error.message });
    }
}

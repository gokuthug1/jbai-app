 File apigenerate-image.js

export default async function handler(request, response) {
     We only accept POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message 'Method Not Allowed' });
    }

    const { prompt } = request.body;

    if (!prompt) {
        return response.status(400).json({ error 'Prompt is required' });
    }

     These are your secure environment variables from Vercel
    const apiKey = process.env.GOOGLE_API_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = 'us-central1';  Or your preferred location
    const model = 'imagen-4.0-generate-preview-06-06';

    const endpoint = `https${location}-aiplatform.googleapis.comv1projects${projectId}locations${location}publishersgooglemodels${model}predict`;

    try {
        const apiResponse = await fetch(endpoint, {
            method 'POST',
            headers {
                'Content-Type' 'applicationjson',
                 This is the correct header for using an API Key with Vertex AI
                'x-goog-api-key' apiKey 
            },
            body JSON.stringify({
                instances [{ prompt prompt }],
                parameters {
                    sampleCount 1,
                    mimeType imagepng
                }
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error('Google API Error', errorData);
            throw new Error(errorData.error.message  `Server error ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const base64String = data.predictions.[0].bytesBase64Encoded;

        if (!base64String) {
            throw new Error('API returned a response but no image data was found.');
        }

         Send the successful response back to the client
        return response.status(200).json({
            imageUrl `dataimagepng;base64,${base64String}`
        });

    } catch (error) {
        console.error('Error calling the proxy or Google API', error);
        return response.status(500).json({ error error.message });
    }
}
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'; 

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

const { GOOGLE_API_KEY } = process.env;
const MODEL_NAME = 'gemini-2.5-flash'; 
const TITLE_MODEL_NAME = 'gemini-2.5-flash-lite';

// Use streamGenerateContent with alt=sse for easy parsing
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?alt=sse`;
const TITLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TITLE_MODEL_NAME}:generateContent`;

/**
 * POST /api/server - Main Chat Endpoint (Streaming)
 */
app.post('/api/server', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "CONFIG_ERROR", message: "API Key missing." });
  }

  try {
    const { contents, systemInstruction, toolsConfig } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "INVALID_CONTENTS" });
    }

    // Configure Tools
    const tools = [];
    if (toolsConfig && typeof toolsConfig === 'object') {
      const isAgent = toolsConfig.agentMode === true;
      if (toolsConfig.googleSearch === true || isAgent) tools.push({ googleSearch: {} });
      if (toolsConfig.codeExecution === true || isAgent) tools.push({ codeExecution: {} });
    }

    const payload = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      ...(tools.length > 0 && { tools })
    };

    // Initialize Server Response Stream
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    const upstreamController = new AbortController();
    req.on('close', () => {
      upstreamController.abort();
    });

    const response = await axios.post(
      `${GOOGLE_API_URL}&key=${GOOGLE_API_KEY}`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        signal: upstreamController.signal,
        timeout: 120000
      }
    );

    let sseBuffer = '';
    const processSseLine = (line) => {
      if (!line.startsWith('data: ')) return;
      const jsonStr = line.substring(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') return;

      try {
        const data = JSON.parse(jsonStr);
        const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textPart) {
          res.write(textPart);
        }
      } catch {
        // Ignore malformed or partial events.
      }
    };

    // Process the SSE stream from Google
    response.data.on('data', (chunk) => {
      sseBuffer += chunk.toString('utf8');
      const lines = sseBuffer.split(/\r?\n/);
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        processSseLine(line);
      }
    });

    response.data.on('end', () => {
      if (sseBuffer) {
        processSseLine(sseBuffer);
      }
      res.end();
    });

    response.data.on('error', (err) => {
      console.error("Stream Error:", err);
      res.end(); // End stream on error
    });

  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamMessage = error.response?.data?.error?.message;
    console.error("Chat API Error:", error.message, upstreamStatus || '', upstreamMessage || '');
    // If headers haven't been sent, send JSON error. Otherwise, just end stream.
    if (!res.headersSent) {
      res.status(upstreamStatus || 500).json({ error: "API_ERROR", message: upstreamMessage || error.message });
    } else {
      res.end();
    }
  }
});

/**
 * POST /api/title - Title Generation
 */
app.post('/api/title', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: "CONFIG_ERROR" });

  try {
    const { contents } = req.body;
    const response = await axios.post(
      `${TITLE_API_URL}?key=${GOOGLE_API_KEY}`,
      { contents, generationConfig: { maxOutputTokens: 50, temperature: 0.7 } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "TITLE_ERROR" });
  }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

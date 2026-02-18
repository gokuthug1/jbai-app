import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const { GOOGLE_API_KEY } = process.env;
const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.5-flash';
const TITLE_MODEL_NAME = process.env.TITLE_MODEL_NAME || 'gemini-2.5-flash-lite';

const GOOGLE_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?alt=sse`;
const TITLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TITLE_MODEL_NAME}:generateContent`;

/**
 * POST /api/server - Main Chat Endpoint (Streaming)
 */
app.post('/api/server', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'CONFIG_ERROR', message: 'API Key missing.' });
  }

  const { contents, systemInstruction, toolsConfig } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'INVALID_CONTENTS', message: 'contents must be an array.' });
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
    ...(tools.length > 0 && { tools }),
  };

  // Set streaming headers
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  // Track if client disconnected
  let clientGone = false;
  req.on('close', () => { clientGone = true; });
  req.on('error', (err) => {
    console.error('Request error:', err);
    clientGone = true;
  });

  try {
    const googleRes = await fetch(`${GOOGLE_STREAM_URL}&key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!googleRes.ok) {
      const errBody = await googleRes.text().catch(() => '{}');
      let errJson = {};
      try { errJson = JSON.parse(errBody); } catch { /* ignore */ }
      const message = errJson?.error?.message || errBody || `Upstream error ${googleRes.status}`;
      if (!res.headersSent) {
        return res.status(Math.min(googleRes.status, 500)).json({ error: 'API_ERROR', message: String(message).substring(0, 500) });
      }
      return res.end();
    }

    // Stream SSE from Google → raw text to client
    let sseBuffer = '';
    let responseWritten = false;

    const processSseLine = (line) => {
      if (!line.startsWith('data: ')) return;
      const jsonStr = line.substring(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') {
        // Ensure we write at least something if nothing else was sent
        if (!responseWritten && !clientGone) {
          // This shouldn't happen, but just in case
        }
        return;
      }
      try {
        const data = JSON.parse(jsonStr);
        const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textPart && !clientGone) {
          res.write(textPart);
          responseWritten = true;
        }
      } catch (err) {
        // Log malformed SSE events for debugging
        console.warn('Malformed SSE event:', line.substring(0, 100));
      }
    };

    const reader = googleRes.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (clientGone) { reader.cancel(); break; }

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split(/\r?\n/);
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        processSseLine(line);
      }
    }

    // Flush any remaining buffer
    if (sseBuffer) processSseLine(sseBuffer);

    // If no content was streamed, send a minimal response to prevent empty response error
    if (!responseWritten && !clientGone) {
      res.write(" ");
    }

    res.end();
  } catch (error) {
    console.error('Chat API Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'API_ERROR', message: error.message || 'Internal server error.' });
    } else {
      res.end();
    }
  }
});

/**
 * POST /api/title - Title Generation
 */
app.post('/api/title', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: 'CONFIG_ERROR', message: 'API Key missing.' });

  try {
    const { contents } = req.body;
    const googleRes = await fetch(`${TITLE_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 50, temperature: 0.7 } }),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => 'Unknown error');
      return res.status(googleRes.status).json({ error: 'TITLE_ERROR', message: errText });
    }

    const data = await googleRes.json();
    res.json(data);
  } catch (error) {
    console.error('Title API Error:', error.message);
    res.status(500).json({ error: 'TITLE_ERROR', message: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

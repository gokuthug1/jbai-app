import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.disable('x-powered-by');

const rawTimeout = Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '55000', 10);
const REQUEST_TIMEOUT_MS = Number.isFinite(rawTimeout) ? rawTimeout : 55000;
const JSON_LIMIT = process.env.JSON_LIMIT || '30mb';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors(CORS_ORIGINS.length > 0 ? { origin: CORS_ORIGINS } : undefined));
app.use(express.json({ limit: JSON_LIMIT }));

const { GOOGLE_API_KEY } = process.env;
const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.5-flash';
const TITLE_MODEL_NAME = process.env.TITLE_MODEL_NAME || 'gemini-2.5-flash-lite';

const GOOGLE_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?alt=sse`;
const TITLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TITLE_MODEL_NAME}:generateContent`;
const VALID_ROLES = new Set(['user', 'model']);

const validateContents = (contents) => {
  if (!Array.isArray(contents) || contents.length === 0) {
    return 'contents must be a non-empty array.';
  }
  if (contents.length > 200) {
    return 'contents exceeds maximum allowed length.';
  }

  for (let i = 0; i < contents.length; i += 1) {
    const message = contents[i];
    if (!message || typeof message !== 'object') {
      return `contents[${i}] must be an object.`;
    }
    if (!VALID_ROLES.has(message.role)) {
      return `contents[${i}].role must be "user" or "model".`;
    }
    if (!Array.isArray(message.parts) || message.parts.length === 0) {
      return `contents[${i}].parts must be a non-empty array.`;
    }
    if (message.parts.length > 50) {
      return `contents[${i}].parts exceeds maximum allowed length.`;
    }

    for (let j = 0; j < message.parts.length; j += 1) {
      const part = message.parts[j];
      if (!part || typeof part !== 'object') {
        return `contents[${i}].parts[${j}] must be an object.`;
      }

      const hasText = typeof part.text === 'string';
      const hasInlineData = (
        part.inlineData &&
        typeof part.inlineData === 'object' &&
        typeof part.inlineData.mimeType === 'string' &&
        typeof part.inlineData.data === 'string'
      );

      if (!hasText && !hasInlineData) {
        return `contents[${i}].parts[${j}] must include text or inlineData.`;
      }
      if (hasText && part.text.length > 20000) {
        return `contents[${i}].parts[${j}].text is too long.`;
      }
    }
  }

  return null;
};

const validateSystemInstruction = (systemInstruction) => {
  if (systemInstruction === undefined) return null;
  if (!systemInstruction || typeof systemInstruction !== 'object') {
    return 'systemInstruction must be an object.';
  }
  if (!Array.isArray(systemInstruction.parts) || systemInstruction.parts.length === 0) {
    return 'systemInstruction.parts must be a non-empty array.';
  }

  for (let i = 0; i < systemInstruction.parts.length; i += 1) {
    const part = systemInstruction.parts[i];
    if (!part || typeof part !== 'object' || typeof part.text !== 'string') {
      return `systemInstruction.parts[${i}] must contain text.`;
    }
  }

  return null;
};

const validateToolsConfig = (toolsConfig) => {
  if (toolsConfig === undefined || toolsConfig === null) return null;
  if (typeof toolsConfig !== 'object') {
    return 'toolsConfig must be an object.';
  }

  const toolKeys = ['googleSearch', 'codeExecution', 'agentMode'];
  for (const key of toolKeys) {
    if (key in toolsConfig && typeof toolsConfig[key] !== 'boolean') {
      return `toolsConfig.${key} must be a boolean.`;
    }
  }

  return null;
};

const buildTools = (toolsConfig) => {
  const tools = [];
  if (toolsConfig && typeof toolsConfig === 'object') {
    const isAgent = toolsConfig.agentMode === true;
    if (toolsConfig.googleSearch === true || isAgent) tools.push({ googleSearch: {} });
    if (toolsConfig.codeExecution === true || isAgent) tools.push({ codeExecution: {} });
  }
  return tools;
};

const getUpstreamErrorMessage = async (response) => {
  const errorText = await response.text().catch(() => '');
  if (!errorText) return `Upstream error ${response.status}`;

  try {
    const parsed = JSON.parse(errorText);
    if (parsed?.error?.message) return String(parsed.error.message).slice(0, 500);
  } catch {
    // Ignore parse failure and fall back to text.
  }

  return String(errorText).slice(0, 500);
};

const processSseEvent = (eventChunk, onText) => {
  const dataLines = eventChunk
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart());

  if (dataLines.length === 0) return;

  const eventPayload = dataLines.join('\n').trim();
  if (!eventPayload || eventPayload === '[DONE]') return;

  try {
    const data = JSON.parse(eventPayload);
    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
    candidates.forEach((candidate) => {
      const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
      parts.forEach((part) => {
        if (typeof part?.text === 'string' && part.text) onText(part.text);
      });
    });
  } catch {
    console.warn('Malformed SSE event:', eventPayload.slice(0, 120));
  }
};

const getSafeStatusCode = (statusCode, fallback = 502) => {
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode <= 599) return statusCode;
  return fallback;
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /api/server - Main Chat Endpoint (Streaming)
 */
app.post('/api/server', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'CONFIG_ERROR', message: 'API Key missing.' });
  }

  const { contents, systemInstruction, toolsConfig } = req.body || {};

  const contentsError = validateContents(contents);
  if (contentsError) {
    return res.status(400).json({ error: 'INVALID_CONTENTS', message: contentsError });
  }

  const systemInstructionError = validateSystemInstruction(systemInstruction);
  if (systemInstructionError) {
    return res.status(400).json({ error: 'INVALID_SYSTEM_INSTRUCTION', message: systemInstructionError });
  }

  const toolsConfigError = validateToolsConfig(toolsConfig);
  if (toolsConfigError) {
    return res.status(400).json({ error: 'INVALID_TOOLS_CONFIG', message: toolsConfigError });
  }

  const tools = buildTools(toolsConfig);
  const payload = {
    contents,
    ...(systemInstruction && { systemInstruction }),
    ...(tools.length > 0 && { tools }),
  };

  let clientGone = false;
  let upstreamController;
  let timeoutId;

  const handleClientGone = () => {
    clientGone = true;
    if (upstreamController) upstreamController.abort();
  };
  const handleResponseClosed = () => {
    if (!res.writableEnded) handleClientGone();
  };

  req.on('aborted', handleClientGone);
  req.on('error', (err) => {
    console.error('Request error:', err);
    handleClientGone();
  });
  res.on('close', handleResponseClosed);

  try {
    upstreamController = new AbortController();
    timeoutId = setTimeout(() => upstreamController.abort(), REQUEST_TIMEOUT_MS);

    const googleRes = await fetch(`${GOOGLE_STREAM_URL}&key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: upstreamController.signal,
    });
    clearTimeout(timeoutId);

    if (!googleRes.ok) {
      const message = await getUpstreamErrorMessage(googleRes);
      if (!res.headersSent) {
        return res
          .status(getSafeStatusCode(googleRes.status))
          .json({ error: 'API_ERROR', message });
      }
      return res.end();
    }

    if (!googleRes.body) {
      throw new Error('Upstream stream missing response body.');
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    let sseBuffer = '';
    let responseWritten = false;
    const reader = googleRes.body.getReader();
    const decoder = new TextDecoder('utf-8');

    const processChunk = (eventChunk) => {
      processSseEvent(eventChunk, (text) => {
        if (!text || clientGone) return;
        try {
          res.write(text);
          responseWritten = true;
        } catch {
          clientGone = true;
        }
      });
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (clientGone) {
        await reader.cancel().catch(() => {});
        break;
      }

      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split(/\r?\n\r?\n/);
      sseBuffer = events.pop() ?? '';

      for (const eventChunk of events) {
        processChunk(eventChunk);
      }
    }

    if (sseBuffer.trim()) processChunk(sseBuffer);

    if (!responseWritten && !clientGone) {
      res.write(' ');
    }

    if (!clientGone) res.end();
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    const message = error?.message || 'Internal server error.';

    if (isAbort) {
      console.error('Chat API Timeout/Abort');
      if (!res.headersSent) {
        res.status(504).json({ error: 'API_TIMEOUT', message: 'Upstream request timed out.' });
      } else {
        res.end();
      }
      return;
    }

    console.error('Chat API Error:', message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'API_ERROR', message });
    } else {
      res.end();
    }
  } finally {
    clearTimeout(timeoutId);
    req.off('aborted', handleClientGone);
    res.off('close', handleResponseClosed);
  }
});

/**
 * POST /api/title - Title Generation
 */
app.post('/api/title', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'CONFIG_ERROR', message: 'API Key missing.' });
  }

  const { contents } = req.body || {};
  const contentsError = validateContents(contents);
  if (contentsError) {
    return res.status(400).json({ error: 'INVALID_CONTENTS', message: contentsError });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const googleRes = await fetch(`${TITLE_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 50, temperature: 0.7 }
      }),
      signal: controller.signal
    });

    if (!googleRes.ok) {
      const message = await getUpstreamErrorMessage(googleRes);
      return res
        .status(getSafeStatusCode(googleRes.status))
        .json({ error: 'TITLE_ERROR', message });
    }

    const data = await googleRes.json();
    res.json(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'TITLE_TIMEOUT', message: 'Title request timed out.' });
    }
    console.error('Title API Error:', error?.message || error);
    res.status(500).json({ error: 'TITLE_ERROR', message: error?.message || 'Internal server error.' });
  } finally {
    clearTimeout(timeoutId);
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

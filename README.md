# J.B.A.I - Client-Side AI Chat

J.B.A.I is now a fully client-side chat app.

- No backend server
- No Vercel/API rewrites
- Each user enters their own API key in **Settings**
- Each user selects their own provider/model in **Settings**

## Supported Providers

- Google (Gemini API)
- OpenAI (Chat Completions API)
- Anthropic (Messages API)

## How It Works

1. Open the app.
2. Go to **Settings**.
3. Choose a provider.
4. Enter that provider's API key.
5. Enter the model name you want to use.
6. Start chatting.

Provider settings are stored locally in the browser (`localStorage`) for that user only.

## Notes

- Google Search + Code Execution toggles are available only with the Google provider.
- OpenAI/Anthropic direct mode currently forwards image attachments; non-image attachments are omitted in provider requests.
- Conversation history, theme, tools, and provider settings are local to the browser.
- A new optional backend for Perplexity-style grounded web search lives in `backend/`.
- The design and integration blueprint for that backend lives in `docs/web-search-mode-blueprint.md`.

## Local Run

You can open `index.html` directly, or use a static server:

```bash
npx serve .
```

Then open the shown URL in your browser.

## Optional Web Search Mode Backend

The default app remains client-side. If you want a real search-augmented mode with backend-held search/model credentials, streaming phases, and inline citations:

1. Open `docs/web-search-mode-blueprint.md`
2. Configure `backend/.env`
3. Run `uvicorn app.main:app --reload --port 8000` from `backend/`

## Security

- API keys are never sent to your own backend because there is no backend.
- API keys are stored in browser local storage for convenience.
- Anyone with access to that browser profile can read the saved keys.

## Project Structure

```text
jbai-app/
|-- index.html
|-- script.js
|-- style.css
|-- formatter.js
|-- syntaxHighlighter.js
`-- README.md
```

## License

MIT

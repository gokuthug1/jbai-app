# J.B.A.I - Search + Direct AI Chat

J.B.A.I now supports two usage styles:

- `J.B.A.I` provider: the official default mode, powered by the backend web search pipeline
- Direct providers: Google, OpenAI, and Anthropic from the browser with user-supplied API keys

## Supported Providers

- J.B.A.I (grounded web search mode, default)
- Google (Gemini API)
- OpenAI (Chat Completions API)
- Anthropic (Messages API)

## How It Works

1. Open the app.
2. Go to **Settings**.
3. Choose a provider.
4. If you use `J.B.A.I`, confirm the backend URL.
5. If you use a direct provider, enter that provider's API key and model.
6. Start chatting.

Provider settings are stored locally in the browser (`localStorage`) for that user only.

## Notes

- `J.B.A.I` is now the default provider in Settings.
- `J.B.A.I` requires the backend service in `backend/` to be running.
- `J.B.A.I` currently sends the text prompt only; attachments stay visible in chat but are not forwarded to the web search backend yet.
- Google Search + Code Execution toggles are available only with the Google provider.
- OpenAI/Anthropic direct mode currently forwards image attachments; non-image attachments are omitted in provider requests.
- Conversation history, theme, tools, and provider settings are local to the browser.
- The backend for grounded web search lives in `backend/`.
- The design and integration blueprint for that backend lives in `docs/web-search-mode-blueprint.md`.

## Local Run

You can open `index.html` directly, or use a static server:

```bash
npx serve .
```

Then open the shown URL in your browser.

## J.B.A.I Backend

The default `J.B.A.I` provider depends on the search backend:

1. Open `docs/web-search-mode-blueprint.md`
2. Configure `backend/.env`
3. Run `uvicorn app.main:app --reload --port 8000` from `backend/`

## Security

- Direct-provider API keys are stored in browser local storage for convenience.
- The `J.B.A.I` provider uses backend-held search/model credentials instead of browser-stored provider keys.
- Anyone with access to that browser profile can read the saved keys.

## Project Structure

```text
jbai-app/
|-- backend/
|-- docs/
|-- index.html
|-- script.js
|-- style.css
|-- formatter.js
|-- syntaxHighlighter.js
`-- README.md
```

## License

MIT

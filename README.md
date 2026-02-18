# J.B.A.I - AI Chat Application

A feature-rich AI chat app built with vanilla JavaScript and an Express API proxy for Google Gemini.

## Features

- AI chat interface with streaming responses
- Persistent conversation history (`localStorage`)
- File attachments (image, video, audio, text, code files)
- Markdown rendering with syntax highlighting
- HTML/SVG preview support
- Optional Google Search grounding
- Optional Python code execution
- Theme switching (Light, Dark, Dracula, MonoKai)
- Import/export/delete local conversation data
- Responsive layout with accessibility support

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express (`api/server.js`)
- LLM: Gemini (`gemini-2.5-flash`)
- Title generation model: `gemini-2.5-flash-lite`

## Project Structure

```text
jbai-app/
|-- api/
|   |-- server.js
|   `-- package.json
|-- index.html
|-- script.js
|-- style.css
|-- formatter.js
|-- syntaxHighlighter.js
|-- vercel.json
`-- README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Google API key with Gemini access

### Install

```bash
git clone https://github.com/gokuthug1/jbai-app
cd jbai-app
cd api
npm install
```

### Environment Variables

Create `api/.env`:

```env
GOOGLE_API_KEY=your_api_key_here
```

### Run Locally

From `api/`:

```bash
node server.js
```

Server runs on `http://localhost:3000` by default.

Then open `index.html` in your browser (or serve the root folder with a static server).

## API Routes

- `POST /api/server` - chat completion (streamed text)
- `POST /api/title` - conversation title generation

## Deployment (Vercel)

`vercel.json` rewrites:

- `/api/server` -> `/api/server.js`
- `/api/title` -> `/api/server.js`

Set `GOOGLE_API_KEY` in Vercel environment variables.

## Usage Notes

- Press `Enter` to send, `Shift+Enter` for newline.
- Max attachments: 5 files.
- Max file size: 4 MB per file.
- Settings menu controls tools, theme, fullscreen, and data management.

## Security Notes

- API key is server-side only.
- Link and URL rendering is sanitized before output.
- File uploads are type/size validated.

## License

MIT

## Credits

Created by Jeremiah (`gokuthug1`).

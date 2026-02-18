# J.B.A.I - AI Chat Application

A feature-rich AI chat app built with vanilla JavaScript and an Express API proxy for Google Gemini.

## Features

- AI chat interface with streaming responses
- Persistent conversation history (`localStorage`)
- File attachments (image, video, audio, text, code files)
- Markdown rendering with syntax highlighting
- **Math equation support (KaTeX)** - Block and inline LaTeX rendering
- HTML/SVG preview support
- Optional Google Search grounding
- Optional Python code execution
- **Agent Mode** - Autonomous reasoning with self-correction
- Theme switching (Light, Dark, Dracula, MonoKai)
- Import/export/delete local conversation data
- Responsive layout with accessibility support
- Enhanced markdown: strikethrough, superscript, subscript

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript (with KaTeX for math rendering)
- Backend: Node.js + Express (`api/server.js`)
- LLM: Gemini (`gemini-2.5-flash` by default)
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

## Recent Improvements & Bug Fixes

### ✅ Code Quality & Performance
- Fixed model name inconsistencies (now uses `gemini-2.5-flash` by default)
- Improved API error handling with better error messages and categorization
- Added type validation for files and messages
- Enhanced error recovery and user feedback

### ✅ Features Added
- **KaTeX Math Rendering**: Full support for LaTeX equations in block (`$$...$$`) and inline (`$...$`) formats
- **Enhanced Markdown**:
  - Strikethrough: `~~text~~`
  - Superscript: `^text^`
  - Subscript: `~text~`
  - Definition lists
  - Improved callouts (Note, Tip, Important, Warning, Caution)
- **Agent Process Visualization**: Collapsible containers showing autonomous reasoning steps
- **Better File Management**: Improved file preview rendering and validation

### ✅ Accessibility Improvements
- Better ARIA labels on sidebar items
- Improved keyboard navigation
- Enhanced semantic HTML (conversation items now use proper button elements)
- Better focus management

### ✅ API & Backend Enhancements
- Environment variable support for model selection (`MODEL_NAME`, `TITLE_MODEL_NAME`)
- Better error categorization (401, 403, 429 errors now have specific messages)
- Improved request error handling
- Client disconnection detection

### ✅ UI/UX Polish
- Added visual feedback for agent processes
- Better CSS styling for all themes (Light, Dark, Dracula, MonoKai)
- Improved math block and inline math styling
- Better file download UI with metadata display

## Usage Notes

- Press `Enter` to send, `Shift+Enter` for newline.
- Math: Use `$equation$` for inline or `$$equation$$` for display
- Max attachments: 5 files.
- Max file size: 4 MB per file.
- Max message length: 10,000 characters.
- Settings menu controls tools, theme, fullscreen, and data management.

## Security Notes

- API key is server-side only.
- Link and URL rendering is sanitized before output.
- File uploads are type/size validated.
- XSS protection through HTML escaping in all user-facing content.

## License

MIT

## Credits


Created by Jeremiah (`gokuthug1`).

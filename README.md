# J.B.A.I - AI Chat App

A modern, feature-rich AI chat application built with vanilla JavaScript, featuring Google Gemini integration, file attachments, code syntax highlighting, and more.

## Features

- 🤖 **AI Chat Interface** - Powered by Google Gemini 3 Flash Preview (with Gemini 2.5 Pro for title generation)
- 💬 **Conversation History** - Persistent chat history with localStorage
- 📎 **File Attachments** - Support for images, videos, audio, and text files
- 🎨 **Multiple Themes** - Light, Dark, Dracula, and MonoKai themes
- 💻 **Code Highlighting** - Syntax highlighting for multiple programming languages
- 🖼️ **Image Generation** - Generate images using AI prompts
- 📝 **Markdown Support** - Full markdown rendering with tables, code blocks, and more
- 🔍 **Google Search Integration** - Optional grounding with Google Search
- 🐍 **Code Execution** - Optional Python code execution
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ♿ **Accessibility** - ARIA labels, keyboard navigation, and screen reader support

## Setup

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jbai-app
```

2. Install dependencies:
```bash
cd api
npm install
```

3. Create a `.env` file in the `api` directory:
```env
GOOGLE_API_KEY=your_api_key_here
```

4. For local development, start the server:
```bash
npm start
# Server runs on http://localhost:3000
```

5. Open `index.html` in your browser or deploy to a static hosting service.

## Deployment

### Vercel

The project includes a `vercel.json` configuration for easy deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `GOOGLE_API_KEY` as an environment variable
4. Deploy!

The Vercel configuration automatically routes `/api/server` to the serverless function.

## Usage

### Basic Chat

1. Type your message in the input field
2. Press Enter to send (Shift+Enter for new line)
3. Wait for the AI response

### File Attachments

- Click the paperclip icon to attach files
- Drag and drop files onto the chat area
- Paste images directly from clipboard
- Maximum 5 files, 4MB per file

### Custom Commands

- `/html` - Get a random HTML code snippet
- `/profile` - List all custom commands
- `/concept` - Ask about creating a concept
- `/song` - Get music recommendations
- `/word` - Learn a new word
- `/tip` - Get a useful lifehack
- `/invention` - Generate a fictional invention idea
- `/sp` - Correct spelling and grammar
- `/art` - Get art project ideas
- `/bdw` - Break down a word

### Image Generation

The AI can generate images using the format:
```
[IMAGE: { "prompt": "your prompt here", "height": 1024, "seed": 12345 }]
```

### Settings

Click the settings icon to:
- Change theme (Light, Dark, Dracula, MonoKai)
- Toggle fullscreen mode
- Enable/disable Google Search (Grounding)
- Enable/disable Code Execution
- Import/Export/Delete conversation data

## Project Structure

```
jbai-app/
├── api/
│   ├── server.js          # Express server for API proxy
│   └── package.json       # Server dependencies
├── index.html             # Main HTML file
├── script.js              # Main application logic
├── style.css              # Styles and themes
├── formatter.js           # Markdown and message formatting
├── syntaxHighlighter.js   # Code syntax highlighting
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- All user input is sanitized to prevent XSS attacks
- Base64 image data is stripped from API requests to prevent 413 errors
- File uploads are validated for size and type
- API keys are stored server-side only

## Performance

- Lazy loading for images and iframes
- Efficient rendering with requestAnimationFrame
- Content visibility optimization
- Debounced scroll handlers

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

Created by Jeremiah (gokuthug1)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


/**
 * A self-contained, modern Chat Application object.
 * This object encapsulates all logic for configuration, state management,
 * DOM manipulation, API interaction, and application control.
 *
 * @version 2.0
 * @author Original author, Refactored by AI
 */
const ChatApp = {
    // --- Configuration Module ---
    /**
     * Stores static configuration values for the application.
     */
    Config: {
        API_URLS: {
            TEXT: 'https://jbai-app.onrender.com/api/generate',
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations'
        },
        DEFAULT_THEME: 'dark',
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
            PROCESSING: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`
        }
    },

    // --- State Management Module ---
    /**
     * Manages the dynamic state of the application.
     */
    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        isGenerating: false,
        apiAbortController: null,
        ttsEnabled: false,
        selectedVoice: null,
        ttsVolume: 1,
        attachedFiles: [],

        /**
         * Sets the generation status and updates UI accordingly.
         * @param {boolean} status - The new generating status.
         */
        setGenerating(status) {
            this.isGenerating = status;
            ChatApp.UI.toggleSendButtonState();
            if (!status) {
                this.apiAbortController = null;
            }
        },

        /**
         * Resets the current chat state to start a new conversation.
         */
        resetCurrentChat() {
            if (this.apiAbortController) {
                this.apiAbortController.abort();
            }
            this.currentConversation = [];
            this.currentChatId = null;
            this.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
            if (this.isGenerating) {
                this.setGenerating(false);
            }
        }
    },

    // --- Utility Module ---
    /**
     * Provides helper functions used throughout the application.
     */
    Utils: {
        /**
         * Escapes HTML special characters in a string to prevent XSS.
         * @param {string} str - The string to escape.
         * @returns {string} The escaped string.
         */
        escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        },
        /**
         * Generates a standard v4 UUID.
         * @returns {string} A new UUID.
         */
        generateUUID() {
            return crypto.randomUUID();
        },
    },

    // --- Local Storage Module ---
    /**
     * Handles all interactions with the browser's Local Storage.
     */
    Store: {
        /** Saves all conversations to local storage. */
        saveAllConversations() {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations));
        },
        /** Loads all conversations from local storage into the state. */
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations from local storage, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        /**
         * Saves the selected theme to local storage.
         * @param {string} themeName - The name of the theme to save.
         */
        saveTheme(themeName) {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName);
        },
        /**
         * Retrieves the saved theme from local storage or returns the default.
         * @returns {string} The current theme name.
         */
        getTheme() {
            return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME;
        },
    },

    // --- UI Module (DOM Interaction & Rendering) ---
    /**
     * Manages all direct DOM manipulations and UI rendering.
     */
    UI: {
        elements: {},
        /** Caches frequently accessed DOM elements. */
        cacheElements() {
            this.elements = {
                body: document.body,
                sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
                sidebarToggle: document.getElementById('sidebar-toggle'),
                newChatBtn: document.getElementById('new-chat-btn'),
                conversationList: document.getElementById('conversation-list'),
                messageArea: document.getElementById('message-area'),
                emptyChatPlaceholder: document.getElementById('empty-chat-placeholder'),
                chatInput: document.getElementById('chat-input'),
                sendButton: document.getElementById('send-button'),
                settingsButton: document.getElementById('toggle-options-button'),
                attachFileButton: document.getElementById('attach-file-button'),
                fileInput: document.getElementById('file-input'),
                filePreviewsContainer: document.getElementById('file-previews-container'),
            };
        },
        /**
         * Applies a new theme to the application.
         * @param {string} themeName - The theme to apply.
         */
        applyTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            ChatApp.Store.saveTheme(themeName);
        },
        /** Scrolls the message area to the bottom. */
        scrollToBottom() {
            this.elements.messageArea?.scrollTo({ top: this.elements.messageArea.scrollHeight, behavior: 'smooth' });
        },
        /** Clears the chat area and resets the input field. */
        clearChatArea() {
            this.elements.messageArea.innerHTML = '';
            this.elements.chatInput.value = '';
            this.elements.chatInput.style.height = 'auto';
            this.toggleSendButtonState();
            this.togglePlaceholder(true);
        },
        /**
         * Toggles the visibility of the empty chat placeholder.
         * @param {boolean} [forceShow=false] - If true, forces the placeholder to show.
         */
        togglePlaceholder(forceShow = false) {
            const hasMessages = this.elements.messageArea.querySelector('.message');
            this.elements.emptyChatPlaceholder.classList.toggle('visible', forceShow || !hasMessages);
        },
        /** Enables or disables the send button based on input state. */
        toggleSendButtonState() {
            const hasText = this.elements.chatInput.value.trim().length > 0;
            const hasFiles = ChatApp.State.attachedFiles.length > 0;
            this.elements.sendButton.disabled = (!hasText && !hasFiles) || ChatApp.State.isGenerating;
        },
        /** Renders the list of conversations in the sidebar. */
        renderSidebar() {
            this.elements.conversationList.innerHTML = '';
            const sorted = [...ChatApp.State.allConversations].sort((a, b) => b.id - a.id);
            sorted.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                if (chat.id === ChatApp.State.currentChatId) item.classList.add('active');

                const title = ChatApp.Utils.escapeHTML(chat.title || 'Untitled Chat');
                item.innerHTML = `<span class="conversation-title" title="${title}">${title}</span>
                                <button type="button" class="delete-btn" title="Delete Chat" aria-label="Delete Chat">${ChatApp.Config.ICONS.DELETE}</button>`;
                item.addEventListener('click', () => ChatApp.Controller.loadChat(chat.id));
                item.querySelector('.delete-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    ChatApp.Controller.deleteConversation(chat.id);
                });
                this.elements.conversationList.appendChild(item);
            });
        },
        /**
         * Renders a single message in the chat area.
         * @param {object} message - The message object to render.
         * @returns {HTMLElement} The created message element.
         */
        renderMessage(message) {
            this.togglePlaceholder(false);
            const messageEl = document.createElement('div');
            messageEl.className = `message ${message.role}`;
            messageEl.dataset.messageId = message.id;

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (message.attachments?.length > 0) {
                contentEl.appendChild(this._createAttachmentsContainer(message.attachments));
            }
            if (message.text) {
                const textNode = document.createElement('div');
                textNode.innerHTML = this._formatMessageContent(message.text);
                contentEl.appendChild(textNode);
            }

            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            
            this._addMessageInteractions(messageEl, message.text, message.id);
            this._highlightCodeInElement(messageEl);

            this.scrollToBottom();
            return messageEl;
        },
        /** Renders a "thinking" indicator message. */
        renderThinkingMessage() {
            this.togglePlaceholder(false);
            const messageEl = document.createElement('div');
            messageEl.className = 'message bot thinking';
            messageEl.innerHTML = `<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
            this.elements.messageArea.appendChild(messageEl);
            this.scrollToBottom();
            return messageEl;
        },
        /**
         * Renders a "processing files" indicator message.
         * @param {File[]} files - The files being processed.
         * @returns {HTMLElement} The created message element.
         */
        renderProcessingMessage(files) {
            this.togglePlaceholder(false);
            const messageEl = document.createElement('div');
            messageEl.className = 'message bot processing';
            const fileCount = files.length;
            const text = `Processing ${fileCount} file${fileCount > 1 ? 's' : ''}...`;
            messageEl.innerHTML = `<div class="message-content">${ChatApp.Config.ICONS.PROCESSING} <span>${text}</span></div>`;
            this.elements.messageArea.appendChild(messageEl);
            this.scrollToBottom();
            return messageEl;
        },
        _createAttachmentsContainer(attachments) {
            const container = document.createElement('div');
            container.className = 'message-attachments';
            attachments.forEach(file => {
                const item = document.createElement('div');
                item.className = 'attachment-item';
                if (file.type.startsWith('image/')) {
                    item.innerHTML = `<img src="${file.dataUrl}" alt="${ChatApp.Utils.escapeHTML(file.name)}" class="attachment-media">`;
                } else if (file.type.startsWith('video/')) {
                    item.innerHTML = `<video src="${file.dataUrl}" controls class="attachment-media"></video>`;
                } else {
                    item.innerHTML = `<div class="attachment-fallback">${ChatApp.Utils.escapeHTML(file.name)}</div>`;
                }
                container.appendChild(item);
            });
            return container;
        },
        /** Renders previews for attached files before sending. */
        renderFilePreviews() {
            const container = this.elements.filePreviewsContainer;
            container.innerHTML = '';
            if (ChatApp.State.attachedFiles.length === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'flex';
            ChatApp.State.attachedFiles.forEach((file, index) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                const reader = new FileReader();
                reader.onload = (e) => {
                    let previewContent;
                    if (file.type.startsWith('image/')) {
                        previewContent = `<img src="${e.target.result}" alt="${ChatApp.Utils.escapeHTML(file.name)}">`;
                    } else if (file.type.startsWith('video/')) {
                        previewContent = `<video src="${e.target.result}" muted playsinline></video>`;
                    } else {
                        previewContent = `<div class="file-preview-fallback"><span>${ChatApp.Utils.escapeHTML(file.name.split('.').pop())}</span></div>`;
                    }
                    previewItem.innerHTML = `
                        ${previewContent}
                        <button class="remove-preview-btn" title="Remove file" aria-label="Remove file" type="button">&times;</button>
                    `;
                    previewItem.querySelector('.remove-preview-btn').addEventListener('click', () => {
                        ChatApp.Controller.removeAttachedFile(index);
                    });
                };
                reader.readAsDataURL(file);
                container.appendChild(previewItem);
            });
            this.toggleSendButtonState();
        },
        _formatMessageContent(text) {
            if (!text) return '';
            let formatted = text;
            // 1. Bot-generated image markdown: [IMAGE: alt text](url)
            formatted = formatted.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, '<img src="$2" alt="Bot-generated image: $1" class="bot-generated-image">');
            // 2. Code blocks
            formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${ChatApp.Utils.escapeHTML(code.trim())}</code></pre>`);
            // 3. Headings
            formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');
            return formatted;
        },
        _addMessageInteractions(messageEl, rawText, messageId) {
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;

            const { COPY, CHECK, DELETE } = ChatApp.Config.ICONS;
            const interactionContainer = document.createElement('div');
            interactionContainer.className = 'message-interactions';
            
            if (rawText) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'interaction-btn';
                copyBtn.title = 'Copy message text';
                copyBtn.ariaLabel = 'Copy message text';
                copyBtn.innerHTML = COPY;
                copyBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(rawText).then(() => {
                        copyBtn.innerHTML = CHECK;
                        setTimeout(() => { copyBtn.innerHTML = COPY; }, 2000);
                    });
                });
                interactionContainer.appendChild(copyBtn);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'interaction-btn';
            deleteBtn.title = 'Delete message';
            deleteBtn.ariaLabel = 'Delete message';
            deleteBtn.innerHTML = DELETE;
            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                ChatApp.Controller.deleteMessage(messageId);
            });
            interactionContainer.appendChild(deleteBtn);
            
            contentEl.appendChild(interactionContainer);
            
            // Add copy button to code blocks specifically
            contentEl.querySelectorAll('pre').forEach(pre => {
                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.innerHTML = `${COPY}<span>Copy Code</span>`;
                copyCodeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(pre.querySelector('code').textContent).then(() => {
                        copyCodeBtn.innerHTML = `${CHECK}<span>Copied!</span>`;
                        setTimeout(() => { copyCodeBtn.innerHTML = `${COPY}<span>Copy Code</span>`; }, 2000);
                    });
                });
                pre.appendChild(copyCodeBtn);
            });
        },
        _highlightCodeInElement(element) {
            if (typeof hljs !== 'undefined') {
                element.querySelectorAll('pre code').forEach((block) => {
                    try {
                        hljs.highlightElement(block);
                    } catch (e) {
                        console.error("Code highlighting failed", e);
                    }
                });
            }
        },
        /** Renders and handles the settings modal. */
        renderSettingsModal() {
            this.closeSettingsModal(); // Ensure no duplicates
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
            <div class="settings-card">
                <button class="close-modal-btn" aria-label="Close settings">&times;</button>
                <h2>Settings</h2>
                <div class="settings-row">
                    <label for="themeSelect">Theme</label>
                    <select id="themeSelect">
                        <option value="dark">Dark</option><option value="light">Light</option><option value="dracula">Dracula</option>
                        <option value="midnight">Midnight</option><option value="monokai">Monokai</option><option value="nord">Nord</option>
                        <option value="solarized-light">Solarized Light</option><option value="github-light">GitHub Light</option>
                    </select>
                </div>
                <div class="settings-row">
                    <label for="ttsToggle">Enable TTS</label>
                    <label class="switch"><input type="checkbox" id="ttsToggle"><span class="slider"></span></label>
                </div>
                <div class="settings-row">
                    <label for="volumeSlider">Voice Volume</label>
                    <input type="range" min="0" max="1" step="0.1" value="${ChatApp.State.ttsVolume}" id="volumeSlider" class="volume-slider">
                </div>
                <hr>
                <div class="settings-actions">
                    <button id="upload-data-btn" type="button">Import Data</button>
                    <button id="download-data-btn" type="button">Export Data</button>
                    <button id="delete-data-btn" type="button" class="btn-danger">Delete All Data</button>
                </div>
            </div>`;
            document.body.appendChild(overlay);

            const closeModal = () => this.closeSettingsModal();
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
            overlay.querySelector('.close-modal-btn').addEventListener('click', closeModal);
            
            const themeSelect = overlay.querySelector('#themeSelect');
            themeSelect.value = ChatApp.Store.getTheme();
            themeSelect.addEventListener('change', e => this.applyTheme(e.target.value));

            overlay.querySelector('#ttsToggle').checked = ChatApp.State.ttsEnabled;
            overlay.querySelector('#ttsToggle').addEventListener('change', e => { ChatApp.State.ttsEnabled = e.target.checked; });
            overlay.querySelector('#volumeSlider').addEventListener('input', e => { ChatApp.State.ttsVolume = parseFloat(e.target.value); });
            
            overlay.querySelector('#upload-data-btn').addEventListener('click', () => ChatApp.Controller.handleDataUpload());
            overlay.querySelector('#download-data-btn').addEventListener('click', () => ChatApp.Controller.downloadAllData());
            overlay.querySelector('#delete-data-btn').addEventListener('click', () => ChatApp.Controller.deleteAllData());
        },
        /** Closes the settings modal if it's open. */
        closeSettingsModal() {
            document.querySelector('.modal-overlay')?.remove();
        },
        /**
         * Speaks the given text using the Web Speech API if enabled.
         * @param {string} text - The text to speak.
         */
        speakTTS(text) {
            if (!window.speechSynthesis || !ChatApp.State.ttsEnabled || !text?.trim()) return;
            window.speechSynthesis.cancel();
            // Remove code blocks and other non-verbal content before speaking
            const speechText = text.replace(/```[\s\S]*?```/g, '... Code block ...').replace(/\[IMAGE:.*?\]\(.*?\)/g, '');
            if (!speechText.trim()) return;
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.volume = ChatApp.State.ttsVolume;
            if (ChatApp.State.selectedVoice) utterance.voice = ChatApp.State.selectedVoice;
            window.speechSynthesis.speak(utterance);
        },
    },

    // --- API Module ---
    /**
     * Handles all communication with external APIs.
     */
    Api: {
        async getSystemContext() {
            return `You are J.B.A.I., a helpful and context-aware assistant designed to assist users online. You were developed by Jeremiah, also known as 'gokuthug1,' your creator. He has custom commands that users can use, and you must follow them. You can generate both text and images. Use standard Markdown in your responses.

---
**Image Generation Rule:**
If the user's request is best answered with an image (e.g., they ask to "draw", "show a picture of", or "visualize"), you must create a Pollinations.ai URL and embed it in your response.

1.  Take the user's essential prompt (e.g., "a futuristic city").
2.  URL-encode the prompt (e.g., "a%20futuristic%20city").
3.  Construct the URL: \`https://image.pollinations.ai/prompt/{URL_ENCODED_PROMPT}\`
4.  Present it in your response using this exact Markdown format: \`[IMAGE: original prompt](the_url_you_created)\`

**Example:**
User: Can you draw a picture of a cute red panda?
Your Response: Of course! Here is a picture of a cute red panda:

[IMAGE: a cute red panda](https://image.pollinations.ai/prompt/a%20cute%20red%20panda)
---

**Real-Time Context:**  
Current Date/Time: ${new Date().toLocaleString()}

---

**Abilities:**  
- Generate creative, technical, or helpful text.
- Generate images by creating and embedding Pollinations.ai URLs as instructed.
- Format HTML code as one complete file (HTML, CSS, and JS combined).
- Interpret and follow Jeremiah’s commands.
- Avoid fluff or overexplaining—stay smart, fast, and clear.

---

**Jeremiah's Custom Commands:**  
/html      → Give a random HTML code that’s interesting and fun.  
/profile   → List all custom commands and explain what each does.  
/concept   → Ask what concept the user wants to create.  
/song      → Ask about his music taste, then recommend a fitting song.  
/word      → Give a new word and its definition.  
/tip       → Share a useful lifehack or tip.  
/invention → Generate a fictional, interesting invention idea.  
/sp        → Correct any text the user sends for spelling and grammar.  
/art       → Suggest a prompt or idea for a creative art project.  
/bdw       → Break down a word: pronunciation, definition, and similar-sounding word.

---

**Rules:**  
- Do not ask what a command means. Follow it exactly as written.
- If you decide an image is needed, follow the Image Generation Rule precisely.
- Never add unnecessary text after the Markdown image link.`;
        },
        async fetchTitle(chatHistory, signal) {
            const safeHistory = chatHistory.filter(h => h.content?.parts?.[0]?.text);
            if (safeHistory.length < 2) return "New Chat";
            const prompt = `Based on this conversation, create a short, concise title (4 words max). Output only the title, no quotes or markdown.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
            try {
                const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
                    signal
                });
                if (!response.ok) throw new Error("API error for title generation");
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text.trim().replace(/["*]/g, '') || "Chat";
            } catch (error) {
                if (error.name === 'AbortError') return "Chat";
                console.error("Title generation failed:", error);
                return "Titled Chat";
            }
        },
        async fetchTextResponse(apiContents, systemInstruction, signal) {
            const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: apiContents, systemInstruction }),
                signal
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!botResponseText) throw new Error("Invalid or empty response from API.");
            return botResponseText;
        }
    },

    // --- Controller Module (Application Logic) ---
    /**
     * Orchestrates the application, connecting user actions to state changes and UI updates.
     */
    Controller: {
        /** Initializes the application and sets up event listeners. */
        init() {
            ChatApp.UI.cacheElements();
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            ChatApp.Store.loadAllConversations();
            ChatApp.UI.renderSidebar();
            ChatApp.UI.togglePlaceholder(true);
            ChatApp.UI.toggleSendButtonState();

            const { elements } = ChatApp.UI;
            elements.sendButton.addEventListener('click', () => this.handleChatSubmission());
            elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleChatSubmission();
                }
            });
            elements.chatInput.addEventListener('input', () => {
                elements.chatInput.style.height = 'auto';
                const newHeight = Math.min(elements.chatInput.scrollHeight, 300); // Max height
                elements.chatInput.style.height = `${newHeight}px`;
                ChatApp.UI.toggleSendButtonState();
            });
            elements.newChatBtn.addEventListener('click', () => this.startNewChat());
            elements.settingsButton.addEventListener('click', () => ChatApp.UI.renderSettingsModal());
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
            elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
        },
        /** Starts a new, empty chat session. */
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },
        /** Handles the logic for submitting a message. */
        async handleChatSubmission() {
            if (ChatApp.State.isGenerating) return;
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            if (!userInput && files.length === 0) return;

            ChatApp.State.setGenerating(true);
            let processingMessageEl = null;
            if (files.length > 0) {
                processingMessageEl = ChatApp.UI.renderProcessingMessage(files);
            }

            const { textForApi, attachmentsForUi } = await this._processFilesForSubmission(files, userInput);
            this._clearInputs();
            const userMessage = { role: "user", id: ChatApp.Utils.generateUUID(), text: userInput, attachments: attachmentsForUi };
            ChatApp.UI.renderMessage(userMessage);

            if (processingMessageEl) {
                setTimeout(() => processingMessageEl.remove(), 1000);
            }
            ChatApp.State.currentConversation.push({ id: userMessage.id, content: { role: "user", parts: [{ text: textForApi }] } });
            this._triggerGeneration();
        },
        async _processFilesForSubmission(files, userInput) {
            let filePlaceholders = [];
            const attachmentPromises = files.map(file => {
                let type = 'file';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';
                filePlaceholders.push(`[User uploaded ${type}: "${file.name}"]`);
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve({ name: file.name, type: file.type, dataUrl: e.target.result });
                    reader.readAsDataURL(file);
                });
            });
            const attachmentsForUi = await Promise.all(attachmentPromises);
            const textForApi = `${userInput} ${filePlaceholders.join(' ')}`.trim();
            return { textForApi, attachmentsForUi };
        },
        _clearInputs() {
            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input')); // Recalculate height
            ChatApp.State.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
            ChatApp.UI.elements.chatInput.focus();
        },
        async _triggerGeneration() {
            const thinkingMessageEl = ChatApp.UI.renderThinkingMessage();
            ChatApp.State.apiAbortController = new AbortController();
            const { signal } = ChatApp.State.apiAbortController;
            try {
                const systemInstruction = { parts: [{ text: await ChatApp.Api.getSystemContext() }] };
                const apiContents = ChatApp.State.currentConversation.map(msg => msg.content);
                const botResponseText = await ChatApp.Api.fetchTextResponse(apiContents, systemInstruction, signal);
                thinkingMessageEl.remove();
                const botMessage = { role: 'bot', id: ChatApp.Utils.generateUUID(), text: botResponseText };
                ChatApp.UI.renderMessage(botMessage);
                this.completeGeneration(botResponseText, botMessage.id);
            } catch (error) {
                thinkingMessageEl.remove();
                if (error.name === 'AbortError') {
                    console.log('API request was aborted by the user.');
                } else {
                    console.error("Generation failed:", error);
                    ChatApp.UI.renderMessage({ role: 'bot', id: ChatApp.Utils.generateUUID(), text: `Sorry, an error occurred: ${error.message}` });
                }
                ChatApp.State.setGenerating(false);
            }
        },
        completeGeneration(botResponseText, messageId) {
            ChatApp.State.currentConversation.push({ id: messageId, content: { role: "model", parts: [{ text: botResponseText }] } });
            this.saveCurrentChat();
            ChatApp.UI.speakTTS(botResponseText);
            ChatApp.State.setGenerating(false);
        },
        handleFileSelection(event) {
            ChatApp.State.attachedFiles.push(...Array.from(event.target.files));
            ChatApp.UI.renderFilePreviews();
            event.target.value = null; // Reset for same-file selection
        },
        removeAttachedFile(index) {
            ChatApp.State.attachedFiles.splice(index, 1);
            ChatApp.UI.renderFilePreviews();
        },
        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;
            let chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
            if (chat) {
                chat.history = ChatApp.State.currentConversation;
            } else {
                const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                const modelMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'model').length;
                if (userMessages > 0 && modelMessages > 0) {
                    const titleAbortController = new AbortController();
                    const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation, titleAbortController.signal);
                    ChatApp.State.currentChatId = Date.now();
                    chat = { id: ChatApp.State.currentChatId, title: newTitle, history: ChatApp.State.currentConversation };
                    ChatApp.State.allConversations.push(chat);
                }
            }
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        loadChat(chatId) {
            if (ChatApp.State.currentChatId === chatId || ChatApp.State.isGenerating) return;
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat?.history) {
                alert("Could not load the selected chat. It may be corrupted.");
                return;
            }
            this.startNewChat();
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.currentConversation = chat.history;
            ChatApp.UI.clearChatArea();

            const fragment = document.createDocumentFragment();
            chat.history.forEach(msg => {
                if (!msg.content?.parts) return;
                const role = msg.content.role === 'model' ? 'bot' : 'user';
                // Clean up text for rendering past messages (attachments are not re-rendered)
                const text = msg.content.parts[0]?.text.replace(/\[User uploaded.*?\]/g, '').trim();
                const attachments = msg.attachments; // Check if attachments were saved with message
                const messageEl = ChatApp.UI.renderMessage({ role, id: msg.id, text, attachments });
                fragment.appendChild(messageEl);
            });
            ChatApp.UI.elements.messageArea.appendChild(fragment);

            ChatApp.UI.renderSidebar();
            setTimeout(() => ChatApp.UI.scrollToBottom(), 0); // Allow DOM to update before scroll
        },
        deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message?')) return;
            const msgIndex = ChatApp.State.currentConversation.findIndex(m => m.id === messageId);
            if (msgIndex === -1) return;

            ChatApp.State.currentConversation.splice(msgIndex, 1);
            this.saveCurrentChat(); // Save the modified conversation

            const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
            if (messageEl) {
                messageEl.classList.add('fade-out');
                setTimeout(() => {
                    messageEl.remove();
                    ChatApp.UI.togglePlaceholder();
                }, 400);
            }
        },
        deleteConversation(chatId) {
            if (!confirm('Are you sure you want to delete this chat permanently?')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => c.id !== chatId);
            ChatApp.Store.saveAllConversations();
            if (ChatApp.State.currentChatId === chatId) {
                this.startNewChat();
            } else {
                ChatApp.UI.renderSidebar();
            }
        },
        downloadAllData() {
            if(ChatApp.State.allConversations.length === 0) {
                alert('No conversation data to download.'); 
                return;
            }
            const dataStr = JSON.stringify(ChatApp.State.allConversations, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jbai_conversations_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        handleDataUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.onchange = (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (!Array.isArray(importedData) || !importedData.every(c => c.id && c.title && Array.isArray(c.history))) {
                            throw new Error("Invalid data format. Ensure it's a valid conversations export file.");
                        }
                        if (confirm('This will REPLACE all current conversations with the content from the file. Are you sure?')) {
                            ChatApp.State.allConversations = importedData;
                            ChatApp.Store.saveAllConversations();
                            alert('Data successfully imported. The application will now reload.');
                            location.reload();
                        }
                    } catch (error) {
                        alert(`Error importing data: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        deleteAllData() {
            if (confirm('DANGER: This will permanently delete ALL conversations. This action cannot be undone. Are you sure?')) {
                ChatApp.State.allConversations = [];
                ChatApp.Store.saveAllConversations();
                this.startNewChat();
                ChatApp.UI.closeSettingsModal();
                alert('All conversation data has been deleted.');
            }
        }
    }
};

/**
 * Entry point for the application.
 * Initializes the ChatApp once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});

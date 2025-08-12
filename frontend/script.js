/**
 * A self-contained Chat Application object.
 * This object encapsulates all logic for configuration, state management,
 * UI rendering, API communication, and application control.
 *
 * @namespace ChatApp
 */
const ChatApp = {
    // --- Configuration Module ---
    /**
     * @memberof ChatApp
     * @namespace Config
     * @description Stores static configuration values for the application.
     */
    Config: {
        API_URLS: {
            TEXT: 'https://jbai-app.onrender.com/api/generate',
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations'
        },
        DEFAULT_THEME: 'light',
        TYPING_SPEED_MS: 0, // Milliseconds per character
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`
        }
    },

    // --- State Management Module ---
    /**
     * @memberof ChatApp
     * @namespace State
     * @description Manages the dynamic state of the application.
     */
    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        isGenerating: false,
        isAwaitingImagePrompt: false, // New flag for image generation flow
        typingInterval: null,
        attachedFiles: [],

        /**
         * Sets the current conversation, migrating old data formats if necessary.
         * @param {Array<Object>} history - The conversation history array.
         */
        setCurrentConversation(history) {
            this.currentConversation = history.map(msg => {
                if (!msg) return null;
                // Already in new format
                if (msg.id && msg.content && Array.isArray(msg.content.parts)) return msg;
                // Old format: { role: 'user'/'bot', text: '...' }
                if (msg.role && typeof msg.text !== 'undefined') {
                    return {
                        id: ChatApp.Utils.generateUUID(),
                        content: {
                            role: msg.role === 'user' ? 'user' : 'model',
                            parts: [{ text: msg.text }]
                        }
                    };
                }
                return null;
            }).filter(Boolean);
        },

        addMessage(message) {
            this.currentConversation.push(message);
        },

        removeMessage(messageId) {
            this.currentConversation = this.currentConversation.filter(msg => msg.id !== messageId);
        },

        setGenerating(status) {
            this.isGenerating = status;
            ChatApp.UI.toggleSendButtonState();
            if (!status && this.typingInterval) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
            }
        },
        
        resetCurrentChat() {
            this.setCurrentConversation([]);
            this.currentChatId = null;
            this.isAwaitingImagePrompt = false; // Reset the flag
            this.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
            if (this.isGenerating) {
                this.setGenerating(false);
            }
        }
    },

    // --- Utility Module ---
    /**
     * @memberof ChatApp
     * @namespace Utils
     * @description Provides helper and utility functions.
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
         * Generates a universally unique identifier.
         * @returns {string} A UUID string.
         */
        generateUUID() {
            return crypto.randomUUID();
        }
    },

    // --- Local Storage Module ---
    /**
     * @memberof ChatApp
     * @namespace Store
     * @description Handles all interactions with browser localStorage.
     */
    Store: {
        saveAllConversations() {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations));
        },
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations from localStorage, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme(themeName) {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName);
        },
        getTheme() {
            return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME;
        }
    },

    // --- UI Module (DOM Interaction & Rendering) ---
    /**
     * @memberof ChatApp
     * @namespace UI
     * @description Manages all DOM manipulations, rendering, and UI event handling.
     */
    UI: {
        elements: {},

        cacheElements() {
            this.elements = {
                body: document.body,
                sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
                sidebarToggle: document.getElementById('sidebar-toggle'),
                newChatBtn: document.getElementById('new-chat-btn'),
                conversationList: document.getElementById('conversation-list'),
                messageArea: document.getElementById('message-area'),
                chatInput: document.getElementById('chat-input'),
                sendButton: document.getElementById('send-button'),
                settingsButton: document.getElementById('toggle-options-button'),
                attachFileButton: document.getElementById('attach-file-button'),
                fileInput: document.getElementById('file-input'),
                filePreviewsContainer: document.getElementById('file-previews-container'),
            };
        },

        applyTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            ChatApp.Store.saveTheme(themeName);
        },
        
        scrollToBottom() {
            this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;
        },
        
        clearChatArea() {
            this.elements.messageArea.innerHTML = '';
            this.elements.chatInput.value = '';
            this.elements.chatInput.style.height = 'auto';
            this.toggleSendButtonState();
        },

        toggleSendButtonState() {
            const hasText = this.elements.chatInput.value.trim().length > 0;
            const hasFiles = ChatApp.State.attachedFiles.length > 0;
            const isGenerating = ChatApp.State.isGenerating;
            this.elements.sendButton.disabled = (!hasText && !hasFiles) || isGenerating;
        },
        
        renderSidebar() {
            this.elements.conversationList.innerHTML = '';
            // Sort conversations by ID (timestamp) descending to show newest first
            const sortedConversations = [...ChatApp.State.allConversations].sort((a, b) => b.id - a.id);
            
            sortedConversations.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                if (chat.id === ChatApp.State.currentChatId) {
                    item.classList.add('active');
                }
                
                const title = ChatApp.Utils.escapeHTML(chat.title || 'Untitled Chat');
                item.innerHTML = `
                    <span class="conversation-title" title="${title}">${title}</span>
                    <button type="button" class="delete-btn" title="Delete Chat">${ChatApp.Config.ICONS.DELETE}</button>`;
                
                item.addEventListener('click', () => ChatApp.Controller.loadChat(chat.id));
                item.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    ChatApp.Controller.deleteConversation(chat.id);
                });

                this.elements.conversationList.appendChild(item);
            });
        },

        /**
         * Renders a single message in the chat area.
         * @param {object} message - The full message object from the state.
         * @param {boolean} [isTyping=false] - If true, renders a "thinking" indicator.
         */
        renderMessage(message, isTyping = false) {
            const messageEl = document.createElement('div');
            messageEl.dataset.messageId = message.id;

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (isTyping) {
                messageEl.className = 'message bot thinking';
                contentEl.innerHTML = `<span></span><span></span><span></span>`;
            } else {
                const { content, attachments } = message;
                const sender = content.role === 'model' ? 'bot' : 'user';

                const textPart = content.parts.find(p => p.text);
                const textContent = textPart ? textPart.text : '';
                const rawText = textContent;

                messageEl.className = `message ${sender}`;
                contentEl.innerHTML = this._formatMessageContent(textContent);
                
                if (attachments && attachments.length > 0) {
                    const attachmentsContainer = this._createAttachmentsContainer(attachments);
                    contentEl.prepend(attachmentsContainer);
                }
                
                this._addMessageInteractions(messageEl, rawText, message.id);
            }
            
            messageEl.appendChild(contentEl);
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
                // Use inline styles to create a text-based representation within the existing box model
                const fileIconHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-size:12px; padding: 4px; text-align:center; word-break:break-all;">${ChatApp.Utils.escapeHTML(file.name)}</div>`;
                item.innerHTML = fileIconHTML;
                container.appendChild(item);
            });
            return container;
        },

        renderFilePreviews() {
            this.elements.filePreviewsContainer.innerHTML = '';
            if (ChatApp.State.attachedFiles.length === 0) {
                this.elements.filePreviewsContainer.style.display = 'none';
                return;
            }

            this.elements.filePreviewsContainer.style.display = 'flex';
            ChatApp.State.attachedFiles.forEach((file, index) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                
                // Use inline styles to provide a text-based preview without needing a file reader
                const fileIconHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-size:12px; padding: 4px; text-align:center; word-break:break-all;">${ChatApp.Utils.escapeHTML(file.name)}</div>`;

                previewItem.innerHTML = `
                    ${fileIconHTML}
                    <button class="remove-preview-btn" title="Remove file" type="button">&times;</button>
                `;
                previewItem.querySelector('.remove-preview-btn').addEventListener('click', () => {
                    ChatApp.Controller.removeAttachedFile(index);
                });

                this.elements.filePreviewsContainer.appendChild(previewItem);
            });
            this.toggleSendButtonState();
        },
        
        /**
         * Finalizes a bot message element by typing out the response and rendering it.
         * @param {HTMLElement} messageEl - The placeholder message element (usually the "thinking" one).
         * @param {string} fullText - The full text of the bot's response.
         * @param {string} messageId - The new message's unique ID.
         */
        finalizeBotMessage(messageEl, fullText, messageId) {
            messageEl.classList.remove('thinking');
            messageEl.dataset.messageId = messageId;
            const contentEl = messageEl.querySelector('.message-content');
            contentEl.innerHTML = ''; // Clear thinking dots

            let i = 0;
            ChatApp.State.typingInterval = setInterval(() => {
                if (i < fullText.length) {
                    contentEl.textContent += fullText[i];
                    i++;
                    if (i % 10 === 0) this.scrollToBottom();
                } else {
                    clearInterval(ChatApp.State.typingInterval);
                    ChatApp.State.typingInterval = null;
                    
                    contentEl.innerHTML = this._formatMessageContent(fullText);
                    this._addMessageInteractions(messageEl, fullText, messageId);
                    this.scrollToBottom();

                    ChatApp.Controller.completeGeneration(fullText, messageId);
                }
            }, ChatApp.Config.TYPING_SPEED_MS);
        },

        _addMessageInteractions(messageEl, rawText, messageId) {
            this._addCopyButtons(messageEl, rawText);
            
            let pressTimer = null;
            const startDeleteTimer = () => {
                pressTimer = setTimeout(() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    ChatApp.Controller.deleteMessage(messageId);
                }, 800);
            };
            const clearDeleteTimer = () => clearTimeout(pressTimer);
            
            messageEl.addEventListener('click', e => { 
                if (e.shiftKey) { 
                    e.preventDefault(); 
                    ChatApp.Controller.deleteMessage(messageId); 
                } 
            });
            messageEl.addEventListener('touchstart', startDeleteTimer, { passive: true });
            messageEl.addEventListener('touchend', clearDeleteTimer);
            messageEl.addEventListener('touchmove', clearDeleteTimer);
        },
        
        _formatMessageContent(text) {
            if (!text) return '';

            // --- Start of Special Formatting ---
            const trimmedText = text.trim();

            // Case 1: The entire message is a single HTML code block (for live preview)
            const htmlBlockRegex = /^```html\n([\s\S]*?)\n```$/;
            const htmlMatch = trimmedText.match(htmlBlockRegex);
            if (htmlMatch) {
                const rawHtmlCode = htmlMatch[1].trim();
                // For the srcdoc attribute, we need the raw HTML, but with double quotes escaped to prevent breaking the attribute.
                const safeHtmlForSrcdoc = rawHtmlCode.replace(/"/g, '&quot;');
                // For displaying the code in <pre> and for the data attribute, we must escape all HTML special characters.
                const escapedHtmlCode = ChatApp.Utils.escapeHTML(rawHtmlCode);
                return `
                    <div class="html-preview-container">
                        <h4>Live Preview</h4>
                        <div class="html-render-box">
                            <iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts allow-same-origin" loading="lazy" title="HTML Preview"></iframe>
                        </div>
                        <h4>HTML Code</h4>
                        <pre data-raw-code="${escapedHtmlCode}"><code class="language-html">${escapedHtmlCode}</code></pre>
                    </div>`;
            }

            // Case 2: The entire message is a raw SVG (for direct rendering)
            if (trimmedText.startsWith('<svg') && trimmedText.endsWith('</svg>')) {
                const rawSvgCode = trimmedText;
                // For displaying the code and for the data attribute, we must escape all HTML special characters.
                const escapedSvgCode = ChatApp.Utils.escapeHTML(rawSvgCode);
                return `
                    <div class="svg-preview-container">
                        <h4>SVG Preview</h4>
                        <div class="svg-render-box">${rawSvgCode}</div>
                        <h4>SVG Code</h4>
                        <pre data-raw-code="${escapedSvgCode}"><code class="language-xml">${escapedSvgCode}</code></pre>
                    </div>`;
            }

            // --- Start of General Markdown Formatting ---
            let processedText = text;
            const codeBlocks = [];
            // First, extract all code blocks and replace them with placeholders
            processedText = processedText.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const rawCode = code.trim();
                const id = codeBlocks.length;
                codeBlocks.push({ lang: lang || 'plaintext', rawCode });
                return `__CODE_BLOCK_${id}__`;
            });
            
            // Now, safely escape the remaining text
            let html = ChatApp.Utils.escapeHTML(processedText);

            // Re-insert the code blocks with proper formatting and the raw code in a data-attribute
            html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, id) => {
                const { lang, rawCode } = codeBlocks[id];
                const escapedRawCode = ChatApp.Utils.escapeHTML(rawCode);
                return `<pre data-raw-code="${escapedRawCode}"><code class="language-${lang}">${escapedRawCode}</code></pre>`;
            });

            // Process other custom formats like images
            html = html.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
                const safeFilename = (alt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
                return `
                <div class="generated-image-wrapper">
                    <p class="image-prompt-text"><em>Image Prompt: ${ChatApp.Utils.escapeHTML(alt)}</em></p>
                    <div class="image-container">
                        <img src="${url}" alt="${ChatApp.Utils.escapeHTML(alt)}" class="generated-image">
                        <a href="${url}" download="${safeFilename}.png" class="download-image-button" title="Download Image">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </a>
                    </div>
                </div>`;
            });
            
            // Process standard block-level Markdown
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote><p>${match.replace(/^> /gm, '').trim().replace(/\n/g, '</p><p>')}</p></blockquote>`);
            html = html.replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            
            // Process standard inline-level Markdown
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');
            
            // Final paragraph wrapping for remaining lines
            return html.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed === '') return '';
                const isBlockElement = /^(<\/?(p|h[1-6]|ul|ol|li|pre|blockquote|div)|\[IMAGE:)/.test(trimmed);
                return isBlockElement ? line : `<p>${line}</p>`;
            }).join('');
        },

        _addCopyButtons(messageEl, rawText) {
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;
            
            const { COPY, CHECK } = ChatApp.Config.ICONS;
            
            // Do not add a general copy button if it's a special preview message
            const isPreview = contentEl.querySelector('.html-preview-container, .svg-preview-container');
            if (rawText && !isPreview) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-button';
                copyBtn.title = 'Copy message text';
                copyBtn.innerHTML = COPY;
                copyBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(rawText).then(() => {
                        copyBtn.innerHTML = CHECK;
                        setTimeout(() => { copyBtn.innerHTML = COPY; }, 2000);
                    });
                });
                messageEl.appendChild(copyBtn);
            }
            
            contentEl.querySelectorAll('pre').forEach(pre => {
                // Only add a copy button if the pre element has raw code data
                if (!pre.dataset.rawCode) return;

                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.innerHTML = `${COPY}<span>Copy Code</span>`;
                copyCodeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    // FIX: The `textContent` of the <pre> element contains the decoded, raw code.
                    // This works even if a syntax highlighter adds extra <span> tags.
                    // `dataset.rawCode` contains escaped text which is incorrect for the clipboard.
                    navigator.clipboard.writeText(pre.textContent).then(() => {
                        copyCodeBtn.innerHTML = `${CHECK}<span>Copied!</span>`;
                        setTimeout(() => { copyCodeBtn.innerHTML = `${COPY}<span>Copy Code</span>`; }, 2000);
                    });
                });
                pre.appendChild(copyCodeBtn);
            });
        },
        
        renderSettingsModal() {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
            <div class="settings-card">
                <h2>Settings</h2>
                <div class="settings-row">
                    <label for="themeSelect">Theme</label>
                    <select id="themeSelect">
                        <optgroup label="Light Themes">
                            <option value="light">Light</option>
                            <option value="github-light">GitHub Light</option>
                            <option value="paper">Paper</option>
                            <option value="solarized-light">Solarized Light</option>
                        </optgroup>
                        <optgroup label="Dark Themes">
                            <option value="ayu-mirage">Ayu Mirage</option>
                            <option value="cobalt2">Cobalt2</option>
                            <option value="dark">Dark</option>
                            <option value="dracula">Dracula</option>
                            <option value="gruvbox-dark">Gruvbox Dark</option>
                            <option value="midnight">Midnight</option>
                            <option value="monokai">Monokai</option>
                            <option value="nord">Nord</option>
                            <option value="oceanic-next">Oceanic Next</option>
                            <option value="tomorrow-night-eighties">Tomorrow Night</option>
                        </optgroup>
                    </select>
                </div>
                <hr>
                <div class="data-actions">
                    <button id="upload-data-btn" type="button">Import Data</button>
                    <button id="download-data-btn" type="button">Export Data</button>
                    <button id="delete-data-btn" type="button" class="btn-danger">Delete All Data</button>
                </div>
                <button id="closeSettingsBtn" type="button" class="btn-primary">Close</button>
            </div>`;
            
            document.body.appendChild(overlay);
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            
            const themeSelect = overlay.querySelector('#themeSelect');
            themeSelect.value = ChatApp.Store.getTheme();
            themeSelect.addEventListener('change', e => this.applyTheme(e.target.value));

            overlay.querySelector('#upload-data-btn').addEventListener('click', ChatApp.Controller.handleDataUpload);
            overlay.querySelector('#download-data-btn').addEventListener('click', ChatApp.Controller.downloadAllData);
            overlay.querySelector('#delete-data-btn').addEventListener('click', ChatApp.Controller.deleteAllData);
            overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
        }
    },

    // --- API Module ---
    /**
     * @memberof ChatApp
     * @namespace Api
     * @description Handles all fetch requests to external APIs.
     */
    Api: {
        async getSystemContext() {
            return `You are J.B.A.I., a helpful and context-aware assistant designed to assist users online.

You were developed by Jeremiah, also known as 'gokuthug1,' your creator.
He has custom commands that users can use, and you must follow them.

Use standard Markdown in your responses.  
You can generate both text and images.

For images, always use this format:  
[IMAGE: user's prompt](URL_to_image)

---

Real-Time Context:  
You have access to the user's current context, preferences, and command system. Use this to:  
- Personalize answers  
- Avoid repeating known info  
- Act in line with the user's instructions  

Current Date/Time: ${new Date().toLocaleString()}

---

Abilities:  
- Generate creative, technical, or helpful text  
- Generate images in response to visual prompts  
- Format HTML code as one complete, well-formatted, and readable file (HTML, CSS, and JS combined). ALWAYS enclose the full HTML code within a single \`\`\`html markdown block. DO NOT write any text outside of the markdown block.
- Interpret and follow Jeremiah’s commands  
- Avoid fluff or overexplaining—stay smart, fast, and clear

---

Jeremiah's Custom Commands:  
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

Rules:  
- Do not ask what a command means. Follow it exactly as written.  
- Never add unnecessary text after image links.`;
        },

        async fetchTitle(chatHistory) {
            const safeHistory = chatHistory.filter(h => h.content?.parts?.[0]?.text && !h.content.parts[0].text.startsWith('[IMAGE:'));
            if (safeHistory.length < 2) return "New Chat";

            const prompt = `Based on this conversation, create a short, concise title (4 words max). Output only the title, no quotes or markdown.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
            try {
                const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
                });
                if (!response.ok) throw new Error("API error during title generation");
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text.trim().replace(/["*]/g, '') || "Chat";
            } catch (error) {
                console.error("Title generation failed:", error);
                return "Titled Chat";
            }
        },

        async fetchTextResponse(apiContents, systemInstruction) {
             const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: apiContents, systemInstruction })
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!botResponseText) throw new Error("Received an invalid or empty response from the API.");
            return botResponseText;
        },

        async fetchImageResponse(prompt) {
            const response = await fetch(ChatApp.Config.API_URLS.IMAGE, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            if (!imageUrl) throw new Error("Could not create image URL from the API response.");
            return imageUrl;
        }
    },
    
    // --- Controller Module (Application Logic) ---
    /**
     * @memberof ChatApp
     * @namespace Controller
     * @description Orchestrates the application, connecting user actions to state changes and UI updates.
     */
    Controller: {
        /**
         * Initializes the application by caching elements, loading data, and setting up event listeners.
         */
        init() {
            // 1. Find all our HTML elements first
            ChatApp.UI.cacheElements();
            
            // 2. Load settings and data
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            ChatApp.Store.loadAllConversations();
            
            // 3. Render the initial UI
            ChatApp.UI.renderSidebar();
            ChatApp.UI.toggleSendButtonState(); // Set initial button state

            // 4. Connect UI elements to controller functions (THE CRITICAL STEP)
            const { elements } = ChatApp.UI;
            const { Controller } = ChatApp;

            elements.sendButton.addEventListener('click', Controller.handleChatSubmission.bind(Controller));
            
            elements.chatInput.addEventListener('keydown', (e) => {
                // Submit on Enter, but allow Shift+Enter for new lines
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevents new line in textarea
                    Controller.handleChatSubmission();
                }
            });

            // Auto-resize textarea and toggle send button on input
            elements.chatInput.addEventListener('input', () => {
                elements.chatInput.style.height = 'auto';
                elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
                ChatApp.UI.toggleSendButtonState();
            });

            elements.newChatBtn.addEventListener('click', Controller.startNewChat.bind(Controller));
            elements.settingsButton.addEventListener('click', ChatApp.UI.renderSettingsModal.bind(ChatApp.UI));
            
            // Wire up the file attachment functionality
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', Controller.handleFileSelection.bind(Controller));
            
            // Sidebar toggle for mobile
            elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
        },
        
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },

        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = ChatApp.State.attachedFiles;
        
            if ((!userInput && files.length === 0) || ChatApp.State.isGenerating) return;
        
            // Clear input immediately, since we are processing the submission
            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
        
            // Case 1: We are waiting for an image prompt from the user
            if (ChatApp.State.isAwaitingImagePrompt) {
                ChatApp.State.isAwaitingImagePrompt = false; // Reset flag immediately
                ChatApp.State.setGenerating(true);
        
                // Render user's prompt message
                const userMessageId = ChatApp.Utils.generateUUID();
                const userMessage = {
                    id: userMessageId,
                    content: { role: "user", parts: [{ text: userInput }] }
                };
                ChatApp.State.addMessage(userMessage);
                ChatApp.UI.renderMessage(userMessage);
                
                await this._generateImage(userInput);
                return;
            }
        
            // Case 2: The user is initiating the image generation flow
            if (userInput.toLowerCase() === '.pollinations.ai/prompt') {
                // Render user's trigger message
                const userMessageId = ChatApp.Utils.generateUUID();
                const userMessage = { id: userMessageId, content: { role: 'user', parts: [{ text: userInput }] } };
                ChatApp.State.addMessage(userMessage);
                ChatApp.UI.renderMessage(userMessage);
        
                // Render bot's follow-up question
                const botResponseText = "Sure, what is the prompt for the image?";
                const botMessageId = ChatApp.Utils.generateUUID();
                const botMessage = { id: botMessageId, content: { role: 'model', parts: [{ text: botResponseText }] } };
                ChatApp.State.addMessage(botMessage);
                ChatApp.UI.renderMessage(botMessage);
        
                ChatApp.State.isAwaitingImagePrompt = true;
                this.saveCurrentChat();
                return;
            }
        
            // --- Default Text/File Handling ---
            ChatApp.State.setGenerating(true);
        
            // Prepare files (if any)
            const fileDataPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve({
                        mimeType: file.type || 'text/plain',
                        data: e.target.result.split(',')[1] // Extract base64 data
                    });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });
            const fileApiData = await Promise.all(fileDataPromises);
            this.clearAttachedFiles(); // Clear UI previews
        
            // Create and render user message with text and/or files
            const userMessageId = ChatApp.Utils.generateUUID();
            const messageParts = fileApiData.map(p => ({ inlineData: p }));
            if (userInput) {
                messageParts.push({ text: userInput });
            }
            const userMessage = {
                id: userMessageId,
                content: { role: "user", parts: messageParts },
                attachments: files.map(f => ({ name: f.name, type: f.type }))
            };
            ChatApp.State.addMessage(userMessage);
            ChatApp.UI.renderMessage(userMessage);
        
            // Generate the text response
            await this._generateText();
        },

        handleFileSelection(event) {
            const files = Array.from(event.target.files);
            ChatApp.State.attachedFiles.push(...files);
            ChatApp.UI.renderFilePreviews();
            // Reset input so the same file can be selected again
            event.target.value = null;
        },

        removeAttachedFile(index) {
            ChatApp.State.attachedFiles.splice(index, 1);
            ChatApp.UI.renderFilePreviews();
        },

        clearAttachedFiles() {
            ChatApp.State.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
        },

        async _generateText() {
            const thinkingMessageEl = ChatApp.UI.renderMessage({ id: null }, true);

            try {
                const systemInstruction = { parts: [{ text: await ChatApp.Api.getSystemContext() }] };
                const apiContents = ChatApp.State.currentConversation.map(msg => msg.content);
                const botResponseText = await ChatApp.Api.fetchTextResponse(apiContents, systemInstruction);
                
                ChatApp.UI.finalizeBotMessage(thinkingMessageEl, botResponseText, ChatApp.Utils.generateUUID());
            } catch (error) {
                console.error("Text generation failed:", error);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: `Sorry, an error occurred: ${error.message}` }] } });
                ChatApp.State.setGenerating(false);
            }
        },

        completeGeneration(botResponseText, messageId) {
            const botMessage = { id: messageId, content: { role: "model", parts: [{ text: botResponseText }] } };
            ChatApp.State.addMessage(botMessage);
            this.saveCurrentChat();
            ChatApp.State.setGenerating(false);
        },
        
        async _generateImage(prompt) {
            const thinkingMessageEl = ChatApp.UI.renderMessage({ id: null, content: { role: 'model', parts: [{ text: `Generating image for: "${prompt}"...` }] }}, true);

            try {
                const imageUrl = await ChatApp.Api.fetchImageResponse(prompt);
                const imageMarkdown = `[IMAGE: ${prompt}](${imageUrl})`;
                const botMessageId = ChatApp.Utils.generateUUID();
                const botMessage = { id: botMessageId, content: { role: "model", parts: [{ text: imageMarkdown }] } };
                
                ChatApp.State.addMessage(botMessage);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage(botMessage);
                this.saveCurrentChat();
            } catch (error) {
                console.error("Image generation failed:", error);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: `Image Generation Error: ${error.message}` }] } });
            } finally {
                ChatApp.State.setGenerating(false);
            }
        },

        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;

            if (ChatApp.State.currentChatId) {
                const chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
                if (chat) {
                    chat.history = ChatApp.State.currentConversation;
                }
            } else { // Create a new chat only if there's a user message and a bot response
                 const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                 const modelMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'model').length;
                 if (userMessages > 0 && modelMessages > 0) {
                    const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation);
                    ChatApp.State.currentChatId = Date.now();
                    ChatApp.State.allConversations.push({ 
                        id: ChatApp.State.currentChatId, 
                        title: newTitle, 
                        history: ChatApp.State.currentConversation 
                    });
                }
            }
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        
        loadChat(chatId) {
            if (ChatApp.State.currentChatId === chatId) return;
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat || !Array.isArray(chat.history)) {
                console.error("Chat not found or is corrupted:", chatId);
                alert("Could not load the selected chat.");
                return;
            }

            this.startNewChat(); // Clear state and UI before loading
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.setCurrentConversation(chat.history);
            
            ChatApp.UI.clearChatArea();
            ChatApp.State.currentConversation.forEach(msg => {
                ChatApp.UI.renderMessage(msg);
            });

            setTimeout(() => ChatApp.UI.scrollToBottom(), 0);
            ChatApp.UI.renderSidebar();
        },

        deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message?')) return;
            ChatApp.State.removeMessage(messageId);
            const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
            if (messageEl) {
                messageEl.classList.add('fade-out');
                setTimeout(() => messageEl.remove(), 400);
            }
            this.saveCurrentChat();
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
            const dataStr = JSON.stringify(ChatApp.State.allConversations, null, 2);
            if (!dataStr || dataStr === '[]') { alert('No conversation data to download.'); return; }
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'jbai_conversations_backup.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        handleDataUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (!Array.isArray(importedData) || !importedData.every(c => c.id && c.title && Array.isArray(c.history))) {
                            throw new Error("Invalid data format. Expected an array of chat objects.");
                        }
                        if (confirm('This will replace all current conversations. Are you sure? This action cannot be undone.')) {
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
        }
    }
};

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});
--- START OF FILE index.html ---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="l.png" type="image/png" />
    <title>J.B.A.I</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
    <div class="sidebar-backdrop"></div>
    <button id="sidebar-toggle" title="Toggle Sidebar" aria-label="Toggle Sidebar" type="button">
        <svg class="close-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
        <svg class="open-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
    </button>
    <div class="sidebar">
        <div class="sidebar-header">
            <h2>History</h2>
            <button id="new-chat-btn" type="button">New Chat</button>
        </div>
        <div class="conversation-list" id="conversation-list"></div>
    </div>
        <div class="chat-container">
        <div id="message-area" class="message-area"></div>
        <div class="chat-input-container">
            <div id="file-previews-container"></div>
            <div class="chat-input-wrapper">
                <button id="toggle-options-button" title="Settings" aria-label="Settings" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/></svg>
                </button>
                 <button id="attach-file-button" title="Attach Files" aria-label="Attach Files" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <textarea id="chat-input" placeholder="Type your message..." rows="1"></textarea>
                <button id="send-button" title="Send Message" aria-label="Send Message" type="button" disabled>
                    <svg viewBox="0 0 24 24"><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"></path></svg>
                </button>
            </div>
        </div>
    </div>
    <input type="file" id="file-input" multiple hidden accept="text/plain,text/html,text/css,text/javascript,.js,.html,.css,.txt">

    <script src="script.js" defer></script>
</body>
</html>
--- START OF FILE style.css ---

/* ==========================================================================
   1. Core & Setup
   - Animations
   - Theme Variables
   ========================================================================== */

/* --- 1.1 Animations --- */
@keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.9); }
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes thinking-dot {
    0%, 100% { transform: scale(0.5); opacity: 0.5; }
    50%      { transform: scale(1); opacity: 1; }
}

/* --- 1.2 Theme Variables --- */
:root { /* Default Light Theme */
    color-scheme: light;
    --bg-color: #f3f4f6;
    --sidebar-bg: #e9e9eb;
    --sidebar-border: #ddd;
    --sidebar-hover: #dcdce0;
    --sidebar-active-bg: #fff;
    --sidebar-active-border: #ccc;
    --chat-container-bg: #fff;
    --text-color: #111;
    --text-secondary: #6c757d;
    --border-color: #ddd;
    --input-bg: #fff;
    --button-bg: #000;
    --button-hover-bg: #2a2a2a;
    --button-text: #fff;
    --message-user-bg: #f0f0f0;
    --message-bot-bg: #e5e7eb;
    --code-bg: #1e1e1e;
    --code-text: #d4d4d4;
    --scrollbar-thumb: #ccc;
    --modal-bg: #fff;
    --modal-shadow: rgba(0, 0, 0, 0.15);
    --switch-bg: #ccc;
    --switch-handle-bg: #fff;
    --danger-color: #e53e3e;
    --danger-bg: rgba(229, 62, 62, 0.1);
    --focus-color: #007bff;
}

[data-theme="ayu-mirage"] {
    color-scheme: dark;
    --bg-color: #1f2430;
    --sidebar-bg: #1a1f29;
    --sidebar-border: #2c3340;
    --sidebar-hover: #242936;
    --sidebar-active-bg: #242936;
    --sidebar-active-border: #ffcc66;
    --chat-container-bg: #1f2430;
    --text-color: #cbccc6;
    --text-secondary: #5c6773;
    --border-color: #2c3340;
    --input-bg: #242936;
    --button-bg: #ffcc66;
    --button-hover-bg: #e6b85a;
    --button-text: #1f2430;
    --message-user-bg: #2b303b;
    --message-bot-bg: #242936;
    --code-bg: #1a1f29;
    --code-text: #cbccc6;
    --scrollbar-thumb: #5c6773;
    --modal-bg: #242936;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #5c6773;
    --switch-handle-bg: #cbccc6;
    --danger-color: #ff3333;
    --danger-bg: rgba(255, 51, 51, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="cobalt2"] {
    color-scheme: dark;
    --bg-color: #002240;
    --sidebar-bg: #001e38;
    --sidebar-border: #14385a;
    --sidebar-hover: #14385a;
    --sidebar-active-bg: #14385a;
    --sidebar-active-border: #ffc600;
    --chat-container-bg: #002240;
    --text-color: #ffffff;
    --text-secondary: #aaa;
    --border-color: #14385a;
    --input-bg: #14385a;
    --button-bg: #ffc600;
    --button-hover-bg: #e6b200;
    --button-text: #002240;
    --message-user-bg: #14385a;
    --message-bot-bg: #001e38;
    --code-bg: #001529;
    --code-text: #ffffff;
    --scrollbar-thumb: #14385a;
    --modal-bg: #001e38;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #14385a;
    --switch-handle-bg: #ffffff;
    --danger-color: #ff5370;
    --danger-bg: rgba(255, 83, 112, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="dark"] {
    color-scheme: dark;
    --bg-color: #121212;
    --sidebar-bg: #1e1e1e;
    --sidebar-border: #333;
    --sidebar-hover: #2a2a2a;
    --sidebar-active-bg: #252525;
    --sidebar-active-border: #444;
    --chat-container-bg: #181818;
    --text-color: #e0e0e0;
    --text-secondary: #888;
    --border-color: #333;
    --input-bg: #2a2a2a;
    --button-bg: #e0e0e0;
    --button-hover-bg: #f0f0f0;
    --button-text: #111;
    --message-user-bg: #2c2c2c;
    --message-bot-bg: #363636;
    --code-bg: #2d2d2d;
    --code-text: #ccc;
    --scrollbar-thumb: #555;
    --modal-bg: #2a2a2a;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #555;
    --switch-handle-bg: #e0e0e0;
    --danger-color: #f56565;
    --danger-bg: rgba(245, 101, 101, 0.15);
    --focus-color: #4f4f4f;
}

[data-theme="dracula"] {
    color-scheme: dark;
    --bg-color: #282a36;
    --sidebar-bg: #21222c;
    --sidebar-border: #44475a;
    --sidebar-hover: #44475a;
    --sidebar-active-bg: #44475a;
    --sidebar-active-border: #bd93f9;
    --chat-container-bg: #282a36;
    --text-color: #f8f8f2;
    --text-secondary: #6272a4;
    --border-color: #44475a;
    --input-bg: #21222c;
    --button-bg: #bd93f9;
    --button-hover-bg: #ca79ff;
    --button-text: #f8f8f2;
    --message-user-bg: #44475a;
    --message-bot-bg: #21222c;
    --code-bg: #191a21;
    --code-text: #f8f8f2;
    --scrollbar-thumb: #6272a4;
    --modal-bg: #21222c;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #6272a4;
    --switch-handle-bg: #f8f8f2;
    --danger-color: #ff5555;
    --danger-bg: rgba(255, 85, 85, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="github-light"] {
    color-scheme: light;
    --bg-color: #ffffff;
    --sidebar-bg: #f6f8fa;
    --sidebar-border: #d0d7de;
    --sidebar-hover: #f0f3f6;
    --sidebar-active-bg: #ffffff;
    --sidebar-active-border: #0969da;
    --chat-container-bg: #ffffff;
    --text-color: #1f2328;
    --text-secondary: #57606a;
    --border-color: #d0d7de;
    --input-bg: #f6f8fa;
    --button-bg: #2c974b;
    --button-hover-bg: #268441;
    --button-text: #ffffff;
    --message-user-bg: #ddf4ff;
    --message-bot-bg: #f6f8fa;
    --code-bg: #f6f8fa;
    --code-text: #1f2328;
    --scrollbar-thumb: #d0d7de;
    --modal-bg: #ffffff;
    --modal-shadow: rgba(0, 0, 0, 0.1);
    --switch-bg: #d0d7de;
    --switch-handle-bg: #ffffff;
    --danger-color: #cf222e;
    --danger-bg: rgba(207, 34, 46, 0.1);
    --focus-color: #0969da;
}

[data-theme="gruvbox-dark"] {
    color-scheme: dark;
    --bg-color: #282828;
    --sidebar-bg: #1d2021;
    --sidebar-border: #504945;
    --sidebar-hover: #3c3836;
    --sidebar-active-bg: #3c3836;
    --sidebar-active-border: #fabd2f;
    --chat-container-bg: #282828;
    --text-color: #ebdbb2;
    --text-secondary: #928374;
    --border-color: #504945;
    --input-bg: #3c3836;
    --button-bg: #fabd2f;
    --button-hover-bg: #e4b02d;
    --button-text: #282828;
    --message-user-bg: #504945;
    --message-bot-bg: #3c3836;
    --code-bg: #1d2021;
    --code-text: #ebdbb2;
    --scrollbar-thumb: #928374;
    --modal-bg: #3c3836;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #928374;
    --switch-handle-bg: #ebdbb2;
    --danger-color: #fb4934;
    --danger-bg: rgba(251, 73, 52, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="midnight"] {
    color-scheme: dark;
    --bg-color: #0d1117;
    --sidebar-bg: #161b22;
    --sidebar-border: #30363d;
    --sidebar-hover: #21262d;
    --sidebar-active-bg: #21262d;
    --sidebar-active-border: #8b949e;
    --chat-container-bg: #0d1117;
    --text-color: #c9d1d9;
    --text-secondary: #8b949e;
    --border-color: #30363d;
    --input-bg: #161b22;
    --button-bg: #238636;
    --button-hover-bg: #207431;
    --button-text: #ffffff;
    --message-user-bg: #21262d;
    --message-bot-bg: #161b22;
    --code-bg: #010409;
    --code-text: #c9d1d9;
    --scrollbar-thumb: #30363d;
    --modal-bg: #161b22;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #30363d;
    --switch-handle-bg: #c9d1d9;
    --danger-color: #da3633;
    --danger-bg: rgba(218, 54, 51, 0.15);
    --focus-color: #388bfd;
}

[data-theme="monokai"] {
    color-scheme: dark;
    --bg-color: #272822;
    --sidebar-bg: #20211c;
    --sidebar-border: #49483e;
    --sidebar-hover: #3e3d32;
    --sidebar-active-bg: #3e3d32;
    --sidebar-active-border: #f92672;
    --chat-container-bg: #272822;
    --text-color: #f8f8f2;
    --text-secondary: #75715e;
    --border-color: #49483e;
    --input-bg: #3e3d32;
    --button-bg: #f92672;
    --button-hover-bg: #e22469;
    --button-text: #f8f8f2;
    --message-user-bg: #49483e;
    --message-bot-bg: #3e3d32;
    --code-bg: #20211c;
    --code-text: #f8f8f2;
    --scrollbar-thumb: #75715e;
    --modal-bg: #3e3d32;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #75715e;
    --switch-handle-bg: #f8f8f2;
    --danger-color: #f92672;
    --danger-bg: rgba(249, 38, 114, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="nord"] {
    color-scheme: dark;
    --bg-color: #2e3440;
    --sidebar-bg: #242933;
    --sidebar-border: #3b4252;
    --sidebar-hover: #3b4252;
    --sidebar-active-bg: #3b4252;
    --sidebar-active-border: #88c0d0;
    --chat-container-bg: #2e3440;
    --text-color: #d8dee9;
    --text-secondary: #4c566a;
    --border-color: #3b4252;
    --input-bg: #3b4252;
    --button-bg: #88c0d0;
    --button-hover-bg: #7ab4c4;
    --button-text: #2e3440;
    --message-user-bg: #434c5e;
    --message-bot-bg: #3b4252;
    --code-bg: #242933;
    --code-text: #d8dee9;
    --scrollbar-thumb: #4c566a;
    --modal-bg: #3b4252;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #4c566a;
    --switch-handle-bg: #d8dee9;
    --danger-color: #bf616a;
    --danger-bg: rgba(191, 97, 106, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="oceanic-next"] {
    color-scheme: dark;
    --bg-color: #1b2b34;
    --sidebar-bg: #16232a;
    --sidebar-border: #343d46;
    --sidebar-hover: #2a3842;
    --sidebar-active-bg: #2a3842;
    --sidebar-active-border: #6699cc;
    --chat-container-bg: #1b2b34;
    --text-color: #c0c5ce;
    --text-secondary: #65737e;
    --border-color: #343d46;
    --input-bg: #2a3842;
    --button-bg: #6699cc;
    --button-hover-bg: #5c8ab8;
    --button-text: #1b2b34;
    --message-user-bg: #343d46;
    --message-bot-bg: #2a3842;
    --code-bg: #16232a;
    --code-text: #c0c5ce;
    --scrollbar-thumb: #65737e;
    --modal-bg: #2a3842;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #65737e;
    --switch-handle-bg: #c0c5ce;
    --danger-color: #ec5f67;
    --danger-bg: rgba(236, 95, 103, 0.15);
    --focus-color: var(--button-bg);
}

[data-theme="paper"] {
    color-scheme: light;
    --bg-color: #fcfaf2;
    --sidebar-bg: #f5f0e1;
    --sidebar-border: #dcd5c1;
    --sidebar-hover: #e8e2d4;
    --sidebar-active-bg: #ffffff;
    --sidebar-active-border: #005a9c;
    --chat-container-bg: #fcfaf2;
    --text-color: #4a4137;
    --text-secondary: #857f73;
    --border-color: #dcd5c1;
    --input-bg: #ffffff;
    --button-bg: #005a9c;
    --button-hover-bg: #004c83;
    --button-text: #fcfaf2;
    --message-user-bg: #eaddc7;
    --message-bot-bg: #f5f0e1;
    --code-bg: #2c2c2c;
    --code-text: #e0e0e0;
    --scrollbar-thumb: #dcd5c1;
    --modal-bg: #ffffff;
    --modal-shadow: rgba(0, 0, 0, 0.1);
    --switch-bg: #dcd5c1;
    --switch-handle-bg: #ffffff;
    --danger-color: #d93025;
    --danger-bg: rgba(217, 48, 37, 0.1);
    --focus-color: #005a9c;
}

[data-theme="solarized-light"] {
    color-scheme: light;
    --bg-color: #fdf6e3;
    --sidebar-bg: #eee8d5;
    --sidebar-border: #93a1a1;
    --sidebar-hover: #e8e1cf;
    --sidebar-active-bg: #fdf6e3;
    --sidebar-active-border: #657b83;
    --chat-container-bg: #fdf6e3;
    --text-color: #586e75;
    --text-secondary: #93a1a1;
    --border-color: #93a1a1;
    --input-bg: #eee8d5;
    --button-bg: #268bd2;
    --button-hover-bg: #227cbc;
    --button-text: #fdf6e3;
    --message-user-bg: #eee8d5;
    --message-bot-bg: #eee8d5;
    --code-bg: #002b36;
    --code-text: #93a1a1;
    --scrollbar-thumb: #93a1a1;
    --modal-bg: #eee8d5;
    --modal-shadow: rgba(0, 0, 0, 0.15);
    --switch-bg: #93a1a1;
    --switch-handle-bg: #fdf6e3;
    --danger-color: #dc322f;
    --danger-bg: rgba(220, 50, 47, 0.1);
    --focus-color: #268bd2;
}

[data-theme="tomorrow-night-eighties"] {
    color-scheme: dark;
    --bg-color: #2d2d2d;
    --sidebar-bg: #262626;
    --sidebar-border: #515151;
    --sidebar-hover: #393939;
    --sidebar-active-bg: #393939;
    --sidebar-active-border: #f99157;
    --chat-container-bg: #2d2d2d;
    --text-color: #cccccc;
    --text-secondary: #999999;
    --border-color: #515151;
    --input-bg: #393939;
    --button-bg: #f99157;
    --button-hover-bg: #e2854f;
    --button-text: #2d2d2d;
    --message-user-bg: #515151;
    --message-bot-bg: #393939;
    --code-bg: #262626;
    --code-text: #cccccc;
    --scrollbar-thumb: #999999;
    --modal-bg: #393939;
    --modal-shadow: rgba(0, 0, 0, 0.5);
    --switch-bg: #999999;
    --switch-handle-bg: #cccccc;
    --danger-color: #f2777a;
    --danger-bg: rgba(242, 119, 122, 0.15);
    --focus-color: var(--button-bg);
}


/* ==========================================================================
   2. Base & Layout
   - Global Styles
   - Main Layout (Body, Sidebar, Chat Container)
   ========================================================================== */

/* --- 2.1 Global Styles --- */
*, *::before, *::after {
    box-sizing: border-box;
}

html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    display: flex;
    position: relative;
    width: 100vw;
    height: 100vh; /* Fallback for older browsers */
    height: 100dvh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: var(--text-color);
    background-color: var(--bg-color);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* --- 2.2 Main Layout (Mobile First: Overlay Sidebar) --- */
.sidebar {
    position: fixed;
    top: 0;
    left: -281px; /* Hidden off-screen */
    z-index: 2000;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 260px;
    height: 100%;
    padding: 10px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border);
    transition: left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
body.sidebar-open .sidebar {
    left: 0;
    box-shadow: 4px 0 15px rgba(0,0,0,0.2);
}

.sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1999;
    background: rgba(0,0,0,0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0s 0.3s;
}
body.sidebar-open .sidebar-backdrop {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s;
}

.chat-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    position: relative;
    width: 100%;
    height: 100vh; /* Fallback for older browsers */
    height: 100dvh;
    overflow: hidden;
    background-color: var(--chat-container-bg);
    transition: margin-left 0.35s ease-in-out;
}


/* ==========================================================================
   3. UI Components
   - Sidebar Contents (Toggle, Header, List)
   - Chat Area (Messages, Code, Images)
   - Chat Input Form
   ========================================================================== */

/* --- 3.1 Sidebar Contents --- */
#sidebar-toggle {
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 2100;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
    color: var(--text-color);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    transition: background-color 0.2s, border-color 0.2s;
}
#sidebar-toggle:hover {
    background-color: var(--sidebar-hover);
}
#sidebar-toggle:focus-visible {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
}
#sidebar-toggle svg {
    stroke: currentColor;
}
.close-icon { display: none; }
.open-icon { display: block; }
body.sidebar-open .close-icon { display: block; }
body.sidebar-open .open-icon { display: none; }

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 50px 10px 0 10px;
    margin-bottom: 15px;
}

#new-chat-btn {
    padding: 8px 12px;
    cursor: pointer;
    color: var(--text-color);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    transition: background-color 0.2s;
}
#new-chat-btn:hover {
    background-color: var(--sidebar-hover);
}
#new-chat-btn:focus-visible {
    outline: 2px solid var(--focus-color);
    outline-offset: 1px;
}

.conversation-list {
    flex-grow: 1;
    padding-right: 5px; /* For scrollbar gap */
    overflow-y: auto;
}
.conversation-list::-webkit-scrollbar { width: 6px; }
.conversation-list::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb); border-radius: 3px; }

.conversation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px;
    margin-bottom: 5px;
    user-select: none;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 6px;
    outline-offset: -2px; /* For focus style */
}
.conversation-item:hover {
    background-color: var(--sidebar-hover);
}
.conversation-item.active {
    font-weight: bold;
    background-color: var(--sidebar-active-bg);
    border-color: var(--sidebar-active-border);
}
.conversation-item:focus-visible {
    outline: 2px solid var(--focus-color);
}
.conversation-title {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px;
    opacity: 0;
    cursor: pointer;
    color: var(--text-secondary);
    background: none;
    border: none;
    border-radius: 4px;
    transition: opacity 0.2s, color 0.2s;
}
.conversation-item:hover .delete-btn {
    opacity: 0.6;
}
.delete-btn:hover {
    opacity: 1;
    color: var(--danger-color);
}
.delete-btn:focus-visible {
    opacity: 1;
    outline: 2px solid var(--danger-color);
}

/* --- 3.2 Chat Area --- */
.message-area {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 10px;
    width: 100%;
    padding: 20px;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
}
.message-area::-webkit-scrollbar {
    display: none; /* Safari & Chrome */
}

.message {
    display: flex;
    align-items: flex-start;
    max-width: 100%;
}
.message.user {
    justify-content: flex-end;
}
.message.bot {
    justify-content: flex-start;
}
.message.thinking .message-content {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--message-bot-bg);
}
.message.thinking .message-content span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: var(--text-secondary);
    border-radius: 50%;
    animation: thinking-dot 1.4s infinite ease-in-out both;
}
.message.thinking .message-content span:nth-child(1) { animation-delay: -0.32s; }
.message.thinking .message-content span:nth-child(2) { animation-delay: -0.16s; }
.message.thinking .message-content span:nth-child(3) { animation-delay: 0s; }


.message-content {
    position: relative;
    max-width: 800px;
    padding: 8px 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-wrap: break-word;
    cursor: default;
    background-color: var(--message-bot-bg);
    border-radius: 16px;
}
.message.user .message-content {
    background-color: var(--message-user-bg);
}
.message-content p,
.message-content h1,
.message-content h2,
.message-content h3,
.message-content li {
    cursor: text;
}
.message.bot .message-content p:first-child,
.message.bot .message-content h1:first-child,
.message.bot .message-content h2:first-child,
.message.bot .message-content h3:first-child {
    margin-top: 0;
}
.message.bot .message-content p:last-child {
    margin-bottom: 0;
}

/* NEW: Message Formatting Styles */
.message-content blockquote {
    padding: 10px 15px;
    margin: 8px 0;
    border-left: 4px solid var(--border-color);
    background-color: color-mix(in srgb, var(--message-bot-bg) 50%, var(--bg-color) 50%);
    border-radius: 0 8px 8px 0;
}
.message.user .message-content blockquote {
    background-color: color-mix(in srgb, var(--message-user-bg) 50%, var(--bg-color) 50%);
}
.message-content blockquote p {
    margin: 0;
}
.message-content a {
    color: var(--focus-color);
    text-decoration: underline;
    font-weight: 500;
}
.message-content a:hover {
    text-decoration: none;
}
.message-content s {
    text-decoration: line-through;
    color: var(--text-secondary);
}

/* NEW: HTML & SVG Preview Styles */
.html-preview-container,
.svg-preview-container {
    padding-top: 8px; /* Give some space from the top of the bubble */
}
.html-preview-container h4,
.svg-preview-container h4 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-size: 0.9em;
    color: var(--text-secondary);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.html-preview-container h4:first-of-type,
.svg-preview-container h4:first-of-type {
    margin-top: 0;
}
.html-render-box {
    width: 100%;
    height: 400px;
    background-color: var(--chat-container-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden; /* To contain the iframe's border-radius */
}
.html-render-box iframe {
    width: 100%;
    height: 100%;
    border: none;
    background-color: #fff; /* Ensure iframe has a bg */
}
.svg-render-box {
    padding: 1rem;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
}
.svg-render-box svg {
    max-width: 100%;
    max-height: 300px;
    /* Use 'currentColor' to respect the theme's text color for svgs without explicit fill */
    fill: currentColor; 
}
.html-preview-container pre,
.svg-preview-container pre {
    margin-top: 0.5em;
}

/* Message Attachments */
.message-attachments {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
}
.attachment-item {
    position: relative;
    width: 100%;
    padding-top: 100%; /* Creates a square aspect ratio box */
}
.attachment-media {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}


/* Code Blocks & Copy Buttons */
.message-content pre {
    position: relative;
    padding: 12px;
    padding-top: 35px; /* Space for copy button */
    margin: 8px 0;
    overflow-x: auto;
    white-space: pre;
    cursor: text;
    color: var(--code-text);
    background-color: var(--code-bg);
    border-radius: 8px;
    font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace;
    font-size: 0.9em;
}

.copy-button,
.copy-code-button {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    cursor: pointer;
    border: none;
    border-radius: 5px;
    transition: opacity 0.2s, background-color 0.2s;
}
.message-content:hover .copy-button,
.message-content pre:hover .copy-code-button {
    opacity: 0.7;
}
.copy-button:hover,
.copy-code-button:hover {
    opacity: 1;
}

.copy-button {
    right: 8px;
    bottom: 8px;
    padding: 4px;
    color: var(--text-color);
    background: rgba(0,0,0,0.1);
}
.copy-button:hover { background: rgba(0,0,0,0.2); }
.copy-button svg { width: 16px; height: 16px; stroke: currentColor; }

.copy-code-button {
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    color: var(--code-text);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    font-size: 12px;
}
.copy-code-button:hover { background: rgba(255, 255, 255, 0.2); }
.copy-code-button svg { width: 14px; height: 14px; margin-right: 5px; stroke: currentColor; }

/* Image Previews */
.generated-image-wrapper {
    margin: 8px 0;
}
.image-prompt-text {
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 0.9em;
}
.image-container {
    position: relative;
    display: inline-block;
    max-width: 100%;
}
.image-container:hover .download-image-button {
    opacity: 0.9;
}
.generated-image {
    display: block;
    max-width: 100%;
    border-radius: 8px;
}
.download-image-button {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    opacity: 0;
    cursor: pointer;
    color: white; /* Stays white for contrast on image */
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    transition: opacity 0.2s, background-color 0.2s;
}
.download-image-button:hover { background: rgba(0, 0, 0, 0.6); }
.download-image-button svg { width: 18px; height: 18px; }

/* --- 3.3 Chat Input Form (REFINED) --- */
.chat-input-container {
    flex-shrink: 0;
    padding: 10px 20px 20px;
    background-color: var(--chat-container-bg);
    border-top: 1px solid var(--border-color);
}

/* NEW: File Previews Container */
#file-previews-container {
    display: none; /* Hidden by default */
    flex-wrap: wrap;
    gap: 10px;
    max-width: 800px;
    margin: 0 auto 10px auto;
}
.file-preview-item {
    position: relative;
    width: 70px;
    height: 70px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}
.file-preview-item img, .file-preview-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.remove-preview-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    cursor: pointer;
    color: white;
    background: rgba(0,0,0,0.5);
    border: none;
    border-radius: 50%;
    font-size: 14px;
    line-height: 1;
    transition: opacity 0.2s, background-color 0.2s;
}
.remove-preview-btn:hover {
    opacity: 1;
    background: rgba(0,0,0,0.7);
}


.chat-input-wrapper {
    display: flex;
    align-items: flex-end; /* Align items to the bottom as textarea grows */
    gap: 5px; /* Reduced gap */
    max-width: 800px;
    margin: 0 auto;
    padding: 4px; /* Padding for the buttons */
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 24px; /* Highly rounded corners */
    transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input-wrapper:focus-within {
    border-color: var(--focus-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-color) 20%, transparent);
}

textarea {
    flex-grow: 1;
    max-height: 200px;
    padding: 10px;
    resize: none;
    outline: none;
    color: var(--text-color);
    background: transparent;
    border: none;
    box-shadow: none;
    font-size: 16px;
    line-height: 1.5;
}
textarea:focus-visible {
    border-color: transparent;
    box-shadow: none;
}

#toggle-options-button, #attach-file-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border: none;
    border-radius: 50%;
    background-color: transparent;
    color: var(--text-secondary);
    transition: background-color 0.2s, color 0.2s;
}
#toggle-options-button:hover, #attach-file-button:hover {
    color: var(--text-color);
    background-color: var(--sidebar-hover);
}
#toggle-options-button:focus-visible, #attach-file-button:focus-visible {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
}
#toggle-options-button svg, #attach-file-button svg {
    stroke: currentColor;
}

#send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border: none;
    border-radius: 50%;
    background-color: var(--sidebar-hover);
    color: var(--text-secondary);
    transition: background-color 0.2s, color 0.2s;
}
#send-button:disabled {
    cursor: not-allowed;
    background-color: var(--sidebar-hover);
    color: var(--text-secondary);
}
#send-button:not(:disabled) {
    background-color: var(--button-bg);
    color: var(--button-text);
}
#send-button:not(:disabled):hover {
    background-color: var(--button-hover-bg);
}
#send-button:focus-visible {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
}
#send-button svg path {
    fill: currentColor;
}


/* --- 3.4 Utility Animation Classes --- */
.fade-out {
    animation: fadeOut 0.4s ease forwards;
}


/* ==========================================================================
   4. Modal & Forms
   - Modal Overlay & Card
   - Form Elements (Buttons, Select, Switch)
   ========================================================================== */

/* --- 4.1 Modal Overlay & Card --- */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.6);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
}

.settings-card {
    width: 90%;
    max-width: 350px;
    padding: 25px;
    text-align: left;
    color: var(--text-color);
    background-color: var(--modal-bg);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--modal-shadow);
    animation: slideIn 0.3s ease-out;
}
.settings-card h2 {
    margin-top: 0;
    font-size: 20px;
}
.settings-card hr {
    margin: 25px 0;
    border: none;
    border-top: 1px solid var(--border-color);
}
.settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 20px 0;
}

/* --- 4.2 Form Elements --- */
.settings-card select,
.settings-card .volume-slider {
    max-width: 150px;
    padding: 6px;
    color: var(--text-color);
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
}
.settings-card select:focus-visible,
.settings-card .volume-slider:focus-visible {
    border-color: var(--focus-color);
    outline: 1px solid var(--focus-color);
}

.settings-card button {
    width: 100%;
    padding: 12px;
    margin-top: 10px;
    cursor: pointer;
    color: var(--text-color);
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.2s, border-color 0.2s;
}
.settings-card button:hover {
    background-color: var(--sidebar-hover);
}
.settings-card button:focus-visible {
    border-color: var(--focus-color);
    outline: 2px solid var(--focus-color);
    outline-offset: 1px;
}

.settings-card .btn-primary {
    color: var(--button-text);
    background-color: var(--button-bg);
    border-color: var(--button-bg);
}
.settings-card .btn-primary:hover {
    background-color: var(--button-hover-bg);
    border-color: var(--button-hover-bg);
}

.settings-card .btn-danger {
    color: var(--danger-color);
    border-color: var(--danger-color);
}
.settings-card .btn-danger:hover {
    background-color: var(--danger-bg);
}
.settings-card .btn-danger:focus-visible {
    border-color: var(--danger-color);
    outline-color: var(--danger-color);
}

/* Switch Toggle */
.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.slider {
    position: absolute;
    inset: 0;
    cursor: pointer;
    background-color: var(--switch-bg);
    border-radius: 24px;
    transition: 0.4s;
}
.slider:before {
    position: absolute;
    content: "";
    bottom: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background-color: var(--switch-handle-bg);
    border-radius: 50%;
    transition: 0.4s;
}
input:checked + .slider {
    background-color: var(--button-bg);
}
input:checked + .slider:before {
    transform: translateX(26px);
}
input:focus-visible + .slider {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
}


/* ==========================================================================
   5. Responsive Design
   ========================================================================== */

@media (max-width: 768px) {
    .message-content {
        max-width: 90%;
    }
    .chat-input-container {
        padding: 10px;
    }
    .chat-input-wrapper {
        gap: 2px; /* Tighter gap on small screens */
    }
    .sidebar-header {
        padding-top: 60px; /* More space for status bar */
    }
}

/* Desktop Layout: Push Sidebar */
@media (min-width: 769px) {
    .sidebar {
        position: relative; /* Override fixed */
        left: auto; /* Override left */
        margin-left: -281px; /* Use margin for push effect */
        box-shadow: none; /* No shadow needed */
        transition: margin-left 0.35s ease-in-out;
    }
    body.sidebar-open .sidebar {
        margin-left: 0;
        left: auto; /* Ensure override */
    }
    .sidebar-backdrop {
        display: none; /* Hide backdrop on desktop */
    }
    #sidebar-toggle {
        /* Add back the transition for the left property */
        transition: left 0.35s ease-in-out, background-color 0.2s, border-color 0.2s;
    }
    body.sidebar-open #sidebar-toggle {
        left: 276px; /* Move the toggle button with the sidebar */
    }
    body.sidebar-open .close-icon { display: block; }
    body.sidebar-open .open-icon { display: none; }
}

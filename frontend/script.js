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
            TEXT: 'https://jbai-app.onrender.com/api/generate'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations'
        },
        DEFAULT_THEME: 'dracula',
        TYPING_SPEED_MS: 0, // Milliseconds per character
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`,
            OPEN_NEW_TAB: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
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
                fullscreenOverlay: document.getElementById('fullscreen-preview-overlay'),
                fullscreenContent: document.getElementById('fullscreen-content'),
                fullscreenCloseBtn: document.getElementById('fullscreen-close-btn'),
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
            this._addMessageAndCodeActions(messageEl, rawText);
            
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
        
            const trimmedText = text.trim();
        
            const htmlBlockRegex = /^```html\n([\s\S]*?)\n```$/;
            const htmlMatch = trimmedText.match(htmlBlockRegex);
            if (htmlMatch) {
                const rawHtmlCode = htmlMatch[1].trim();
                const safeHtmlForSrcdoc = rawHtmlCode.replace(/"/g, '&quot;');
                const escapedHtmlCode = ChatApp.Utils.escapeHTML(rawHtmlCode);
                return `
                    <div class="html-preview-container">
                        <div class="html-render-box">
                            <iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts allow-same-origin" loading="lazy" title="HTML Preview"></iframe>
                        </div>
                        <div class="code-block-container" data-previewable="html" data-raw-content="${encodeURIComponent(rawHtmlCode)}">
                            <pre data-raw-code="${escapedHtmlCode}"><code class="language-html">${escapedHtmlCode}</code></pre>
                        </div>
                    </div>`;
            }
        
            if (trimmedText.startsWith('<svg') && trimmedText.endsWith('</svg>')) {
                const rawSvgCode = trimmedText;
                const escapedSvgCode = ChatApp.Utils.escapeHTML(rawSvgCode);
                return `
                    <div class="svg-preview-container">
                        <div class="svg-render-box">${rawSvgCode}</div>
                        <div class="code-block-container" data-previewable="svg" data-raw-content="${encodeURIComponent(rawSvgCode)}">
                           <pre data-raw-code="${escapedSvgCode}"><code class="language-xml">${escapedSvgCode}</code></pre>
                        </div>
                    </div>`;
            }
        
            let processedText = text;
            const codeBlocks = [];
            processedText = processedText.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const rawCode = code.trim();
                const id = codeBlocks.length;
                codeBlocks.push({ lang: lang || 'plaintext', rawCode });
                return `__CODE_BLOCK_${id}__`;
            });
            
            let html = ChatApp.Utils.escapeHTML(processedText);
        
            html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, id) => {
                const { lang, rawCode } = codeBlocks[id];
                const escapedRawCode = ChatApp.Utils.escapeHTML(rawCode);
                return `
                    <div class="code-block-container">
                        <pre data-raw-code="${escapedRawCode}"><code class="language-${lang}">${escapedRawCode}</code></pre>
                    </div>`;
            });
        
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
            
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote><p>${match.replace(/^> /gm, '').trim().replace(/\n/g, '</p><p>')}</p></blockquote>`);
            html = html.replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');
            
            return html.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed === '') return '';
                const isBlockElement = /^(<\/?(p|h[1-6]|ul|ol|li|pre|blockquote|div)|\[IMAGE:)/.test(trimmed);
                return isBlockElement ? line : `<p>${line}</p>`;
            }).join('');
        },

        _addMessageAndCodeActions(messageEl, rawText) {
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;
            
            const { COPY, CHECK, OPEN_NEW_TAB } = ChatApp.Config.ICONS;
            
            // 1. Handle main message copy button (only for non-code-heavy messages)
            const hasPreviewsOrCode = contentEl.querySelector('.html-preview-container, .svg-preview-container, .code-block-container');
            if (rawText && !hasPreviewsOrCode) {
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
            
            // 2. Handle actions for all code blocks
            contentEl.querySelectorAll('.code-block-container').forEach(container => {
                const pre = container.querySelector('pre');
                if (!pre || !pre.dataset.rawCode) return;
        
                // Prevent adding icons if they already exist
                if (container.querySelector('.code-block-actions')) return;

                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'code-block-actions';
        
                // Add "Open in New Tab" button if applicable
                if (container.dataset.previewable) {
                    const openBtn = document.createElement('button');
                    openBtn.className = 'open-new-tab-button';
                    openBtn.title = 'Open in new tab';
                    openBtn.innerHTML = OPEN_NEW_TAB;
                    openBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const rawContent = decodeURIComponent(container.dataset.rawContent);
                        const newWindow = window.open('about:blank', '_blank');
                        if (newWindow) {
                            newWindow.document.write(rawContent);
                            newWindow.document.close();
                        } else {
                            alert('Popup blocker might be preventing the new tab from opening.');
                        }
                    });
                    actionsContainer.appendChild(openBtn);
                }
        
                // Add "Copy Code" button
                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.title = 'Copy code';
                copyCodeBtn.innerHTML = COPY;
                copyCodeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(pre.textContent).then(() => {
                        copyCodeBtn.innerHTML = CHECK;
                        setTimeout(() => { copyCodeBtn.innerHTML = COPY; }, 2000);
                    });
                });
                actionsContainer.appendChild(copyCodeBtn);
                container.appendChild(actionsContainer);
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
                        <optgroup label="Retro Themes">
                            <option value="dracula">Dracula</option>
                        </optgroup>
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
        },

        showFullscreenPreview(content, type) {
            const { fullscreenContent, fullscreenOverlay, body } = this.elements;
            fullscreenContent.innerHTML = '';
            
            switch(type) {
                case 'image':
                    const img = document.createElement('img');
                    img.src = content;
                    fullscreenContent.appendChild(img);
                    break;
                case 'svg':
                    fullscreenContent.innerHTML = content;
                    break;
                case 'html':
                    const iframe = document.createElement('iframe');
                    iframe.srcdoc = content;
                    iframe.sandbox = "allow-scripts allow-same-origin";
                    fullscreenContent.appendChild(iframe);
                    break;
            }
            
            fullscreenOverlay.style.display = 'flex';
            body.classList.add('modal-open');
        },
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
        
            // Fullscreen preview listeners
            elements.messageArea.addEventListener('click', Controller.handlePreviewClick.bind(Controller));
            elements.fullscreenCloseBtn.addEventListener('click', Controller.closeFullscreenPreview.bind(Controller));
            elements.fullscreenOverlay.addEventListener('click', (e) => {
                if (e.target === elements.fullscreenOverlay) {
                    Controller.closeFullscreenPreview();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && elements.body.classList.contains('modal-open')) {
                    Controller.closeFullscreenPreview();
                }
            });
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
        
                // Render user's prompt message
                const userMessageId = ChatApp.Utils.generateUUID();
                const userMessage = {
                    id: userMessageId,
                    content: { role: "user", parts: [{ text: userInput }] }
                };
                ChatApp.State.addMessage(userMessage);
                ChatApp.UI.renderMessage(userMessage);
                
                this._generateImage(userInput);
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
        
        _generateImage(prompt) {
            ChatApp.State.setGenerating(true);
            const thinkingMessageEl = ChatApp.UI.renderMessage({ id: null, content: { role: 'model', parts: [{ text: `Generating image for: "${prompt}"...` }] }}, true);

            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
            
            const imageMarkdown = `[IMAGE: ${prompt}](${imageUrl})`;
            const botMessageId = ChatApp.Utils.generateUUID();
            const botMessage = { id: botMessageId, content: { role: "model", parts: [{ text: imageMarkdown }] } };
            
            const tempImage = new Image();
            tempImage.onload = () => {
                ChatApp.State.addMessage(botMessage);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage(botMessage);
                this.saveCurrentChat();
                ChatApp.State.setGenerating(false);
            };
            tempImage.onerror = () => {
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: `Sorry, there was an error loading the image from Pollinations.ai.` }] } });
                ChatApp.State.setGenerating(false);
            };
            tempImage.src = imageUrl;
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
        },

        deleteAllData() {
            if (confirm('DANGER: This will delete ALL conversations and settings permanently. This action cannot be undone. Are you sure?')) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.THEME);
                ChatApp.State.allConversations = [];
                alert('All data has been deleted. The application will now reload.');
                location.reload();
            }
        },

        handlePreviewClick(event) {
            const image = event.target.closest('.generated-image');
            const svgBox = event.target.closest('.svg-render-box');
            const htmlBox = event.target.closest('.html-render-box');

            if (image) {
                event.preventDefault();
                ChatApp.UI.showFullscreenPreview(image.src, 'image');
            } else if (svgBox) {
                const svgElement = svgBox.querySelector('svg');
                if (svgElement) {
                    ChatApp.UI.showFullscreenPreview(svgElement.outerHTML, 'svg');
                }
            } else if (htmlBox) {
                const iframe = htmlBox.querySelector('iframe');
                if (iframe) {
                    ChatApp.UI.showFullscreenPreview(iframe.srcdoc, 'html');
                }
            }
        },
        
        closeFullscreenPreview() {
            const { fullscreenOverlay, fullscreenContent, body } = ChatApp.UI.elements;
            fullscreenOverlay.style.display = 'none';
            fullscreenContent.innerHTML = '';
            body.classList.remove('modal-open');
        }
    }
};

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});

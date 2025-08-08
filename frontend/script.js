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
            IMAGE: '/api/img-gen'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations'
        },
        DEFAULT_THEME: 'light',
        TYPING_SPEED_MS: 15, // Milliseconds per character
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
        typingInterval: null,
        ttsEnabled: false,
        selectedVoice: null,
        ttsVolume: 1,
        filteredVoices: [],
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
                const textContent = content.parts[0]?.text || '';
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
                if (file.type.startsWith('image/')) {
                    item.innerHTML = `<img src="${file.dataUrl}" alt="${ChatApp.Utils.escapeHTML(file.name)}" class="attachment-media">`;
                } else if (file.type.startsWith('video/')) {
                    item.innerHTML = `<video src="${file.dataUrl}" controls class="attachment-media"></video>`;
                }
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

                const reader = new FileReader();
                reader.onload = (e) => {
                    let previewContent = '';
                    if (file.type.startsWith('image/')) {
                        previewContent = `<img src="${e.target.result}" alt="${ChatApp.Utils.escapeHTML(file.name)}">`;
                    } else if (file.type.startsWith('video/')) {
                         previewContent = `<video src="${e.target.result}" muted playsinline></video>`;
                    } else {
                        previewContent = `<span>${ChatApp.Utils.escapeHTML(file.name)}</span>`;
                    }
                    previewItem.innerHTML = `
                        ${previewContent}
                        <button class="remove-preview-btn" title="Remove file" type="button">&times;</button>
                    `;
                    previewItem.querySelector('.remove-preview-btn').addEventListener('click', () => {
                        ChatApp.Controller.removeAttachedFile(index);
                    });
                };
                reader.readAsDataURL(file);
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
            let html = ChatApp.Utils.escapeHTML(text)
                .replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
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
            
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`);
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote>${match.replace(/^> /gm, '').trim()}</blockquote>`);
            html = html.replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            
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
            
            if (rawText && !rawText.startsWith('[IMAGE:')) {
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
        
        renderSettingsModal() { /* ... function unchanged ... */ },
        speakTTS(text) { /* ... function unchanged ... */ },
        _populateVoiceList() { /* ... function unchanged ... */ }
    },

    // --- API Module ---
    Api: { /* ... module unchanged ... */ },
    
    // --- Controller Module (Application Logic) ---
    /**
     * @memberof ChatApp
     * @namespace Controller
     * @description Orchestrates the application, connecting user actions to state changes and UI updates.
     */
    Controller: {
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },

        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = ChatApp.State.attachedFiles;

            if ((!userInput && files.length === 0) || ChatApp.State.isGenerating) return;
            
            ChatApp.State.setGenerating(true);

            // 1. Process and prepare file data for local display
            const fileDataPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve({
                        name: file.name,
                        type: file.type,
                        dataUrl: e.target.result
                    });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            const attachments = await Promise.all(fileDataPromises);

            // 2. Clear inputs
            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            this.clearAttachedFiles();

            // 3. Create and render the user's message
            const userMessageId = ChatApp.Utils.generateUUID();
            const userMessage = {
                id: userMessageId,
                content: { role: "user", parts: [{ text: userInput }] },
                attachments: attachments
            };
            ChatApp.State.addMessage(userMessage);
            ChatApp.UI.renderMessage(userMessage);
            
            // 4. Handle different generation types
            if (userInput.toLowerCase().startsWith('/img ')) {
                const prompt = userInput.substring(5).trim();
                if (prompt) this._generateImage(prompt);
                else {
                    ChatApp.UI.renderMessage({ id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: "Please provide a prompt after `/img`." }] } });
                    ChatApp.State.setGenerating(false);
                }
            } else {
                this._generateText();
            }
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
            ChatApp.UI.speakTTS(botResponseText);
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
        deleteConversation(chatId) { /* ... function unchanged ... */ },
        downloadAllData() { /* ... function unchanged ... */ },
        handleDataUpload() { /* ... function unchanged ... */ },
        deleteAllData() { /* ... function unchanged ... */ }
    },
    
    // --- Application Initialization ---
    _bindEventListeners() {
        const { elements } = this.UI;
        elements.newChatBtn.addEventListener('click', () => this.Controller.startNewChat());
        
        elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
        elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));

        elements.chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.Controller.handleChatSubmission(); 
            }
        });

        elements.chatInput.addEventListener('input', () => {
            elements.chatInput.style.height = 'auto';
            elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
            this.UI.toggleSendButtonState();
        });

        elements.sendButton.addEventListener('click', () => this.Controller.handleChatSubmission());
        elements.settingsButton.addEventListener('click', () => this.UI.renderSettingsModal());
        elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', (e) => this.Controller.handleFileSelection(e));
    },

    /**
     * Initializes the entire application.
     */
    init() {
        this.UI.cacheElements();
        this.UI.applyTheme(this.Store.getTheme());
        this.Store.loadAllConversations();
        
        // This logic is now handled by CSS media queries for a more robust responsive design.
        // We no longer need to add the class via JS on init.
        
        this.Controller.startNewChat();
        this._bindEventListeners();
        console.log("J.B.A.I. Chat Application Initialized.");
    }
};

window.addEventListener('DOMContentLoaded', () => ChatApp.init());

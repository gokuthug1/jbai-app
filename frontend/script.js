/**
 * A self-contained Chat Application object.
 */
const ChatApp = {
    // --- Configuration Module ---
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
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`,
            PROCESSING: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/><path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.5A4.5 4.5 0 0 0 8 3zM3.5 13.5A4.5 4.5 0 0 0 8 16a4.5 4.5 0 0 0 4.5-4.5H16a6 6 0 0 1-12 0h1.5z"/></svg>`
        }
    },

    // --- State Management Module ---
    State: {
        currentConversation: [], allConversations: [], currentChatId: null,
        isGenerating: false, apiAbortController: null,
        ttsEnabled: false, selectedVoice: null, ttsVolume: 1,
        filteredVoices: [], attachedFiles: [],

        setGenerating(status) {
            this.isGenerating = status;
            ChatApp.UI.toggleSendButtonState();
            if (!status) { this.apiAbortController = null; }
        },
        
        resetCurrentChat() {
            if (this.apiAbortController) { this.apiAbortController.abort(); }
            this.currentConversation = []; this.currentChatId = null;
        
            this.attachedFiles = []; ChatApp.UI.renderFilePreviews();
            if (this.isGenerating) { this.setGenerating(false); }
        }
    },

    // --- Utility Module ---
    Utils: {
        escapeHTML: str => { const p = document.createElement('p'); p.textContent = str; return p.innerHTML; },
        generateUUID: () => crypto.randomUUID(),
    },

    // --- Local Storage Module ---
    Store: {
        saveAllConversations: () => localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations)),
        loadAllConversations: () => {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme: themeName => localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName),
        getTheme: () => localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME,
    },

    // --- UI Module (DOM Interaction & Rendering) ---
    UI: {
        elements: {},
        cacheElements() {
            this.elements = {
                body: document.body, sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
                sidebarToggle: document.getElementById('sidebar-toggle'), newChatBtn: document.getElementById('new-chat-btn'),
                conversationList: document.getElementById('conversation-list'), messageArea: document.getElementById('message-area'),
                emptyChatPlaceholder: document.getElementById('empty-chat-placeholder'), chatInput: document.getElementById('chat-input'),
                sendButton: document.getElementById('send-button'), settingsButton: document.getElementById('toggle-options-button'),
                attachFileButton: document.getElementById('attach-file-button'), fileInput: document.getElementById('file-input'),
                filePreviewsContainer: document.getElementById('file-previews-container'),
            };
        },
        applyTheme: themeName => {
            document.documentElement.setAttribute('data-theme', themeName);
            ChatApp.Store.saveTheme(themeName);
        },
        scrollToBottom: () => {
            if (this.elements.messageArea) {
                this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight;
            }
        },
        clearChatArea() {
            this.elements.messageArea.innerHTML = '';
            this.elements.chatInput.value = '';
            this.elements.chatInput.style.height = 'auto';
            this.toggleSendButtonState();
            this.togglePlaceholder(true);
        },
        togglePlaceholder(forceShow = false) {
            const hasMessages = this.elements.messageArea.querySelector('.message');
            if (forceShow || !hasMessages) {
                this.elements.emptyChatPlaceholder.classList.add('visible');
                if (!this.elements.messageArea.contains(this.elements.emptyChatPlaceholder)) {
                    this.elements.messageArea.appendChild(this.elements.emptyChatPlaceholder);
                }
            } else {
                this.elements.emptyChatPlaceholder.classList.remove('visible');
            }
        },
        toggleSendButtonState() {
            const hasText = this.elements.chatInput.value.trim().length > 0;
            const hasFiles = ChatApp.State.attachedFiles.length > 0;
            const isGenerating = ChatApp.State.isGenerating;
            this.elements.sendButton.disabled = (!hasText && !hasFiles) || isGenerating;
        },
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
                                <button type="button" class="delete-btn" title="Delete Chat">${ChatApp.Config.ICONS.DELETE}</button>`;
                item.addEventListener('click', () => ChatApp.Controller.loadChat(chat.id));
                item.querySelector('.delete-btn').addEventListener('click', e => {
                    e.stopPropagation(); ChatApp.Controller.deleteConversation(chat.id);
                });
                this.elements.conversationList.appendChild(item);
            });
        },
        renderMessage(message) {
            this.togglePlaceholder(false);
            const messageEl = document.createElement('div');
            messageEl.className = `message ${message.role}`;
            messageEl.dataset.messageId = message.id;
            
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (message.attachments && message.attachments.length > 0) {
                const attachmentsContainer = this._createAttachmentsContainer(message.attachments);
                contentEl.appendChild(attachmentsContainer);
            }
            
            // Append text content below attachments
            if (message.text) {
                const textNode = document.createElement('div');
                textNode.innerHTML = this._formatMessageContent(message.text);
                contentEl.appendChild(textNode);
            }
            
            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            this._addMessageInteractions(messageEl, message.text, message.id);
            this.scrollToBottom();
            return messageEl;
        },
        renderThinkingMessage() {
            this.togglePlaceholder(false);
            const messageEl = document.createElement('div');
            messageEl.className = 'message bot thinking';
            messageEl.innerHTML = `<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
            this.elements.messageArea.appendChild(messageEl);
            this.scrollToBottom();
            return messageEl;
        },
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
                }
                container.appendChild(item);
            });
            return container;
        },
        renderFilePreviews() { /* ... unchanged ... */ },
        _formatMessageContent: (text) => text ? text.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${ChatApp.Utils.escapeHTML(code.trim())}</code></pre>`).replace(/^# (.*$)/gim, '<h1>$1</h1>') : '',
        _addMessageInteractions(messageEl, rawText, messageId) { /* ... largely unchanged, removed aria labels ... */ },
        renderSettingsModal() {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
            <div class="settings-card">
                <h2>Settings</h2>
                <div class="settings-row">
                    <label for="themeSelect">Theme</label>
                    <select id="themeSelect">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="dracula">Dracula</option>
                        <option value="midnight">Midnight</option>
                        <option value="monokai">Monokai</option>
                        <option value="nord">Nord</option>
                        <option value="solarized-light">Solarized Light</option>
                        <option value="github-light">GitHub Light</option>
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
                <button id="upload-data-btn" type="button">Import Data</button>
                <button id="download-data-btn" type="button">Export Data</button>
                <button id="delete-data-btn" type="button" class="btn-danger">Delete All Data</button>
            </div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', e => { if (e.target === overlay) this.closeSettingsModal(); });
            
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
        closeSettingsModal: () => document.querySelector('.modal-overlay')?.remove(),
        speakTTS: (text) => { /* ... unchanged ... */ },
    },

    // --- API Module ---
    Api: {
        async getSystemContext() {
            return `You are J.B.A.I., a helpful assistant.
            Current Date/Time: ${new Date().toLocaleString()}
            ---
            File Handling Rule:
            When the user uploads files, their message will include placeholders like:
            - [User uploaded image: "filename.jpg"]
            - [User uploaded video: "movie.mp4"]
            - [User uploaded file: "document.pdf"]
            
            You CANNOT see the file contents. Your task is to ACKNOWLEDGE the upload based on the filename and type, then respond to the user's text prompt.
            
            Example:
            User: check out this pic [User uploaded image: "sunset_at_beach.jpg"] what do you think?
            Your Response: A sunset at the beach sounds beautiful! I can imagine the colors are stunning. What would you like to discuss about it?
            
            ---
            Jeremiah's Custom Commands:
            (List of commands as before)
            ---
            Rules:
            - Acknowledge file uploads naturally. Do not say you "see" the file.
            - Follow all other rules and commands as previously instructed.`;
        },
        async fetchTitle: (chatHistory, signal) => { /* ... unchanged ... */ },
        async fetchTextResponse: (apiContents, systemInstruction, signal) => { /* ... unchanged ... */ },
    },
    
    // --- Controller Module (Application Logic) ---
    Controller: {
        init() {
            ChatApp.UI.cacheElements();
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            ChatApp.Store.loadAllConversations();
            ChatApp.UI.renderSidebar();
            ChatApp.UI.togglePlaceholder(true);
            ChatApp.UI.toggleSendButtonState();
            // ... (event listeners are the same, but settings one is simplified)
            ChatApp.UI.elements.settingsButton.addEventListener('click', () => ChatApp.UI.renderSettingsModal());
        },
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },
        async handleChatSubmission() {
            if (ChatApp.State.isGenerating) return;
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            if (!userInput && files.length === 0) return;

            ChatApp.State.setGenerating(true);
            
            let processingMessageEl = null;
            if(files.length > 0){
                processingMessageEl = ChatApp.UI.renderProcessingMessage(files);
            }

            const { textForApi, attachmentsForUi } = await this._processFilesForSubmission(files, userInput);
            this._clearInputs();

            const userMessage = { role: "user", id: ChatApp.Utils.generateUUID(), text: userInput, attachments: attachmentsForUi };
            ChatApp.UI.renderMessage(userMessage);

            if (processingMessageEl) {
                // Keep the processing message for a moment for UX
                setTimeout(() => processingMessageEl.remove(), 1000);
            }
            
            // Add the user message with the API-formatted text to the conversation history
            ChatApp.State.currentConversation.push({ id: userMessage.id, content: { role: "user", parts: [{ text: textForApi }] }});
            
            this._triggerGeneration();
        },
        async _processFilesForSubmission(files, userInput) {
            let filePlaceholders = [];
            const attachmentPromises = files.map(file => {
                let type = 'file';
                if (file.type.startsWith('image/')) type = 'image';
                if (file.type.startsWith('video/')) type = 'video';
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
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            ChatApp.State.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
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

            } catch (error) { /* ... error handling unchanged ... */ }
        },
        completeGeneration(botResponseText, messageId) {
            ChatApp.State.currentConversation.push({ id: messageId, content: { role: "model", parts: [{ text: botResponseText }] }});
            this.saveCurrentChat();
            ChatApp.UI.speakTTS(botResponseText);
            ChatApp.State.setGenerating(false);
        },
        loadChat(chatId) {
            if (ChatApp.State.currentChatId === chatId) return;
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat) return;
        
            this.startNewChat();
            ChatApp.State.currentChatId = chatId;
            // Simplified loading. Assumes history is stored correctly.
            ChatApp.State.currentConversation = chat.history;
            
            ChatApp.UI.clearChatArea();
            chat.history.forEach(msg => {
                const role = msg.content.role === 'model' ? 'bot' : 'user';
                const text = msg.content.parts[0]?.text || '';
                // Note: Attachments from history are not re-rendered in this simplified version.
                ChatApp.UI.renderMessage({ role, id: msg.id, text });
            });
        
            setTimeout(() => ChatApp.UI.scrollToBottom(), 0);
            ChatApp.UI.renderSidebar();
        },
        // ... (Other controller methods like save, delete, data handling remain largely the same) ...
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // A simple mock for renderFilePreviews which was not included in the provided snippets.
    if (!ChatApp.UI.renderFilePreviews) {
        ChatApp.UI.renderFilePreviews = () => {
            const container = ChatApp.UI.elements.filePreviewsContainer;
            if (!container) return;
            container.innerHTML = '';
            if (ChatApp.State.attachedFiles.length > 0) {
                container.style.display = 'flex';
                ChatApp.State.attachedFiles.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.className = 'file-preview-item';
                    item.innerHTML = `...`; // Simplified preview logic
                    container.appendChild(item);
                });
            } else {
                container.style.display = 'none';
            }
            ChatApp.UI.toggleSendButtonState();
        };
    }
    ChatApp.Controller.init();
});

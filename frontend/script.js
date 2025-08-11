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
            PROCESSING: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`
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
        escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        },
        generateUUID() {
            return crypto.randomUUID();
        },
    },

    // --- Local Storage Module ---
    Store: {
        saveAllConversations() {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations));
        },
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme(themeName) {
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName);
        },
        getTheme() {
            return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME;
        },
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
        applyTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            ChatApp.Store.saveTheme(themeName);
        },
        scrollToBottom() {
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
                } else {
                    item.innerHTML = `<div class="attachment-fallback">${ChatApp.Utils.escapeHTML(file.name)}</div>`;
                }
                container.appendChild(item);
            });
            return container;
        },
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
                    let previewContent = '';
                    if (file.type.startsWith('image/')) {
                        previewContent = `<img src="${e.target.result}" alt="${ChatApp.Utils.escapeHTML(file.name)}">`;
                    } else if (file.type.startsWith('video/')) {
                         previewContent = `<video src="${e.target.result}" muted playsinline></video>`;
                    } else {
                        previewContent = `<div class="file-preview-fallback"><span>${ChatApp.Utils.escapeHTML(file.name.split('.').pop())}</span></div>`;
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
                container.appendChild(previewItem);
            });
            this.toggleSendButtonState();
        },
        _formatMessageContent(text) {
             return text ? text.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${ChatApp.Utils.escapeHTML(code.trim())}</code></pre>`).replace(/^# (.*$)/gim, '<h1>$1</h1>') : '';
        },
        _addMessageInteractions(messageEl, rawText, messageId) {
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;
            
            const { COPY, CHECK } = ChatApp.Config.ICONS;
            
            if (rawText) {
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
                contentEl.appendChild(copyBtn);
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
        closeSettingsModal() {
            document.querySelector('.modal-overlay')?.remove()
        },
        speakTTS(text) {
            if (!window.speechSynthesis || !ChatApp.State.ttsEnabled || !text.trim()) return;
            window.speechSynthesis.cancel();
            const speechText = text.replace(/```[\s\S]*?```/g, '... Code block ...');
            if (!speechText.trim()) return;
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.volume = ChatApp.State.ttsVolume;
            if (ChatApp.State.selectedVoice) utterance.voice = ChatApp.State.selectedVoice;
            window.speechSynthesis.speak(utterance);
        },
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
            Rules:
            - Acknowledge file uploads naturally. Do not say you "see" the file.
            - Follow all other rules and commands as previously instructed.`;
        },
        async fetchTitle(chatHistory, signal) {
             const safeHistory = chatHistory.filter(h => h.content?.parts?.[0]?.text);
            if (safeHistory.length < 2) return "New Chat";

            const prompt = `Based on this conversation, create a short, concise title (4 words max). Output only the title, no quotes or markdown.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
            try {
                const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
                    signal
                });
                if (!response.ok) throw new Error("API error");
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
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: apiContents, systemInstruction }),
                signal
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!botResponseText) throw new Error("Invalid response from API.");
            return botResponseText;
        }
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
                elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
                ChatApp.UI.toggleSendButtonState();
            });
            elements.newChatBtn.addEventListener('click', () => this.startNewChat());
            elements.settingsButton.addEventListener('click', () => ChatApp.UI.renderSettingsModal());
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
            elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
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
                setTimeout(() => processingMessageEl.remove(), 1000);
            }
            
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

            } catch (error) {
                 if (error.name === 'AbortError') {
                    console.log('API request was aborted.');
                    thinkingMessageEl.remove();
                } else {
                    console.error("Generation failed:", error);
                    thinkingMessageEl.remove();
                    ChatApp.UI.renderMessage({ role: 'bot', id: ChatApp.Utils.generateUUID(), text: `Sorry, an error occurred: ${error.message}` });
                    ChatApp.State.setGenerating(false);
                }
            }
        },
        completeGeneration(botResponseText, messageId) {
            ChatApp.State.currentConversation.push({ id: messageId, content: { role: "model", parts: [{ text: botResponseText }] }});
            this.saveCurrentChat();
            ChatApp.UI.speakTTS(botResponseText);
            ChatApp.State.setGenerating(false);
        },
        handleFileSelection(event) {
            ChatApp.State.attachedFiles.push(...Array.from(event.target.files));
            ChatApp.UI.renderFilePreviews();
            event.target.value = null;
        },
        removeAttachedFile(index) {
            ChatApp.State.attachedFiles.splice(index, 1);
            ChatApp.UI.renderFilePreviews();
        },
        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;

            if (ChatApp.State.currentChatId) {
                const chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
                if (chat) chat.history = ChatApp.State.currentConversation;
            } else {
                 const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                 const modelMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'model').length;
                 if (userMessages > 0 && modelMessages > 0) {
                    const titleAbortController = new AbortController();
                    const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation, titleAbortController.signal);
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
            if (!chat || !chat.history) {
                 alert("Could not load the selected chat.");
                 return;
            }
        
            this.startNewChat();
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.currentConversation = chat.history;
            
            ChatApp.UI.clearChatArea();
            chat.history.forEach(msg => {
                if (!msg.content || !msg.content.parts) return;
                const role = msg.content.role === 'model' ? 'bot' : 'user';
                const text = msg.content.parts[0]?.text.replace(/\[User uploaded.*?\]/g, '').trim();
                ChatApp.UI.renderMessage({ role, id: msg.id, text });
            });
        
            setTimeout(() => ChatApp.UI.scrollToBottom(), 0);
            ChatApp.UI.renderSidebar();
        },
        deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message?')) return;
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
                            throw new Error("Invalid data format.");
                        }
                        if (confirm('This will replace all current conversations. Are you sure?')) {
                            ChatApp.State.allConversations = importedData;
                            ChatApp.Store.saveAllConversations();
                            alert('Data successfully imported. Reloading...');
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
            if (confirm('DANGER: This will permanently delete ALL conversations. Are you sure?')) {
                ChatApp.State.allConversations = [];
                ChatApp.Store.saveAllConversations();
                this.startNewChat();
                ChatApp.UI.closeSettingsModal();
                alert('All conversation data has been deleted.');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});

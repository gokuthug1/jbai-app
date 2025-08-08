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
            if (!status && this.typingInterval) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
            }
        },
        
        resetCurrentChat() {
            this.setCurrentConversation([]);
            this.currentChatId = null;
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
                sidebarToggle: document.getElementById('sidebar-toggle'),
                newChatBtn: document.getElementById('new-chat-btn'),
                conversationList: document.getElementById('conversation-list'),
                messageArea: document.getElementById('message-area'),
                chatInput: document.getElementById('chat-input'),
                sendButton: document.getElementById('send-button'),
                settingsButton: document.getElementById('toggle-options-button')
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
         * @param {object} options - The message options.
         * @param {string} options.content - The message text or initial content.
         * @param {string} options.sender - 'user' or 'bot'.
         * @param {string} options.id - The unique message ID.
         * @param {boolean} [options.isTyping=false] - If true, renders a "thinking" indicator.
         * @returns {HTMLElement} The created message element.
         */
        renderMessage({ content, sender, id, isTyping = false }) {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${sender}`;
            messageEl.dataset.messageId = id;

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (isTyping) {
                messageEl.classList.add('thinking');
                contentEl.innerHTML = `<span></span><span></span><span></span>`;
            } else {
                contentEl.innerHTML = this._formatMessageContent(content);
                this._addMessageInteractions(messageEl, content, id);
            }
            
            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            this.scrollToBottom();
            return messageEl;
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
                    
                    // Render final HTML with markdown and add interactions
                    contentEl.innerHTML = this._formatMessageContent(fullText);
                    this._addMessageInteractions(messageEl, fullText, messageId);
                    this.scrollToBottom();

                    // Complete the generation cycle
                    ChatApp.Controller.completeGeneration(fullText, messageId);
                }
            }, ChatApp.Config.TYPING_SPEED_MS);
        },

        _addMessageInteractions(messageEl, rawText, messageId) {
            this._addCopyButtons(messageEl, rawText);
            
            // Long-press or Shift-click to delete a message
            let pressTimer = null;
            const startDeleteTimer = () => {
                pressTimer = setTimeout(() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    ChatApp.Controller.deleteMessage(messageId);
                }, 800); // 800ms for long press
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
            let html = ChatApp.Utils.escapeHTML(text)
                // Image markdown: [IMAGE: prompt](url)
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
            
            // Standard markdown
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`);
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote>${match.replace(/^> /gm, '').trim()}</blockquote>`);
            html = html.replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            
            // Wrap remaining lines in <p> tags
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
            
            // Overall message copy button (only if not an image-only message)
            if (!rawText.startsWith('[IMAGE:')) {
                const { COPY, CHECK } = ChatApp.Config.ICONS;
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
            
            // Code block copy buttons
            contentEl.querySelectorAll('pre').forEach(pre => {
                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.innerHTML = `Copy Code`;
                copyCodeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(pre.querySelector('code').textContent).then(() => {
                        copyCodeBtn.textContent = 'Copied!';
                        setTimeout(() => { copyCodeBtn.innerHTML = 'Copy Code'; }, 2000);
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
                <div class="settings-row">
                    <label for="ttsToggle">Enable TTS</label>
                    <label class="switch"><input type="checkbox" id="ttsToggle"><span class="slider"></span></label>
                </div>
                <div class="settings-row">
                    <label for="volumeSlider">Voice Volume</label>
                    <input type="range" min="0" max="1" step="0.1" value="${ChatApp.State.ttsVolume}" id="volumeSlider">
                </div>
                <div class="settings-row">
                    <label for="voiceSelect">Bot Voice</label>
                    <select id="voiceSelect" disabled></select>
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
            
            // Bind settings events
            const themeSelect = overlay.querySelector('#themeSelect');
            themeSelect.value = this.getTheme();
            themeSelect.addEventListener('change', e => this.applyTheme(e.target.value));

            overlay.querySelector('#ttsToggle').checked = ChatApp.State.ttsEnabled;
            overlay.querySelector('#ttsToggle').addEventListener('change', e => { ChatApp.State.ttsEnabled = e.target.checked; });
            overlay.querySelector('#volumeSlider').addEventListener('input', e => { ChatApp.State.ttsVolume = parseFloat(e.target.value); });
            overlay.querySelector('#voiceSelect').addEventListener('change', e => { 
                if(ChatApp.State.filteredVoices[e.target.value]) ChatApp.State.selectedVoice = ChatApp.State.filteredVoices[e.target.value]; 
            });

            overlay.querySelector('#upload-data-btn').addEventListener('click', ChatApp.Controller.handleDataUpload);
            overlay.querySelector('#download-data-btn').addEventListener('click', ChatApp.Controller.downloadAllData);
            overlay.querySelector('#delete-data-btn').addEventListener('click', ChatApp.Controller.deleteAllData);
            overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
            
            this._populateVoiceList();
        },

        speakTTS(text) {
            if (!window.speechSynthesis || !ChatApp.State.ttsEnabled || !text.trim() || text.startsWith('[IMAGE:')) return;
            
            window.speechSynthesis.cancel(); // Stop any previous speech
            // Create a clean version of the text for speech
            const speechText = text.replace(/```[\s\S]*?```/g, '... Code block ...').replace(/\[IMAGE:.*?\]\(.*?\)/g, '... Image ...');
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.volume = ChatApp.State.ttsVolume;
            if (ChatApp.State.selectedVoice) utterance.voice = ChatApp.State.selectedVoice;
            window.speechSynthesis.speak(utterance);
        },

        _populateVoiceList() {
            const voiceSelect = document.getElementById('voiceSelect');
            if (!voiceSelect || typeof speechSynthesis === 'undefined') return;
            const setVoices = () => {
                ChatApp.State.filteredVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
                voiceSelect.innerHTML = '';
                if (ChatApp.State.filteredVoices.length === 0) {
                    voiceSelect.disabled = true; voiceSelect.innerHTML = '<option>No English voices found</option>'; return;
                }
                voiceSelect.disabled = !ChatApp.State.ttsEnabled;
                let selectedIdx = 0;
                ChatApp.State.filteredVoices.forEach((voice, i) => {
                    const option = new Option(`${voice.name} (${voice.lang})`, i);
                    voiceSelect.add(option);
                    if (ChatApp.State.selectedVoice && ChatApp.State.selectedVoice.name === voice.name) {
                        selectedIdx = i;
                    }
                });
                voiceSelect.selectedIndex = selectedIdx;
                if (!ChatApp.State.selectedVoice) ChatApp.State.selectedVoice = ChatApp.State.filteredVoices[0];
            };
            setVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = setVoices;
            }
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
            return `You are a helpful assistant named J.B.A.I. Use standard markdown. You can generate text and images. For images, use the format: [IMAGE: user's prompt](URL_to_image). You have access to the user's real-time context. Use it to answer relevant questions.\nCurrent Context:\n- Current Date/Time: ${new Date().toLocaleString()}`;
        },

        async fetchTitle(chatHistory) {
            const safeHistory = chatHistory.filter(h => h.content?.parts?.[0]?.text && !h.content.parts[0].text.startsWith('[IMAGE:'));
            if (safeHistory.length < 2) return "New Chat";

            const prompt = `Based on this conversation, create a short, concise title (4-5 words max). Output only the title, no quotes or markdown.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
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
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },

        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            if (!userInput || ChatApp.State.isGenerating) return;

            ChatApp.UI.elements.chatInput.value = ""; 
            ChatApp.UI.elements.chatInput.style.height = 'auto';

            const userMessageId = ChatApp.Utils.generateUUID();
            const userMessage = { id: userMessageId, content: { role: "user", parts: [{ text: userInput }] } };
            ChatApp.State.addMessage(userMessage);
            ChatApp.UI.renderMessage({ content: userInput, sender: 'user', id: userMessageId });
            
            if (userInput.toLowerCase().startsWith('/img ')) {
                const prompt = userInput.substring(5).trim();
                if (prompt) this._generateImage(prompt);
                else ChatApp.UI.renderMessage({ content: "Please provide a prompt after `/img`.", sender: 'bot', id: ChatApp.Utils.generateUUID() });
            } else {
                this._generateText();
            }
        },

        async _generateText() {
            ChatApp.State.setGenerating(true);
            const thinkingMessageEl = ChatApp.UI.renderMessage({ content: '', sender: 'bot', id: null, isTyping: true });

            try {
                const systemInstruction = { parts: [{ text: await ChatApp.Api.getSystemContext() }] };
                const apiContents = ChatApp.State.currentConversation.map(msg => msg.content);
                const botResponseText = await ChatApp.Api.fetchTextResponse(apiContents, systemInstruction);
                
                // The typing animation will handle the rest of the logic via a callback
                ChatApp.UI.finalizeBotMessage(thinkingMessageEl, botResponseText, ChatApp.Utils.generateUUID());
            } catch (error) {
                console.error("Text generation failed:", error);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: `Sorry, an error occurred: ${error.message}`, sender: 'bot', id: ChatApp.Utils.generateUUID() });
                ChatApp.State.setGenerating(false);
            }
        },

        /**
         * Callback function executed after the typing animation completes.
         * @param {string} botResponseText - The full text that was displayed.
         * @param {string} messageId - The ID of the newly created message.
         */
        completeGeneration(botResponseText, messageId) {
            const botMessage = { id: messageId, content: { role: "model", parts: [{ text: botResponseText }] } };
            ChatApp.State.addMessage(botMessage);
            this.saveCurrentChat();
            ChatApp.UI.speakTTS(botResponseText);
            ChatApp.State.setGenerating(false);
        },
        
        async _generateImage(prompt) {
            ChatApp.State.setGenerating(true);
            const thinkingMessageEl = ChatApp.UI.renderMessage({ content: `Generating image for: "${prompt}"...`, sender: 'bot', id: null, isTyping: true });

            try {
                const imageUrl = await ChatApp.Api.fetchImageResponse(prompt);
                const imageMarkdown = `[IMAGE: ${prompt}](${imageUrl})`;
                const botMessageId = ChatApp.Utils.generateUUID();
                const botMessage = { id: botMessageId, content: { role: "model", parts: [{ text: imageMarkdown }] } };
                
                ChatApp.State.addMessage(botMessage);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: imageMarkdown, sender: 'bot', id: botMessageId });
                this.saveCurrentChat();
            } catch (error) {
                console.error("Image generation failed:", error);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: `Image Generation Error: ${error.message}`, sender: 'bot', id: ChatApp.Utils.generateUUID() });
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
            } else if (ChatApp.State.currentConversation.length >= 2) {
                const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation);
                ChatApp.State.currentChatId = Date.now(); // Use timestamp for sorting
                ChatApp.State.allConversations.push({ 
                    id: ChatApp.State.currentChatId, 
                    title: newTitle, 
                    history: ChatApp.State.currentConversation 
                });
            }
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        
        loadChat(chatId) {
            if (ChatApp.State.currentChatId === chatId) return; // Don't reload active chat
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat || !Array.isArray(chat.history)) {
                console.error("Chat not found or is corrupted:", chatId);
                alert("Could not load the selected chat.");
                return;
            }

            ChatApp.State.resetCurrentChat();
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.setCurrentConversation(chat.history);
            
            ChatApp.UI.clearChatArea();
            ChatApp.State.currentConversation.forEach(msg => {
                const text = msg.content.parts[0]?.text || '';
                const sender = msg.content.role === 'model' ? 'bot' : 'user';
                ChatApp.UI.renderMessage({ content: text, sender, id: msg.id });
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
            if (confirm('DANGER: This will permanently delete ALL chat data from this browser. Are you absolutely sure?')) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                alert('All chat data has been deleted.');
                location.reload();
            }
        }
    },
    
    // --- Application Initialization ---
    _bindEventListeners() {
        const { elements } = this.UI;
        elements.newChatBtn.addEventListener('click', () => this.Controller.startNewChat());
        elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
        elements.chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.Controller.handleChatSubmission(); 
            }
        });
        elements.chatInput.addEventListener('input', () => {
            elements.chatInput.style.height = 'auto';
            elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
        });
        elements.sendButton.addEventListener('click', () => this.Controller.handleChatSubmission());
        elements.settingsButton.addEventListener('click', () => this.UI.renderSettingsModal());
    },

    /**
     * Initializes the entire application.
     */
    init() {
        this.UI.cacheElements();
        this.UI.applyTheme(this.Store.getTheme());
        this.Store.loadAllConversations();
        
        // Open sidebar by default on larger screens
        if (window.innerWidth > 768) {
            this.UI.elements.body.classList.add('sidebar-open');
        }
        
        this.Controller.startNewChat();
        this._bindEventListeners();
        console.log("J.B.A.I. Chat Application Initialized.");
    }
};

// Start the application once the DOM is fully loaded.
window.addEventListener('DOMContentLoaded', () => ChatApp.init());

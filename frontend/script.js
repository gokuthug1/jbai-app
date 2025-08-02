const ChatApp = {
    // --- Configuration Module ---
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
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`
        }
    },

    // --- State Management Module ---
    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        ttsEnabled: false,
        selectedVoice: null,
        ttsVolume: 1,
        filteredVoices: [],
        isGenerating: false,
        typingInterval: null,

        setCurrentConversation(history) {
            // Data migration for older message formats
            this.currentConversation = history.map((msg, index) => {
                if (msg && msg.content && Array.isArray(msg.content.parts)) return msg;
                if (msg && msg.role && typeof msg.text !== 'undefined') {
                    return { id: msg.id || (Date.now() + index), content: { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] } };
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
        }
    },

    // --- Utility Module ---
    Utils: {
        escapeHTML(str) {
            const p = document.createElement('p');
            p.textContent = str;
            return p.innerHTML;
        }
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
        }
    },

    // --- UI Module (DOM Interaction & Rendering) ---
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
            const sortedConversations = [...ChatApp.State.allConversations].sort((a, b) => b.id - a.id);
            
            sortedConversations.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                if (chat.id === ChatApp.State.currentChatId) item.classList.add('active');
                
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

        renderMessage(message) {
            const { content, id, sender, isTyping } = message;
            const messageEl = document.createElement('div');
            messageEl.className = `message ${sender}`;
            messageEl.dataset.messageId = id;

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (isTyping) {
                messageEl.classList.add('thinking');
                contentEl.textContent = content || "●";
            } else {
                contentEl.innerHTML = (sender === 'bot') ? this._formatMessageContent(content) : ChatApp.Utils.escapeHTML(content);
                this._addMessageInteractions(messageEl, contentEl, content, id);
            }
            
            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            this.scrollToBottom();
            return messageEl;
        },

        updateTypingMessage(thinkingEl, fullText) {
            const contentEl = thinkingEl.querySelector('.message-content');
            if (!contentEl) return;
            
            thinkingEl.classList.remove('thinking');
            contentEl.innerHTML = this._formatMessageContent(fullText);
            this._addCopyButtons(contentEl, fullText);
            this.scrollToBottom();
        },

        _addMessageInteractions(messageEl, contentEl, rawText, messageId) {
            this._addCopyButtons(contentEl, rawText);
            
            let pressTimer = null;
            const startDeleteTimer = () => {
                pressTimer = setTimeout(() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    ChatApp.Controller.deleteMessage(messageId);
                }, 800);
            };
            const clearDeleteTimer = () => clearTimeout(pressTimer);
            
            messageEl.addEventListener('click', e => { if (e.shiftKey) { e.preventDefault(); ChatApp.Controller.deleteMessage(messageId); } });
            messageEl.addEventListener('touchstart', startDeleteTimer, { passive: true });
            messageEl.addEventListener('touchend', clearDeleteTimer);
            messageEl.addEventListener('touchmove', clearDeleteTimer);
        },
        
        _formatMessageContent(text) {
            let html = ChatApp.Utils.escapeHTML(text);
            // Image markdown
            html = html.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
                const safeFilename = (alt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
                return `
                <div class="generated-image-wrapper">
                    <p class="image-prompt-text"><em>Image Prompt: ${ChatApp.Utils.escapeHTML(alt)}</em></p>
                    <div class="image-container">
                        <img src="${url}" alt="${ChatApp.Utils.escapeHTML(alt)}" class="generated-image">
                        <a href="${url}" download="${safeFilename}.png" class="download-image-button" title="Download Image">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M19 21H5" /></svg>
                        </a>
                    </div>
                </div>`;
            });
            // Standard markdown
            html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`);
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            // Wrap non-block lines in <p> tags
            return html.split('\n').map(l => l.trim()).filter(Boolean).map(l => (!l.match(/^<(p|h[1-3]|ul|ol|pre|li|strong|em|code|div)/)) ? `<p>${l}</p>` : l).join('');
        },

        _addCopyButtons(contentEl, rawText) {
            if (rawText.startsWith('[IMAGE:')) return;
            const { COPY, CHECK } = ChatApp.Config.ICONS;
            
            // Message copy button
            if (!contentEl.querySelector('.copy-button')) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-button';
                copyBtn.title = 'Copy full message';
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
            
            // Code block copy buttons
            contentEl.querySelectorAll('pre').forEach(pre => {
                if (pre.querySelector('.copy-code-button')) return;
                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.innerHTML = `${COPY}Copy`;
                copyCodeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(pre.querySelector('code').textContent).then(() => {
                        copyCodeBtn.textContent = 'Copied!';
                        setTimeout(() => { copyCodeBtn.innerHTML = `${COPY}Copy`; }, 2000);
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
</div>                <div class="settings-row"><label>Enable TTS</label><label class="switch"><input type="checkbox" id="ttsToggle"><span class="slider"></span></label></div>
                <div class="settings-row"><label>Voice Volume</label><input type="range" min="0" max="1" step="0.1" value="${ChatApp.State.ttsVolume}" id="volumeSlider"></div>
                <div class="settings-row"><label for="voiceSelect">Bot Voice</label><select id="voiceSelect" disabled></select></div>
                <hr>
                <button id="upload-data-btn" type="button">Upload Data</button>
                <button id="download-data-btn" type="button">Download Data</button>
                <button id="delete-data-btn" type="button" class="btn-danger">Delete All Data</button>
                <button id="closeSettingsBtn" type="button" class="btn-primary" style="margin-top: 20px;">Close</button>
            </div>`;
            
            this.elements.body.appendChild(overlay);
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            
            const themeSelect = overlay.querySelector('#themeSelect');
            themeSelect.value = ChatApp.Store.getTheme();
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
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, 'Code block.'));
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
                    voiceSelect.disabled = true; voiceSelect.innerHTML = '<option>No English voices</option>'; return;
                }
                voiceSelect.disabled = false;
                let selectedIdx = 0;
                ChatApp.State.filteredVoices.forEach((voice, i) => {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    voiceSelect.appendChild(option);
                    if (ChatApp.State.selectedVoice && ChatApp.State.selectedVoice.name === voice.name) selectedIdx = i;
                });
                voiceSelect.selectedIndex = selectedIdx;
                if (!ChatApp.State.selectedVoice) ChatApp.State.selectedVoice = ChatApp.State.filteredVoices[0];
            };
            setVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setVoices;
        }
    },

    // --- API Module ---
    Api: {
        async getSystemContext() {
            return `You are a helpful assistant named J.B.A.I. Use standard markdown. You have access to the user's real-time context. Use it to answer relevant questions.\nCurrent Context:\n- Current Date/Time: ${new Date().toLocaleString()}\n---`;
        },

        async fetchTitle(chatHistory) {
            const safeHistory = chatHistory.filter(h => h.content?.parts?.[0] && !h.content.parts[0].text.startsWith('[IMAGE:'));
            if (safeHistory.length < 2) return "New Chat";

            const prompt = `Based on this conversation, create a short, concise title (4-5 words max). Output only the title, no quotes.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
            try {
                const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
                });
                if (!response.ok) throw new Error("API error for title generation");
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text.trim().replace(/["*]/g, '') || "New Chat";
            } catch (error) {
                console.error("Title generation failed:", error);
                return "New Chat";
            }
        },

        async fetchTextResponse(apiContents, systemInstruction) {
             const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: apiContents, systemInstruction })
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!botResponseText) throw new Error("Invalid or empty API response.");
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
            if (!imageUrl) throw new Error("Could not create image URL from the response.");
            return imageUrl;
        }
    },
    
    // --- Controller Module (Application Logic) ---
    Controller: {
        async startNewChat() {
            if (ChatApp.State.isGenerating) {
                ChatApp.State.setGenerating(false);
            }
            ChatApp.State.currentConversation = [];
            ChatApp.State.currentChatId = null;
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },

        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            if (!userInput || ChatApp.State.isGenerating) return;

            ChatApp.UI.elements.chatInput.value = ""; 
            ChatApp.UI.elements.chatInput.style.height = 'auto';

            const userMessageId = Date.now();
            const userMessage = { id: userMessageId, content: { role: "user", parts: [{ text: userInput }] } };
            ChatApp.State.addMessage(userMessage);
            ChatApp.UI.renderMessage({ content: userInput, sender: 'user', id: userMessageId });
            
            if (userInput.toLowerCase().startsWith('/img ')) {
                const prompt = userInput.substring(5).trim();
                if (prompt) this._generateImage(prompt);
                else ChatApp.UI.renderMessage({ content: "Please provide a prompt after `/img`.", sender: 'bot', id: Date.now() + 1 });
            } else {
                this._generateText();
            }
        },

        async _generateText() {
            ChatApp.State.setGenerating(true);
            const thinkingMessageEl = ChatApp.UI.renderMessage({ sender: 'bot', id: null, isTyping: true });

            try {
                const systemInstruction = { parts: [{ text: await ChatApp.Api.getSystemContext() }] };
                const apiContents = ChatApp.State.currentConversation.map(msg => msg.content);
                const botResponseText = await ChatApp.Api.fetchTextResponse(apiContents, systemInstruction);
                
                thinkingMessageEl.remove(); // Remove thinking indicator before typing effect

                const botMessageId = Date.now() + 1;
                const botMessageEl = ChatApp.UI.renderMessage({ content: '', sender: 'bot', id: botMessageId });
                const contentEl = botMessageEl.querySelector('.message-content');
                
                let i = 0;
                ChatApp.State.typingInterval = setInterval(() => {
                    if (i < botResponseText.length) {
                        contentEl.innerHTML += ChatApp.Utils.escapeHTML(botResponseText[i]);
                        i++;
                        if (i % 10 === 0) ChatApp.UI.scrollToBottom();
                    } else {
                        clearInterval(ChatApp.State.typingInterval);
                        ChatApp.State.typingInterval = null;
                        ChatApp.UI.updateTypingMessage(botMessageEl, botResponseText);
                        
                        const botMessage = { id: botMessageId, content: { role: "model", parts: [{ text: botResponseText }] } };
                        ChatApp.State.addMessage(botMessage);
                        this.saveCurrentChat();
                        ChatApp.UI.speakTTS(botResponseText);
                        ChatApp.State.setGenerating(false);
                    }
                }, 1);

            } catch (error) {
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: `Error: ${error.message}`, sender: 'bot', id: Date.now() + 1 });
                ChatApp.State.setGenerating(false);
            }
        },

        async _generateImage(prompt) {
            ChatApp.State.setGenerating(true);
            const thinkingMessageEl = ChatApp.UI.renderMessage({ content: `Generating image of "${prompt}"...`, sender: 'bot', id: null, isTyping: true });

            try {
                const imageUrl = await ChatApp.Api.fetchImageResponse(prompt);
                const imageMarkdown = `[IMAGE: ${prompt}](${imageUrl})`;
                const botMessageId = Date.now() + 1;
                const botMessage = { id: botMessageId, content: { role: "model", parts: [{ text: imageMarkdown }] } };
                
                ChatApp.State.addMessage(botMessage);
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: imageMarkdown, sender: 'bot', id: botMessageId });
                this.saveCurrentChat();
            } catch (error) {
                thinkingMessageEl.remove();
                ChatApp.UI.renderMessage({ content: `Image Generation Error: ${error.message}`, sender: 'bot', id: Date.now() + 1 });
            } finally {
                ChatApp.State.setGenerating(false);
            }
        },

        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;

            if (ChatApp.State.currentChatId) {
                const chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
                if (chat) chat.history = ChatApp.State.currentConversation;
            } else if (ChatApp.State.currentConversation.length >= 2) {
                const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation);
                ChatApp.State.currentChatId = Date.now();
                ChatApp.State.allConversations.push({ id: ChatApp.State.currentChatId, title: newTitle, history: ChatApp.State.currentConversation });
            }
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        
        loadChat(chatId) {
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat || !Array.isArray(chat.history)) {
                console.error("Chat not found or is corrupted:", chatId);
                return;
            }

            if (ChatApp.State.isGenerating) {
                ChatApp.State.setGenerating(false);
            }
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
            if (!confirm('Are you sure you want to delete this chat? This action is permanent.')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => c.id !== chatId);
            ChatApp.Store.saveAllConversations();
            if (ChatApp.State.currentChatId === chatId) {
                this.startNewChat();
            }
            ChatApp.UI.renderSidebar();
        },
        
        downloadAllData() {
            const dataStr = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
            if (!dataStr || dataStr === '[]') { alert('No conversation data to download.'); return; }
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'jbai_conversations_backup.json';
            ChatApp.UI.elements.body.appendChild(a); a.click(); ChatApp.UI.elements.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        handleDataUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (!Array.isArray(importedData) || !importedData.every(c => c.id && c.title && Array.isArray(c.history))) {
                            throw new Error("Data is not a valid array or has incorrect format.");
                        }
                        if (confirm('Overwrite all current conversations with this data? This cannot be undone.')) {
                            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(importedData));
                            alert('Data successfully imported. The application will now reload.');
                            location.reload();
                        }
                    } catch (error) {
                        alert(`Error importing data: ${error.message}`);
                    }
                };
                reader.onerror = () => alert('Error reading the file.');
                reader.readAsText(file);
            });
            ChatApp.UI.elements.body.appendChild(fileInput);
            fileInput.click();
            ChatApp.UI.elements.body.removeChild(fileInput);
        },

        deleteAllData() {
            if (confirm('Are you absolutely sure you want to delete ALL your chat data? This action cannot be undone.')) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                alert('All chat data has been deleted.');
                location.reload();
            }
        }
    },
    
    // --- Event Listener Setup ---
    _bindEventListeners() {
        const { elements } = this.UI;
        elements.newChatBtn.addEventListener('click', () => this.Controller.startNewChat());
        elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
        elements.chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.Controller.handleChatSubmission(); }
        });
        elements.chatInput.addEventListener('input', () => {
            elements.chatInput.style.height = 'auto';
            elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
        });
        elements.sendButton.addEventListener('click', () => this.Controller.handleChatSubmission());
        elements.settingsButton.addEventListener('click', () => this.UI.renderSettingsModal());
    },

    // --- Application Initialization ---
    init() {
        this.UI.cacheElements();
        this.UI.applyTheme(this.Store.getTheme());
        this.Store.loadAllConversations();
        
        if (window.innerWidth > 768) {
            this.UI.elements.body.classList.add('sidebar-open');
        }
        
        this.Controller.startNewChat(); // Also renders initial sidebar
        this._bindEventListeners();
        console.log("ChatApp Initialized.");
    }
};

// Start the application once the DOM is fully loaded.
window.addEventListener('DOMContentLoaded', () => ChatApp.init());

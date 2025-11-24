import { MessageFormatter } from './formatter.js';
import { SyntaxHighlighter } from './syntaxHighlighter.js';

const ChatApp = {
    Config: {
        API_URLS: {
            TEXT: '/api/server',
            IMAGE: 'https://image.pollinations.ai/prompt/'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations',
            TOOLS: 'jbai_tools_config'
        },
        DEFAULT_THEME: 'light',
        DEFAULT_TOOLS: {
            googleSearch: false,
            codeExecution: false
        },
        // Reduced to 10ms for rapid response while maintaining effect
        TYPING_SPEED_MS: 1,
        MAX_FILE_SIZE_BYTES: 4 * 1024 * 1024,
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`,
            OPEN_NEW_TAB: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
            DOWNLOAD: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
            DOCUMENT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
            HTML: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
            CSS: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline><line x1="12" y1="2" x2="12" y2="22"></line></svg>`,
            JS: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2v12z"></path><path d="M8 12h2a2 2 0 1 0 0-4H8v4z"></path><path d="M6 18V6"></path></svg>`,
            SVG: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m14.31 8 5.74 9.94M9.69 8h11.48M12 2.25 2.25 18H21.75L12 2.25z"></path></svg>`,
            CHEVRON_DOWN: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
            STOP: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>`,
            PLAY: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
            PAUSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
        }
    },

    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        isGenerating: false,
        typingInterval: null,
        attachedFiles: [],
        abortController: null,
        toolsConfig: {},
        setCurrentConversation(history) {
            this.currentConversation = history.map(msg => {
                if (!msg) return null;
                if (msg.id && msg.content && (msg.content.role || msg.content.parts)) return msg;
                return null;
            }).filter(Boolean);
        },
        addMessage(message) { this.currentConversation.push(message); },
        removeMessage(messageId) { this.currentConversation = this.currentConversation.filter(msg => msg.id !== messageId); },
        setGenerating(status) {
            this.isGenerating = status;
            ChatApp.UI.toggleSendButtonState();
            ChatApp.UI.toggleStopButton(status);
            if (!status) {
                if (this.typingInterval) {
                    clearInterval(this.typingInterval);
                    this.typingInterval = null;
                }
                this.abortController = null;
            }
        },
        resetCurrentChat() {
            if (this.isGenerating && this.abortController) {
                this.abortController.abort();
            }
            this.setCurrentConversation([]);
            this.currentChatId = null;
            this.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
            this.setGenerating(false);
        }
    },

    Utils: {
        escapeHTML(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#039;');
        },
        generateUUID() { return crypto.randomUUID(); }
    },

    Store: {
        saveAllConversations() { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations)); },
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme(themeName) { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName); },
        getTheme() { return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME; },
        saveToolsConfig(config) { 
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.TOOLS, JSON.stringify(config)); 
            ChatApp.State.toolsConfig = config;
        },
        getToolsConfig() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.TOOLS);
                const config = stored ? JSON.parse(stored) : ChatApp.Config.DEFAULT_TOOLS;
                ChatApp.State.toolsConfig = config;
                return config;
            } catch (e) {
                return ChatApp.Config.DEFAULT_TOOLS;
            }
        }
    },

    UI: {
        elements: {},
        cacheElements() {
            this.elements = {
                body: document.body,
                toastContainer: document.getElementById('toast-container'),
                sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
                sidebarToggle: document.getElementById('sidebar-toggle'),
                newChatBtn: document.getElementById('new-chat-btn'),
                conversationList: document.getElementById('conversation-list'),
                messageArea: document.getElementById('message-area'),
                chatInput: document.getElementById('chat-input'),
                sendButton: document.getElementById('send-button'),
                stopButton: document.getElementById('stop-button'),
                settingsButton: document.getElementById('toggle-options-button'),
                attachFileButton: document.getElementById('attach-file-button'),
                fileInput: document.getElementById('file-input'),
                filePreviewsContainer: document.getElementById('file-previews-container'),
                fullscreenOverlay: document.getElementById('fullscreen-preview-overlay'),
                fullscreenContent: document.getElementById('fullscreen-content'),
                fullscreenCloseBtn: document.getElementById('fullscreen-close-btn'),
                customTooltip: document.getElementById('custom-tooltip'),
            };
        },
        hideTooltip() {
            if(this.elements.customTooltip) this.elements.customTooltip.classList.remove('visible');
        },
        initTooltips() {
            let tooltipTimeout;
            const tooltip = this.elements.customTooltip;
            const showTooltip = (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (!target) return;
                const tooltipText = target.getAttribute('data-tooltip');
                if (!tooltipText) return;
                tooltip.textContent = tooltipText;
                tooltip.classList.add('visible');
                const targetRect = target.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                let top = targetRect.top - tooltipRect.height - 8;
                let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                if (top < 10) { top = targetRect.bottom + 8; }
                if (left < 10) { left = 10; }
                if (left + tooltipRect.width > window.innerWidth - 10) { left = window.innerWidth - tooltipRect.width - 10; }
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
            };
            document.body.addEventListener('mouseover', (e) => {
                if (e.target.closest('[data-tooltip]')) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = setTimeout(() => showTooltip(e), 300);
                }
            });
            document.body.addEventListener('mouseout', (e) => {
                 if (e.target.closest('[data-tooltip]')) {
                    clearTimeout(tooltipTimeout);
                    this.hideTooltip();
                }
            });
            document.addEventListener('scroll', () => this.hideTooltip(), { capture: true, passive: true });
        },
        applyTheme(themeName) {
            document.documentElement.setAttribute('data-theme', themeName);
            ChatApp.Store.saveTheme(themeName);
        },
        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast-message ${type}`;
            toast.textContent = message;
            this.elements.toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, 3000);
        },
        scrollToBottom() {
            const area = this.elements.messageArea;
            if (!area) return;
            const threshold = 100;
            const isNearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < threshold;
            if (isNearBottom) {
                area.scrollTop = area.scrollHeight;
            }
        },
        forceScrollToBottom() {
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
            this.elements.sendButton.style.display = isGenerating ? 'none' : 'flex';
        },
        toggleStopButton(isGenerating) {
            this.elements.stopButton.style.display = isGenerating ? 'flex' : 'none';
        },
        renderSidebar() {
            this.elements.conversationList.innerHTML = '';
            const sortedConversations = [...ChatApp.State.allConversations].sort((a, b) => b.id - a.id);
            sortedConversations.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                if (chat.id === ChatApp.State.currentChatId) { item.classList.add('active'); }
                const title = ChatApp.Utils.escapeHTML(chat.title || 'Untitled Chat');
                
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', '0');

                item.innerHTML = `
                    <span class="conversation-title" data-tooltip="${title}">${title}</span>
                    <button type="button" class="delete-btn" data-tooltip="Delete Chat">${ChatApp.Config.ICONS.DELETE}</button>`;
                
                item.addEventListener('click', () => ChatApp.Controller.loadChat(chat.id));
                item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ChatApp.Controller.loadChat(chat.id); } });

                item.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    ChatApp.Controller.deleteConversation(chat.id);
                });
                this.elements.conversationList.appendChild(item);
            });
        },
        async renderMessage(message, isTyping = false) {
            const messageEl = document.createElement('div');
            messageEl.dataset.messageId = message.id;
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            let rawContent = ''; // Can be string or array
            let groundingMetadata = null;

            if (isTyping) {
                messageEl.className = 'message bot thinking';
                contentEl.innerHTML = `<span></span><span></span><span></span>`;
            } else {
                const { content, attachments } = message;
                const sender = content.role === 'model' ? 'bot' : 'user';
                
                rawContent = content.parts || []; 
                groundingMetadata = content.groundingMetadata || null;

                if (sender === 'user') {
                    const textPart = rawContent.find(p => p.text);
                    rawContent = textPart ? textPart.text : '';
                }

                messageEl.className = `message ${sender}`;

                contentEl.innerHTML = await MessageFormatter.format(rawContent, groundingMetadata);
                
                if (attachments && attachments.length > 0) {
                    const attachmentsContainer = this._createAttachmentsContainer(attachments);
                    contentEl.prepend(attachmentsContainer);
                }
            }
            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            
            if (!isTyping) { 
                let textRepresentation = '';
                if (Array.isArray(rawContent)) {
                    textRepresentation = rawContent.map(p => p.text || '').join('\n');
                } else {
                    textRepresentation = rawContent;
                }
                this._addMessageInteractions(messageEl, textRepresentation, message.id); 
            }
            this.scrollToBottom();
            return messageEl;
        },
        _createAttachmentsContainer(attachments) {
            const container = document.createElement('div');
            container.className = 'message-attachments';
            attachments.forEach(file => {
                const item = document.createElement('div');
                item.className = 'attachment-item';
                let contentHTML = '';
                
                if (file.data) {
                    if (file.type.startsWith('image/')) {
                        contentHTML = `<img src="${file.data}" alt="${ChatApp.Utils.escapeHTML(file.name)}" class="attachment-media">`;
                    } else if (file.type.startsWith('video/')) {
                        contentHTML = `<video src="${file.data}" class="attachment-media" controls data-tooltip="${ChatApp.Utils.escapeHTML(file.name)}"></video>`;
                    }
                } else {
                    const extension = file.name.split('.').pop()?.toLowerCase() || '';
                    const iconMap = {
                        'html': ChatApp.Config.ICONS.HTML, 'css': ChatApp.Config.ICONS.CSS, 'js': ChatApp.Config.ICONS.JS, 'svg': ChatApp.Config.ICONS.SVG,
                    };
                    const icon = iconMap[extension] || ChatApp.Config.ICONS.DOCUMENT;
                    contentHTML = `
                        <div class="attachment-generic">
                            ${icon}
                            <span class="attachment-filename">${ChatApp.Utils.escapeHTML(file.name)}</span>
                        </div>`;
                }
                item.innerHTML = contentHTML;
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
                const objectURL = URL.createObjectURL(file);
                let previewContent = '';
                
                if (file.type.startsWith('image/')) {
                    previewContent = `<img src="${objectURL}" alt="Preview of ${ChatApp.Utils.escapeHTML(file.name)}">`;
                } else if (file.type.startsWith('video/')) {
                    previewContent = `<video src="${objectURL}" autoplay muted loop playsinline data-tooltip="Preview of ${ChatApp.Utils.escapeHTML(file.name)}"></video>`;
                } else {
                    previewItem.classList.add('generic');
                    const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
                    const iconMap = { 'html': ChatApp.Config.ICONS.HTML, 'css': ChatApp.Config.ICONS.CSS, 'js': ChatApp.Config.ICONS.JS, 'svg': ChatApp.Config.ICONS.SVG, };
                    previewContent = `${iconMap[extension] || ChatApp.Config.ICONS.DOCUMENT}<span class="file-preview-extension">${ChatApp.Utils.escapeHTML(extension.substring(0, 4))}</span>`;
                }

                previewItem.innerHTML = `${previewContent}<button class="remove-preview-btn" data-tooltip="Remove file" type="button">&times;</button>`;
                previewItem.querySelector('.remove-preview-btn').addEventListener('click', () => { ChatApp.Controller.removeAttachedFile(index); });
                this.elements.filePreviewsContainer.appendChild(previewItem);
            });
            this.toggleSendButtonState();
        },
        async finalizeBotMessage(messageEl, contentParts, messageId, botMessageForState) {
            if (ChatApp.State.typingInterval) {
                clearInterval(ChatApp.State.typingInterval);
                ChatApp.State.typingInterval = null;
            }
            messageEl.classList.remove('thinking');
            messageEl.dataset.messageId = messageId;
            const contentEl = messageEl.querySelector('.message-content');

            // Handle Typewriter effect
            const isComplex = Array.isArray(contentParts) && contentParts.length > 1;
            const fullText = Array.isArray(contentParts) ? contentParts.map(p => p.text || '').join('\n') : contentParts;
            const groundingMetadata = botMessageForState.content.groundingMetadata || null;

            // Skip animation if config says 0 or content is complex (to show code blocks immediately)
            if (ChatApp.Config.TYPING_SPEED_MS === 0 || isComplex) {
                 contentEl.innerHTML = await MessageFormatter.format(contentParts, groundingMetadata);
                 this._addMessageInteractions(messageEl, fullText, messageId);
                 this.scrollToBottom();
                 ChatApp.Controller.completeGeneration(botMessageForState);
                 return;
            }
            
            // Simple text typewriter
            contentEl.innerHTML = '';
            let i = 0;
            // Use requestAnimationFrame-like batching for smoother typing
            ChatApp.State.typingInterval = setInterval(async () => {
                if (i < fullText.length) {
                    // Type multiple characters at once to keep it snappy
                    const chunk = fullText.slice(i, i + 3); 
                    contentEl.textContent += chunk;
                    i += 3;
                    if (i % 30 === 0) this.scrollToBottom();
                } else {
                    clearInterval(ChatApp.State.typingInterval);
                    ChatApp.State.typingInterval = null;
                    // Final pass to render Markdown
                    contentEl.innerHTML = await MessageFormatter.format(contentParts, groundingMetadata);
                    this._addMessageInteractions(messageEl, fullText, messageId);
                    this.scrollToBottom();
                    ChatApp.Controller.completeGeneration(botMessageForState);
                }
            }, ChatApp.Config.TYPING_SPEED_MS);
        },
        _addMessageInteractions(messageEl, rawText, messageId) {
            this._addMessageAndCodeActions(messageEl, rawText);
            let pressTimer = null;
            const startDeleteTimer = () => { pressTimer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(50); ChatApp.Controller.deleteMessage(messageId); }, 800); };
            const clearDeleteTimer = () => clearTimeout(pressTimer);
            messageEl.addEventListener('click', e => { if (e.shiftKey) { e.preventDefault(); ChatApp.Controller.deleteMessage(messageId); } });
            messageEl.addEventListener('touchstart', startDeleteTimer, { passive: true });
            messageEl.addEventListener('touchend', clearDeleteTimer);
            messageEl.addEventListener('touchmove', clearDeleteTimer);
        },
        _addMessageAndCodeActions(messageEl, rawText) {
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;
            const { COPY, CHECK, OPEN_NEW_TAB, DOWNLOAD, CHEVRON_DOWN, PLAY, PAUSE } = ChatApp.Config.ICONS;
            const isPreview = contentEl.querySelector('.html-preview-container, .svg-preview-container');
            if (rawText && !isPreview) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-button'; copyBtn.type = 'button'; copyBtn.setAttribute('data-tooltip', 'Copy message text'); copyBtn.innerHTML = COPY;
                copyBtn.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(rawText).then(() => { copyBtn.innerHTML = CHECK; this.showToast('Message copied!'); setTimeout(() => { copyBtn.innerHTML = COPY; }, 2000); }); });
                messageEl.appendChild(copyBtn);
            }
            contentEl.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
                const pre = wrapper.querySelector('pre');
                const actionsContainer = wrapper.querySelector('.code-block-actions');
                if (!pre || !actionsContainer) return;
                const codeEl = pre.querySelector('code');

                if (wrapper.dataset.rawContent) {
                    if (wrapper.dataset.previewable === 'html') {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.className = 'preview-toggle-btn';
                        toggleBtn.type = 'button';
                        toggleBtn.setAttribute('data-state', 'playing');
                        toggleBtn.setAttribute('data-tooltip', 'Pause Preview');
                        toggleBtn.innerHTML = PAUSE;

                        toggleBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const container = wrapper.closest('.html-preview-container');
                            if (!container) return;
                            const iframe = container.querySelector('iframe');
                            if (!iframe) return;
                            const isPaused = toggleBtn.getAttribute('data-state') === 'paused';
                            if (!isPaused) {
                                const currentSrc = iframe.getAttribute('srcdoc');
                                iframe.setAttribute('data-original-src', currentSrc);
                                const pausedHtml = `<!DOCTYPE html><html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:transparent;color:#888;font-family:sans-serif;font-size:14px;">Preview Paused</body></html>`;
                                iframe.setAttribute('srcdoc', pausedHtml);
                                toggleBtn.innerHTML = PLAY;
                                toggleBtn.setAttribute('data-state', 'paused');
                                toggleBtn.setAttribute('data-tooltip', 'Resume Preview');
                            } else {
                                const originalSrc = iframe.getAttribute('data-original-src');
                                if (originalSrc) iframe.setAttribute('srcdoc', originalSrc);
                                toggleBtn.innerHTML = PAUSE;
                                toggleBtn.setAttribute('data-state', 'playing');
                                toggleBtn.setAttribute('data-tooltip', 'Pause Preview');
                            }
                        });
                        actionsContainer.appendChild(toggleBtn);
                    }

                    const openBtn = document.createElement('button');
                    openBtn.className = 'open-new-tab-button';
                    openBtn.type = 'button';
                    openBtn.setAttribute('data-tooltip', 'Open in new tab');
                    openBtn.innerHTML = OPEN_NEW_TAB;
                    openBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const rawContent = decodeURIComponent(wrapper.dataset.rawContent);
                        const previewType = wrapper.dataset.previewable;
                        const newWindow = window.open('about:blank', '_blank');

                        if (!newWindow) {
                            this.showToast('Enable popups to open in a new tab.', 'error');
                            return;
                        }

                        if (previewType === 'html' || previewType === 'svg') {
                            newWindow.document.write(rawContent);
                            newWindow.document.close();
                        } else {
                            newWindow.document.write('<pre>' + ChatApp.Utils.escapeHTML(rawContent) + '</pre>');
                            newWindow.document.close();
                        }
                    });
                    actionsContainer.appendChild(openBtn);
                }

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-code-button'; downloadBtn.type = 'button'; downloadBtn.setAttribute('data-tooltip', 'Download snippet'); downloadBtn.innerHTML = DOWNLOAD;
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rawCode = pre.textContent;
                    let lang = 'txt';
                    if (codeEl && codeEl.className.startsWith('language-')) {
                        const potentialLang = codeEl.className.replace('language-', '').toLowerCase();
                        const extensionMap = { html: 'html', xml: 'xml', svg: 'svg', css: 'css', javascript: 'js', js: 'js', json: 'json', python: 'py', typescript: 'ts', shell: 'sh', bash: 'sh' };
                        lang = extensionMap[potentialLang] || potentialLang.split(' ')[0];
                    }
                    const blob = new Blob([rawCode], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `jbai-snippet.${lang}`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showToast('Snippet downloaded!');
                });
                actionsContainer.appendChild(downloadBtn);

                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button'; copyCodeBtn.type = 'button'; copyCodeBtn.setAttribute('data-tooltip', 'Copy code'); copyCodeBtn.innerHTML = COPY;
                copyCodeBtn.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(pre.textContent).then(() => { copyCodeBtn.innerHTML = CHECK; this.showToast('Code copied!'); setTimeout(() => { copyCodeBtn.innerHTML = COPY; }, 2000); }); });
                actionsContainer.appendChild(copyCodeBtn);

                if (wrapper.classList.contains('is-collapsible')) {
                    const collapseBtn = document.createElement('button');
                    collapseBtn.className = 'collapse-toggle-button'; collapseBtn.type = 'button'; collapseBtn.setAttribute('data-tooltip', 'Show/Hide Code'); collapseBtn.innerHTML = CHEVRON_DOWN;
                    actionsContainer.appendChild(collapseBtn);
                }
            });
        },
        renderSettingsModal() {
            if (document.querySelector('.modal-overlay')) return;
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            const tools = ChatApp.Store.getToolsConfig();
            
            overlay.innerHTML = `
            <div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
                <h2 id="settings-title">Settings</h2>
                <div class="settings-row">
                    <label for="themeSelect">Theme</label>
                    <select id="themeSelect">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="dracula">Dracula</option>
                        <option value="monokai">MonoKai</option>
                    </select>
                </div>
                <hr>
                <h3>AI Capabilities</h3>
                <div class="settings-row">
                    <label for="toggle-google-search">Google Search (Grounding)</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-google-search" ${tools.googleSearch ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <label for="toggle-code-exec">Code Execution (Python)</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-code-exec" ${tools.codeExecution ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <hr>
                <h3>Data Management</h3>
                <div class="settings-group">
                    <button id="upload-data-btn" type="button">Import Data</button>
                    <button id="merge-data-btn" type="button">Merge Data</button>
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

            const updateTools = () => {
                const config = {
                    googleSearch: overlay.querySelector('#toggle-google-search').checked,
                    codeExecution: overlay.querySelector('#toggle-code-exec').checked
                };
                ChatApp.Store.saveToolsConfig(config);
            };
            overlay.querySelector('#toggle-google-search').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-code-exec').addEventListener('change', updateTools);
            
            overlay.querySelector('#upload-data-btn').addEventListener('click', ChatApp.Controller.handleDataUpload);
            overlay.querySelector('#merge-data-btn').addEventListener('click', ChatApp.Controller.handleDataMerge);
            overlay.querySelector('#download-data-btn').addEventListener('click', ChatApp.Controller.downloadAllData);
            overlay.querySelector('#delete-data-btn').addEventListener('click', ChatApp.Controller.deleteAllData);
            overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
        },
        showFullscreenPreview(content, type) {
            const { fullscreenContent, fullscreenOverlay, body } = this.elements;
            fullscreenContent.innerHTML = '';
            switch(type) {
                case 'image': const img = document.createElement('img'); img.src = content; fullscreenContent.appendChild(img); break;
                case 'video': const vid = document.createElement('video'); vid.src = content; vid.controls = true; vid.autoplay = true; fullscreenContent.appendChild(vid); break;
                case 'svg': fullscreenContent.innerHTML = content; break;
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

    Api: {
        async getSystemContext() {
            return `You are J.B.A.I., a helpful and context-aware assistant. You were created by Jeremiah (gokuthug1).
--- Custom Commands ---
/html → Give a random HTML code that’s interesting and fun.
/profile → List all custom commands and explain what each does.
/concept → Ask what concept the user wants to create.
/song → Ask about the user's music taste, then recommend a fitting song.
/word → Give a new word and its definition.
/tip → Share a useful lifehack or tip.
/invention → Generate a fictional, interesting invention idea.
/sp → Correct any text the user sends for spelling and grammar.
/art → Suggest a prompt or idea for a creative art project.
/bdw → Break down a word: pronunciation, definition, and similar-sounding word.

--- General Rules ---
- Use standard Markdown in your responses (including tables).
- To generate an image, use: \`[IMAGE: { "prompt": "...", "height": number, "seed": number }]\`.
- Current Date/Time: ${new Date().toLocaleString()}
- HTML must be self-contained in a single markdown block.`;
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
                if (!response.ok) throw new Error("API error");
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text.trim().replace(/["*]/g, '') || "Chat";
            } catch (error) {
                return "Titled Chat";
            }
        },
        async fetchTextResponse(apiContents, systemInstruction, signal, toolsConfig) {
            const payload = {
                contents: apiContents,
                systemInstruction: systemInstruction,
                toolsConfig: toolsConfig
            };
            try {
                const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: signal 
                });
                if (response.ok) {
                    const data = await response.json();
                    const candidate = data?.candidates?.[0];
                    if (candidate?.content?.parts) {
                        return { parts: candidate.content.parts, groundingMetadata: candidate.groundingMetadata };
                    }
                    throw new Error("Invalid response.");
                }
                throw new Error(`API Error: ${response.status}`);
            } catch (error) {
                if (error.name === 'AbortError') throw new Error("Generation stopped by user.");
                throw error;
            }
        },
        async fetchImageResponse(params) {
            const { prompt, height, seed, model } = params;
            if (!prompt) throw new Error("Prompt required.");
            const queryParams = new URLSearchParams({ model: model || 'flux', enhance: 'true', nologo: 'true' });
            if (height) queryParams.set('height', height);
            if (seed) queryParams.set('seed', seed);
            const fullUrl = `${ChatApp.Config.API_URLS.IMAGE}${encodeURIComponent(prompt)}?${queryParams.toString()}`;
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`Image error: ${response.status}`);
            const imageBlob = await response.blob();
            if (imageBlob.type.startsWith('text/')) throw new Error("Image generation failed.");
            return URL.createObjectURL(imageBlob);
        }
    },
    
    Controller: {
        init() {
            // Apply theme INSTANTLY before other rendering to prevent flash
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            
            ChatApp.Store.loadAllConversations();
            ChatApp.Store.getToolsConfig();
            ChatApp.UI.cacheElements();
            ChatApp.UI.initTooltips();
            ChatApp.UI.renderSidebar();
            ChatApp.UI.toggleSendButtonState();
            
            const { elements } = ChatApp.UI;
            const { Controller } = ChatApp;
            
            elements.sendButton.addEventListener('click', Controller.handleChatSubmission.bind(Controller));
            elements.stopButton.addEventListener('click', Controller.stopGeneration.bind(Controller));
            elements.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Controller.handleChatSubmission(); } });
            elements.chatInput.addEventListener('input', () => {
                elements.chatInput.style.height = 'auto';
                elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`;
                ChatApp.UI.toggleSendButtonState();
            });
            elements.chatInput.addEventListener('paste', Controller.handlePaste.bind(Controller));
            elements.newChatBtn.addEventListener('click', Controller.startNewChat.bind(Controller));
            elements.settingsButton.addEventListener('click', ChatApp.UI.renderSettingsModal.bind(ChatApp.UI));
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', Controller.handleFileSelection.bind(Controller));
            elements.sidebarToggle.addEventListener('click', () => elements.body.classList.toggle('sidebar-open'));
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
            elements.messageArea.addEventListener('click', Controller.handleMessageAreaClick.bind(Controller));
            elements.fullscreenCloseBtn.addEventListener('click', Controller.closeFullscreenPreview.bind(Controller));
            elements.fullscreenOverlay.addEventListener('click', (e) => { if (e.target === elements.fullscreenOverlay) { Controller.closeFullscreenPreview(); } });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.body.classList.contains('modal-open')) { Controller.closeFullscreenPreview(); } });

            elements.body.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); elements.body.classList.add('drag-over'); });
            elements.body.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); if (e.relatedTarget === null || !elements.body.contains(e.relatedTarget)) { elements.body.classList.remove('drag-over'); } });
            elements.body.addEventListener('drop', (e) => {
                e.preventDefault(); e.stopPropagation();
                elements.body.classList.remove('drag-over');
                if (e.dataTransfer?.files?.length > 0) { Controller.addFilesToState(e.dataTransfer.files); }
            });
        },
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },
        stopGeneration() {
            if (ChatApp.State.isGenerating && ChatApp.State.abortController) {
                ChatApp.State.abortController.abort();
                ChatApp.State.setGenerating(false);
                ChatApp.UI.showToast("Generation stopped.");
                const thinkingMsg = document.querySelector('.message.thinking');
                if (thinkingMsg) thinkingMsg.remove();
            }
        },
        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            if ((!userInput && files.length === 0) || ChatApp.State.isGenerating) return;

            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            
            ChatApp.State.abortController = new AbortController();
            ChatApp.State.setGenerating(true);
            this.clearAttachedFiles();

            const fileDataPromises = files.map(file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve({ mimeType: file.type, data: e.target.result.split(',')[1] });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));
            const fileApiData = await Promise.all(fileDataPromises);

            const messageParts = fileApiData.map(p => ({ inlineData: p }));
            if (userInput) { messageParts.push({ text: userInput }); }

            const userMessageAttachments = await Promise.all(files.map(file => new Promise((resolve) => {
                if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve({ name: file.name, type: file.type, data: e.target.result });
                    reader.readAsDataURL(file);
                } else {
                    resolve({ name: file.name, type: file.type, data: null });
                }
            })));

            const userMessage = { id: ChatApp.Utils.generateUUID(), content: { role: "user", parts: messageParts }, attachments: userMessageAttachments };
            ChatApp.State.addMessage(userMessage);
            await ChatApp.UI.renderMessage(userMessage);
            await this._generateText();
        },
        addFilesToState(files) {
            const newFiles = Array.from(files);
            if (ChatApp.State.attachedFiles.length + newFiles.length > 5) {
                ChatApp.UI.showToast('Max 5 files.', 'error');
                return;
            }
            const validFiles = newFiles.filter(file => {
                if (file.size > ChatApp.Config.MAX_FILE_SIZE_BYTES) {
                    ChatApp.UI.showToast(`File "${file.name}" too large.`, 'error');
                    return false;
                }
                return true;
            });
            if (validFiles.length > 0) {
                ChatApp.State.attachedFiles.push(...validFiles);
                ChatApp.UI.renderFilePreviews();
            }
        },
        handleFileSelection(event) {
            this.addFilesToState(event.target.files);
            event.target.value = null;
        },
        handlePaste(event) {
            const files = event.clipboardData?.files;
            if (!files || files.length === 0) return;
            const filesToProcess = Array.from(files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
            if (filesToProcess.length > 0) {
                event.preventDefault();
                this.addFilesToState(filesToProcess);
                ChatApp.UI.showToast(`${filesToProcess.length} file(s) pasted.`);
            }
        },
        removeAttachedFile(index) {
            ChatApp.State.attachedFiles.splice(index, 1);
            ChatApp.UI.renderFilePreviews();
            ChatApp.UI.hideTooltip();
        },
        clearAttachedFiles() {
            ChatApp.State.attachedFiles = [];
            ChatApp.UI.renderFilePreviews();
        },
        async _generateText() {
            const thinkingMessageEl = await ChatApp.UI.renderMessage({ id: null }, true);
            try {
                const systemInstruction = { parts: [{ text: await ChatApp.Api.getSystemContext() }] };
                const apiContents = ChatApp.State.currentConversation.map(msg => ({
                    role: msg.content.role,
                    parts: msg.content.parts
                }));
                const toolsConfig = ChatApp.State.toolsConfig;

                const responseData = await ChatApp.Api.fetchTextResponse(
                    apiContents, 
                    systemInstruction,
                    ChatApp.State.abortController.signal,
                    toolsConfig
                );
                
                const responseParts = responseData.parts;
                const groundingMetadata = responseData.groundingMetadata;
                
                let processedParts = [...responseParts];
                for (let i = 0; i < processedParts.length; i++) {
                    if (processedParts[i].text) {
                        processedParts[i].text = await this.processResponseForImages(processedParts[i].text);
                    }
                }

                const messageId = ChatApp.Utils.generateUUID();
                const contentObj = { 
                    role: "model", 
                    parts: processedParts,
                    ...(groundingMetadata && { groundingMetadata }) 
                };

                const botMessageForState = { id: messageId, content: contentObj };
                await ChatApp.UI.finalizeBotMessage(thinkingMessageEl, processedParts, messageId, botMessageForState);
            } catch (error) {
                thinkingMessageEl.remove();
                if (error.message !== "Generation stopped by user.") {
                    console.error("Gen failed:", error);
                    const msg = error.message.includes("500") ? "Server error." : `Error: ${error.message}`;
                    const errorBotMessage = { id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: msg }] } };
                    await ChatApp.UI.renderMessage(errorBotMessage);
                    ChatApp.UI.showToast(msg, 'error');
                }
                ChatApp.State.setGenerating(false);
            }
        },
        async processResponseForImages(rawText) {
            const imageRegex = /\[IMAGE: (\{[\s\S]*?\})\]/g;
            const matches = Array.from(rawText.matchAll(imageRegex));
            if (matches.length === 0) return rawText;
        
            const replacementPromises = matches.map(async (match) => {
                const [originalTag, jsonString] = match;
                try {
                    const params = JSON.parse(jsonString);
                    const imageUrl = await ChatApp.Api.fetchImageResponse(params);
                    return { original: originalTag, replacement: `[IMAGE: ${ChatApp.Utils.escapeHTML(params.prompt)}](${imageUrl})` };
                } catch (error) {
                    return { original: originalTag, replacement: `[Error: ${error.message}]` };
                }
            });
            const replacements = await Promise.all(replacementPromises);
            let processedText = rawText;
            replacements.forEach(({ original, replacement }) => { processedText = processedText.replace(original, replacement); });
            return processedText;
        },
        completeGeneration(botMessage) {
            ChatApp.State.addMessage(botMessage);
            this.saveCurrentChat();
            ChatApp.State.setGenerating(false);
        },
        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;
            if (ChatApp.State.currentChatId) {
                const chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
                if (chat) { chat.history = ChatApp.State.currentConversation; }
            } else {
                 const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                 if (userMessages > 0) {
                    const newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation);
                    ChatApp.State.currentChatId = Date.now();
                    ChatApp.State.allConversations.push({ id: ChatApp.State.currentChatId, title: newTitle, history: ChatApp.State.currentConversation });
                }
            }
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        loadChat(chatId) {
            if (ChatApp.State.currentChatId === chatId) return;
            const chat = ChatApp.State.allConversations.find(c => c.id === chatId);
            if (!chat) { ChatApp.UI.showToast("Load failed.", "error"); return; }
            this.startNewChat();
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.setCurrentConversation(chat.history);
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
            (async () => {
                for (const msg of ChatApp.State.currentConversation) {
                    let parts = msg.content.parts;
                    if (!parts) parts = [{text: msg.text || ''}]; // Legacy compat
                    await ChatApp.UI.renderMessage({ ...msg, content: { ...msg.content, parts: parts } });
                }
                setTimeout(() => ChatApp.UI.forceScrollToBottom(), 0);
            })();
        },
        async deleteMessage(messageId) {
            if (!confirm('Delete message?')) return;
            ChatApp.State.removeMessage(messageId);
            const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
            if (messageEl) { messageEl.classList.add('fade-out'); setTimeout(() => messageEl.remove(), 400); }
            this.saveCurrentChat();
        },
        deleteConversation(chatId) {
            if (!confirm('Delete chat?')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => c.id !== chatId);
            ChatApp.Store.saveAllConversations();
            if (ChatApp.State.currentChatId === chatId) { this.startNewChat(); } else { ChatApp.UI.renderSidebar(); }
        },
        downloadAllData() {
            const dataStr = JSON.stringify(ChatApp.State.allConversations, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'jbai_conversations_backup.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        handleDataUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file'; fileInput.accept = '.json,application/json';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (!Array.isArray(importedData)) throw new Error("Invalid format.");
                        if (confirm('Replace all conversations?')) {
                            ChatApp.State.allConversations = importedData;
                            ChatApp.Store.saveAllConversations();
                            location.reload();
                        }
                    } catch (error) { ChatApp.UI.showToast(`Error: ${error.message}`, 'error'); }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        handleDataMerge() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file'; fileInput.accept = '.json,application/json';
            fileInput.onchange = (event) => {
                const file = event.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (!Array.isArray(importedData)) throw new Error("Invalid format.");
                        if (confirm('Merge conversations?')) {
                            const conversationMap = new Map(ChatApp.State.allConversations.map(c => [c.id, c]));
                            importedData.forEach(chat => { if (!conversationMap.has(chat.id)) conversationMap.set(chat.id, chat); });
                            ChatApp.State.allConversations = Array.from(conversationMap.values());
                            ChatApp.Store.saveAllConversations();
                            location.reload();
                        }
                    } catch (error) { ChatApp.UI.showToast(`Error: ${error.message}`, 'error'); }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        deleteAllData() {
            if (confirm('DELETE ALL DATA? This cannot be undone.')) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.THEME);
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.TOOLS);
                ChatApp.State.allConversations = [];
                location.reload();
            }
        },
        handleMessageAreaClick(event) {
            const toggleBtn = event.target.closest('.collapse-toggle-button');
            if (toggleBtn) {
                const wrapper = toggleBtn.closest('.code-block-wrapper');
                if (wrapper) wrapper.classList.toggle('is-collapsed');
                return;
            }

            const mediaTarget = event.target.closest('.generated-image, .attachment-media, .svg-render-box img');
            const htmlBox = event.target.closest('.html-render-box');
            
            if (mediaTarget) { 
                event.preventDefault(); 
                if (mediaTarget.tagName === 'IMG') ChatApp.UI.showFullscreenPreview(mediaTarget.src, 'image'); 
                else if (mediaTarget.tagName === 'VIDEO') ChatApp.UI.showFullscreenPreview(mediaTarget.src, 'video'); 
            } 
            else if (htmlBox) {
                const iframe = htmlBox.querySelector('iframe'); 
                if (iframe) ChatApp.UI.showFullscreenPreview(iframe.srcdoc, 'html'); 
            }
            else {
                const svgWrapper = event.target.closest('.svg-preview-container');
                if (svgWrapper) {
                    const rawContent = svgWrapper.querySelector('.code-block-wrapper')?.dataset.rawContent;
                    if (rawContent) ChatApp.UI.showFullscreenPreview(decodeURIComponent(rawContent), 'svg');
                }
            }
        },
        closeFullscreenPreview() {
            const { fullscreenOverlay, fullscreenContent, body } = ChatApp.UI.elements;
            fullscreenOverlay.style.display = 'none';
            fullscreenContent.innerHTML = '';
            body.classList.remove('modal-open');
        },
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});
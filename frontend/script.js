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
            IMAGE: 'https://image.pollinations.ai/prompt/'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations',
        },
        DEFAULT_THEME: 'light',
        TYPING_SPEED_MS: 0, // Milliseconds per character
        MAX_FILE_SIZE_BYTES: 4 * 1024 * 1024, // 4MB limit to prevent 413 Payload Too Large errors
        ICONS: {
            COPY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
            CHECK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`,
            OPEN_NEW_TAB: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
            DOWNLOAD: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
        }
    },

    // --- State Management Module ---
    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        isGenerating: false,
        typingInterval: null,
        attachedFiles: [],
        setCurrentConversation(history) {
            this.currentConversation = history.map(msg => {
                if (!msg) return null;
                if (msg.id && msg.content && Array.isArray(msg.content.parts)) return msg;
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
        addMessage(message) { this.currentConversation.push(message); },
        removeMessage(messageId) { this.currentConversation = this.currentConversation.filter(msg => msg.id !== messageId); },
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
        generateUUID() { return crypto.randomUUID(); }
    },

    // --- Local Storage Module ---
    Store: {
        saveAllConversations() { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(ChatApp.State.allConversations)); },
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                ChatApp.State.allConversations = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to parse conversations from localStorage, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme(themeName) { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName); },
        getTheme() { return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME; },
    },

    // --- UI Module (DOM Interaction & Rendering) ---
    UI: {
        elements: {},
        cacheElements() {
            this.elements = {
                body: document.body,
                toastContainer: document.getElementById('toast-container'), // New
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
        showToast(message, type = 'info') { // New Method
            const toast = document.createElement('div');
            toast.className = `toast-message ${type}`;
            toast.textContent = message;
            this.elements.toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10); // Fade in
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, 3000); // Fade out after 3s
        },
        scrollToBottom() { this.elements.messageArea.scrollTop = this.elements.messageArea.scrollHeight; },
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
            const sortedConversations = [...ChatApp.State.allConversations].sort((a, b) => b.id - a.id);
            sortedConversations.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                if (chat.id === ChatApp.State.currentChatId) { item.classList.add('active'); }
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
        renderMessage(message, isTyping = false) {
            const messageEl = document.createElement('div');
            messageEl.dataset.messageId = message.id;
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            let rawText = '';
            if (isTyping) {
                messageEl.className = 'message bot thinking';
                contentEl.innerHTML = `<span></span><span></span><span></span>`;
            } else {
                const { content, attachments } = message;
                const sender = content.role === 'model' ? 'bot' : 'user';
                const textPart = content.parts.find(p => p.text);
                const textContent = textPart ? textPart.text : '';
                rawText = textContent;
                messageEl.className = `message ${sender}`;
                contentEl.innerHTML = this._formatMessageContent(textContent);
                if (attachments && attachments.length > 0) {
                    const attachmentsContainer = this._createAttachmentsContainer(attachments);
                    contentEl.prepend(attachmentsContainer);
                }
            }
            messageEl.appendChild(contentEl);
            this.elements.messageArea.appendChild(messageEl);
            if (!isTyping) { this._addMessageInteractions(messageEl, rawText, message.id); }
            this.scrollToBottom();
            return messageEl;
        },
        _createAttachmentsContainer(attachments) {
            const container = document.createElement('div');
            container.className = 'message-attachments';
            attachments.forEach(file => {
                const item = document.createElement('div');
                item.className = 'attachment-item';
                let contentHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-size:12px; padding: 4px; text-align:center; word-break:break-all;">${ChatApp.Utils.escapeHTML(file.name)}</div>`;
                
                if (file.data) { // Check if dataURL is present
                    if (file.type.startsWith('image/')) {
                        contentHTML = `<img src="${file.data}" alt="${ChatApp.Utils.escapeHTML(file.name)}" class="attachment-media">`;
                    } else if (file.type.startsWith('video/')) {
                        contentHTML = `<video src="${file.data}" class="attachment-media" controls title="${ChatApp.Utils.escapeHTML(file.name)}"></video>`;
                    }
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
                let previewContent = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; font-size:12px; padding: 4px; text-align:center; word-break:break-all;">${ChatApp.Utils.escapeHTML(file.name)}</div>`;
                
                if (file.type.startsWith('image/')) {
                    previewContent = `<img src="${objectURL}" alt="Preview of ${ChatApp.Utils.escapeHTML(file.name)}">`;
                } else if (file.type.startsWith('video/')) {
                    previewContent = `<video src="${objectURL}" autoplay muted loop playsinline title="Preview of ${ChatApp.Utils.escapeHTML(file.name)}"></video>`;
                }

                previewItem.innerHTML = `${previewContent}<button class="remove-preview-btn" title="Remove file" type="button">&times;</button>`;
                previewItem.querySelector('.remove-preview-btn').addEventListener('click', () => { ChatApp.Controller.removeAttachedFile(index); });
                this.elements.filePreviewsContainer.appendChild(previewItem);
            });
            this.toggleSendButtonState();
        },
        finalizeBotMessage(messageEl, fullText, messageId, botMessageForState) {
            if (ChatApp.State.typingInterval) {
                clearInterval(ChatApp.State.typingInterval);
                ChatApp.State.typingInterval = null;
            }
            if (ChatApp.Config.TYPING_SPEED_MS === 0) {
                 messageEl.classList.remove('thinking');
                 messageEl.dataset.messageId = messageId;
                 const contentEl = messageEl.querySelector('.message-content');
                 contentEl.innerHTML = this._formatMessageContent(fullText);
                 this._addMessageInteractions(messageEl, fullText, messageId);
                 this.scrollToBottom();
                 ChatApp.Controller.completeGeneration(botMessageForState);
                 return;
            }
            messageEl.classList.remove('thinking');
            messageEl.dataset.messageId = messageId;
            const contentEl = messageEl.querySelector('.message-content');
            contentEl.innerHTML = '';
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
        _formatMessageContent(text) {
            if (!text) return '';
            const trimmedText = text.trim();
            const htmlBlockRegex = new RegExp(/^```html\n([\s\S]*?)\n```$/);
            const htmlMatch = trimmedText.match(htmlBlockRegex);
            if (htmlMatch) {
                const rawHtmlCode = htmlMatch[1].trim();
                const safeHtmlForSrcdoc = rawHtmlCode.replace(/"/g, '&quot;');
                const escapedHtmlCode = ChatApp.Utils.escapeHTML(rawHtmlCode);
                return `
                    <div class="html-preview-container">
                        <h4>Live Preview</h4>
                        <div class="html-render-box"><iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts" loading="lazy" title="HTML Preview"></iframe></div>
                        <h4>HTML Code</h4>
                        <div class="code-block-wrapper" data-previewable="html" data-raw-content="${encodeURIComponent(rawHtmlCode)}">
                            <div class="code-block-header"><span>&lt;&gt; Code</span><div class="code-block-actions"></div></div>
                            <pre data-raw-code="${escapedHtmlCode}"><code class="language-html">${escapedHtmlCode}</code></pre>
                        </div>
                    </div>`;
            }
            if (trimmedText.startsWith('<svg') && trimmedText.endsWith('</svg>')) {
                const rawSvgCode = trimmedText;
                const escapedSvgCode = ChatApp.Utils.escapeHTML(rawSvgCode);
                return `
                    <div class="svg-preview-container">
                        <h4>SVG Preview</h4>
                        <div class="svg-render-box">${rawSvgCode}</div>
                        <h4>SVG Code</h4>
                        <div class="code-block-wrapper" data-previewable="svg" data-raw-content="${encodeURIComponent(rawSvgCode)}">
                           <div class="code-block-header"><span>&lt;&gt; Code</span><div class="code-block-actions"></div></div>
                           <pre data-raw-code="${escapedSvgCode}"><code class="language-xml">${escapedSvgCode}</code></pre>
                        </div>
                    </div>`;
            }
            let processedText = text;
            const codeBlocks = [];
            processedText = processedText.replace(new RegExp('```(\\w+)?\\n([\\s\\S]*?)```', 'g'), (match, lang, code) => {
                const rawCode = code.trim();
                const id = codeBlocks.length;
                codeBlocks.push({ lang: lang || 'plaintext', rawCode });
                return `__CODE_BLOCK_${id}__`;
            });

            let html = ChatApp.Utils.escapeHTML(processedText);
            
            html = html.replace(new RegExp('__CODE_BLOCK_(\\d+)__', 'g'), (match, id) => {
                const { lang, rawCode } = codeBlocks[id];
                const escapedRawCode = ChatApp.Utils.escapeHTML(rawCode);
                return `
                    <div class="code-block-wrapper">
                        <div class="code-block-header"><span>&lt;&gt; Code</span><div class="code-block-actions"></div></div>
                        <pre data-raw-code="${escapedRawCode}"><code class="language-${lang}">${escapedRawCode}</code></pre>
                    </div>`;
            });
            html = html.replace(new RegExp('\\[IMAGE: (.*?)\\]\\((.*?)\\)', 'g'), (match, alt, url) => {
                const safeFilename = (alt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
                return `<div class="generated-image-wrapper"><p class="image-prompt-text"><em>Image Prompt: ${ChatApp.Utils.escapeHTML(alt)}</em></p><div class="image-container"><img src="${url}" alt="${ChatApp.Utils.escapeHTML(alt)}" class="generated-image"><a href="${url}" download="${safeFilename}.png" class="download-image-button" title="Download Image"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a></div></div>`;
            });
            html = html.replace(new RegExp('^### (.*$)', 'gim'), '<h3>$1</h3>').replace(new RegExp('^## (.*$)', 'gim'), '<h2>$1</h2>').replace(new RegExp('^# (.*$)', 'gim'), '<h1>$1</h1>');
            html = html.replace(new RegExp('^(> (.*)\n?)+', 'gm'), (match) => `<blockquote><p>${match.replace(new RegExp('^> ', 'gm'), '').trim().replace(/\n/g, '</p><p>')}</p></blockquote>`);
            html = html.replace(new RegExp('^((\\s*[-*] .*\\n?)+)', 'gm'), m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
            html = html.replace(new RegExp('^((\\s*\\d+\\. .*\\n?)+)', 'gm'), m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
            html = html.replace(new RegExp('\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)', 'g'), '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            html = html.replace(new RegExp('`([^`]+)`', 'g'), '<code>$1</code>');
            html = html.replace(new RegExp('\\*\\*(.*?)\\*\\*', 'g'), '<strong>$1</strong>').replace(new RegExp('__(.*?)__', 'g'), '<strong>$1</strong>');
            html = html.replace(new RegExp('\\*(.*?)\\*', 'g'), '<em>$1</em>').replace(new RegExp('_(.*?)_', 'g'), '<em>$1</em>');
            html = html.replace(new RegExp('~~(.*?)~~', 'g'), '<s>$1</s>');
            return html.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed === '') return '';
                const isBlockElement = /^(<\/?(p|h[1-6]|ul|ol|li|pre|blockquote|div)|\[IMAGE:)/.test(trimmed);
                return isBlockElement ? line : `<p>${line}</p>`;
            }).join('');
        },
        _addMessageAndCodeActions(messageEl, rawText) { // Updated to use toasts
            const contentEl = messageEl.querySelector('.message-content');
            if (!contentEl) return;
            const { COPY, CHECK, OPEN_NEW_TAB, DOWNLOAD } = ChatApp.Config.ICONS;
            const isPreview = contentEl.querySelector('.html-preview-container, .svg-preview-container');
            if (rawText && !isPreview) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-button'; copyBtn.title = 'Copy message text'; copyBtn.innerHTML = COPY;
                copyBtn.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(rawText).then(() => { copyBtn.innerHTML = CHECK; this.showToast('Message copied!'); setTimeout(() => { copyBtn.innerHTML = COPY; }, 2000); }); });
                messageEl.appendChild(copyBtn);
            }
            contentEl.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
                const pre = wrapper.querySelector('pre');
                const actionsContainer = wrapper.querySelector('.code-block-actions');
                if (!pre || !actionsContainer || !pre.dataset.rawCode) return;
                const codeEl = pre.querySelector('code');

                if (wrapper.dataset.previewable) {
                    const openBtn = document.createElement('button');
                    openBtn.className = 'open-new-tab-button'; openBtn.title = 'Open in new tab'; openBtn.innerHTML = OPEN_NEW_TAB;
                    openBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const rawContent = decodeURIComponent(wrapper.dataset.rawContent);
                        const newWindow = window.open('about:blank', '_blank');
                        if (newWindow) {
                            newWindow.document.write(rawContent);
                            newWindow.document.close();
                        } else {
                           this.showToast('Enable popups to open in a new tab.', 'error');
                        }
                    });
                    actionsContainer.appendChild(openBtn);
                }

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-code-button';
                downloadBtn.title = 'Download snippet';
                downloadBtn.innerHTML = DOWNLOAD;
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rawCode = pre.textContent;
                    let lang = 'txt';
                    if (codeEl && codeEl.className.startsWith('language-')) {
                        const potentialLang = codeEl.className.replace('language-', '').toLowerCase();
                        const extensionMap = {
                            html: 'html', xml: 'xml', svg: 'svg', css: 'css',
                            javascript: 'js', js: 'js', json: 'json', python: 'py',
                            typescript: 'ts', shell: 'sh', bash: 'sh'
                        };
                        lang = extensionMap[potentialLang] || potentialLang.split(' ')[0];
                    }
                    const blob = new Blob([rawCode], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `jbai-snippet.${lang}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showToast('Snippet downloaded!');
                });
                actionsContainer.appendChild(downloadBtn);

                const copyCodeBtn = document.createElement('button');
                copyCodeBtn.className = 'copy-code-button';
                copyCodeBtn.title = 'Copy code';
                copyCodeBtn.innerHTML = COPY;
                copyCodeBtn.addEventListener('click', e => { e.stopPropagation(); navigator.clipboard.writeText(pre.textContent).then(() => { copyCodeBtn.innerHTML = CHECK; this.showToast('Code copied!'); setTimeout(() => { copyCodeBtn.innerHTML = COPY; }, 2000); }); });
                actionsContainer.appendChild(copyCodeBtn);
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
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="dracula">Dracula</option>
                        <option value="monokai  ">MonoKai</option>
                    </select>
                </div>
                <hr>
                <div class="data-actions">
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
                case 'html': const iframe = document.createElement('iframe'); iframe.srcdoc = content; iframe.sandbox = "allow-scripts"; fullscreenContent.appendChild(iframe); break;
            }
            fullscreenOverlay.style.display = 'flex';
            body.classList.add('modal-open');
        },
    },

    // --- API Module ---
    Api: {
        async getSystemContext() {
            const systemPrompt = `You are J.B.A.I., a helpful and context-aware assistant. You were created by Jeremiah (gokuthug1).

--- Custom Commands ---
You have custom commands that users can use, and you must follow them.

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
- Use standard Markdown in your responses.
- To generate an image, you MUST use this exact format in your response: \`[IMAGE: { "prompt": "your detailed prompt", "height": number, "seed": number }]\`.
  - When writing the "prompt" value, be very descriptive and literal. Place the most important subjects, features, and actions (e.g., "a bear shooting lasers from its eyes") at the beginning of the prompt to ensure they are accurately represented.
  - You have control over the parameters: \`height\` (e.g., 768, 1024), and \`seed\` (any number for reproducibility).
  - Do NOT invent new parameters. Do NOT include a URL. The system will handle the actual image generation.
- Current Date/Time: ${new Date().toLocaleString()}
- Format HTML code as one complete, well-formatted, and readable file (HTML, CSS, and JS combined). ALWAYS enclose the full HTML code within a single \`\`\`html markdown block. DO NOT write any text outside of the markdown block.
- Do not ask what a command means. Follow it exactly as written.
- Avoid fluff or overexplaining—stay smart, fast, and clear.`;
            return systemPrompt;
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
            const maxRetries = 3;
            let lastError = null;
        
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await fetch(ChatApp.Config.API_URLS.TEXT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: apiContents, systemInstruction })
                    });
        
                    if (response.ok) {
                        const data = await response.json();
                        const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (!botResponseText) throw new Error("Received an invalid or empty response from the API.");
                        return botResponseText;
                    }
        
                    if (response.status >= 400 && response.status < 500) {
                        const errorText = response.status === 413 ? "Payload Too Large" : response.statusText;
                        throw new Error(`API Error: ${response.status} ${errorText}`);
                    }
                    
                    lastError = new Error(`API Error: ${response.status} ${response.statusText}`);
                    console.warn(`Attempt ${attempt + 1} failed: ${lastError.message}. Retrying...`);
                } catch (error) {
                    lastError = error;
                    console.warn(`Attempt ${attempt + 1} failed with a network error: ${error.message}. Retrying...`);
                }
                if (attempt < maxRetries - 1) await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
            }
            throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
        },
        async fetchImageResponse(params) {
            const { prompt, height, seed, model } = params;
            if (!prompt) throw new Error("A prompt is required for image generation.");

            const encodedPrompt = encodeURIComponent(prompt);
            const baseUrl = `${ChatApp.Config.API_URLS.IMAGE}${encodedPrompt}`;

            const queryParams = new URLSearchParams({
                model: model || 'flux',
            });
            
            queryParams.set('enhance', 'true');
            queryParams.set('nologo', 'true');

            if (height) queryParams.set('height', height);
            if (seed) queryParams.set('seed', seed);
            
            const fullUrl = `${baseUrl}?${queryParams.toString()}`;

            const response = await fetch(fullUrl);
            if (!response.ok) { throw new Error(`Server error: ${response.status} ${response.statusText}`); }
            const imageBlob = await response.blob();
            if (imageBlob.type.startsWith('text/')) { throw new Error("Image generation failed. The API may be down or the prompt was invalid."); }
            const imageUrl = URL.createObjectURL(imageBlob);
            if (!imageUrl) throw new Error("Could not create image URL from the API response.");
            return imageUrl;
        }
    },
    
    // --- Controller Module (Application Logic) ---
    Controller: {
        init() {
            ChatApp.UI.cacheElements();
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            ChatApp.Store.loadAllConversations();
            ChatApp.UI.renderSidebar();
            ChatApp.UI.toggleSendButtonState();
            const { elements } = ChatApp.UI;
            const { Controller } = ChatApp;
            elements.sendButton.addEventListener('click', Controller.handleChatSubmission.bind(Controller));
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
            elements.messageArea.addEventListener('click', Controller.handlePreviewClick.bind(Controller));
            elements.fullscreenCloseBtn.addEventListener('click', Controller.closeFullscreenPreview.bind(Controller));
            elements.fullscreenOverlay.addEventListener('click', (e) => { if (e.target === elements.fullscreenOverlay) { Controller.closeFullscreenPreview(); } });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.body.classList.contains('modal-open')) { Controller.closeFullscreenPreview(); } });
        },
        startNewChat() {
            ChatApp.State.resetCurrentChat();
            ChatApp.UI.clearChatArea();
            ChatApp.UI.renderSidebar();
        },
        async handleChatSubmission() {
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            if ((!userInput && files.length === 0) || ChatApp.State.isGenerating) return;

            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            ChatApp.State.setGenerating(true);
            this.clearAttachedFiles();

            const fileDataPromises = files.map(file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const base64Data = e.target.result.split(',')[1];
                    const mimeType = file.type;
                     resolve({ mimeType, data: base64Data });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));

            const fileApiData = await Promise.all(fileDataPromises);

            const messageParts = fileApiData.map(p => ({ inlineData: p }));
            if (userInput) { messageParts.push({ text: userInput }); }

            const userMessageAttachments = await Promise.all(files.map(async (file) => {
                return new Promise((resolve) => {
                    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve({ name: file.name, type: file.type, data: e.target.result });
                        reader.readAsDataURL(file);
                    } else {
                         resolve({ name: file.name, type: file.type, data: null });
                    }
                });
            }));

            const userMessage = { id: ChatApp.Utils.generateUUID(), content: { role: "user", parts: messageParts }, attachments: userMessageAttachments };
            ChatApp.State.addMessage(userMessage);
            ChatApp.UI.renderMessage(userMessage);

            await this._generateText();
        },
        addFilesToState(files) {
            const newFiles = Array.from(files);
            if (ChatApp.State.attachedFiles.length + newFiles.length > 5) {
                ChatApp.UI.showToast('You can attach a maximum of 5 files.', 'error');
                return;
            }
        
            const validFiles = newFiles.filter(file => {
                if (file.size > ChatApp.Config.MAX_FILE_SIZE_BYTES) {
                    ChatApp.UI.showToast(`File "${file.name}" exceeds the 4MB limit.`, 'error');
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
            event.target.value = null; // Reset input to allow selecting the same file again
        },
        handlePaste(event) {
            const files = event.clipboardData?.files;
            if (!files || files.length === 0) return;
        
            // Filter for only files we can handle (images/videos)
            const filesToProcess = Array.from(files).filter(file => 
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );
        
            if (filesToProcess.length > 0) {
                event.preventDefault(); // Prevent default paste action (e.g., pasting file path as text)
                this.addFilesToState(filesToProcess);
                ChatApp.UI.showToast(`${filesToProcess.length} file(s) pasted.`);
            }
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
                
                const rawBotResponse = await ChatApp.Api.fetchTextResponse(apiContents, systemInstruction);
                const processedForUI = await this.processResponseForImages(rawBotResponse);
                const messageId = ChatApp.Utils.generateUUID();
                const botMessageForState = { id: messageId, content: { role: "model", parts: [{ text: rawBotResponse }] } };

                ChatApp.UI.finalizeBotMessage(thinkingMessageEl, processedForUI, messageId, botMessageForState);
            } catch (error) {
                console.error("Text generation failed:", error);
                thinkingMessageEl.remove();
                const errorMessage = `Sorry, an error occurred: ${error.message}`;
                const errorBotMessage = { id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: errorMessage }] } };
                ChatApp.UI.renderMessage(errorBotMessage);
                this.completeGeneration(errorBotMessage);
                ChatApp.UI.showToast(error.message, 'error');
                ChatApp.State.setGenerating(false);
            }
        },
        async processResponseForImages(rawText) {
            const imageRegex = new RegExp('\\[IMAGE: (\\{[\\s\\S]*?\\})\\]', 'g');
            const matches = Array.from(rawText.matchAll(imageRegex));
        
            if (matches.length === 0) {
                return rawText;
            }
        
            const replacementPromises = matches.map(async (match) => {
                const originalTag = match[0];
                const jsonString = match[1];
                try {
                    const params = JSON.parse(jsonString);
                    if (!params.prompt) throw new Error("Prompt is missing");
        
                    const imageUrl = await ChatApp.Api.fetchImageResponse(params);
                    const finalMarkdown = `[IMAGE: ${ChatApp.Utils.escapeHTML(params.prompt)}](${imageUrl})`;
                    
                    return { original: originalTag, replacement: finalMarkdown };
                } catch (error) {
                    console.error("Failed to process image tag:", originalTag, error);
                    const errorMessage = `[Error generating image. Reason: ${error.message}]`;
                    return { original: originalTag, replacement: errorMessage };
                }
            });
        
            const replacements = await Promise.all(replacementPromises);
        
            let processedText = rawText;
            replacements.forEach(({ original, replacement }) => {
                processedText = processedText.replace(original, replacement);
            });
        
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
                 const modelMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'model').length;
                 if (userMessages > 0 && modelMessages > 0) {
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
            if (!chat || !Array.isArray(chat.history)) { console.error("Chat not found or is corrupted:", chatId); ChatApp.UI.showToast("Could not load the selected chat.", "error"); return; }
            this.startNewChat();
            ChatApp.State.currentChatId = chatId;
            ChatApp.State.setCurrentConversation(chat.history);
            ChatApp.UI.clearChatArea();
            
            ChatApp.State.currentConversation.forEach(async msg => {
                if (msg.content.role === 'model') {
                    const rawText = msg.content.parts[0].text;
                    const processedText = await this.processResponseForImages(rawText);
                    const processedMsg = { ...msg, content: { ...msg.content, parts: [{ text: processedText }] } };
                    ChatApp.UI.renderMessage(processedMsg);
                } else {
                    ChatApp.UI.renderMessage(msg);
                }
            });
            setTimeout(() => ChatApp.UI.scrollToBottom(), 0);
            ChatApp.UI.renderSidebar();
        },
        deleteMessage(messageId) {
            if (!confirm('Are you sure you want to delete this message?')) return;
            ChatApp.State.removeMessage(messageId);
            const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
            if (messageEl) { messageEl.classList.add('fade-out'); setTimeout(() => messageEl.remove(), 400); }
            this.saveCurrentChat();
        },
        deleteConversation(chatId) {
            if (!confirm('Are you sure you want to delete this chat permanently?')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => c.id !== chatId);
            ChatApp.Store.saveAllConversations();
            if (ChatApp.State.currentChatId === chatId) { this.startNewChat(); } else { ChatApp.UI.renderSidebar(); }
            ChatApp.UI.showToast('Chat deleted.');
        },
        downloadAllData() {
            const dataStr = JSON.stringify(ChatApp.State.allConversations, null, 2);
            if (!dataStr || dataStr === '[]') { ChatApp.UI.showToast('No conversation data to download.', 'error'); return; }
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'jbai_conversations_backup.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            ChatApp.UI.showToast('Data export started.');
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
                        if (!Array.isArray(importedData) || !importedData.every(c => c.id && c.title && Array.isArray(c.history))) { throw new Error("Invalid data format."); }
                        if (confirm('This will replace all current conversations. Are you sure?')) {
                            ChatApp.State.allConversations = importedData;
                            ChatApp.Store.saveAllConversations();
                            ChatApp.UI.showToast('Data imported. Reloading...');
                            setTimeout(() => location.reload(), 1500);
                        }
                    } catch (error) { ChatApp.UI.showToast(`Import error: ${error.message}`, 'error'); }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        handleDataMerge() {
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
                        if (confirm('This will merge conversations from the selected file. If any chats have the same ID as existing chats, the existing ones will be kept. Continue?')) {
                            const currentConversations = ChatApp.State.allConversations;
                            const conversationMap = new Map();
        
                            importedData.forEach(chat => conversationMap.set(chat.id, chat));
                            currentConversations.forEach(chat => conversationMap.set(chat.id, chat));
                            
                            const mergedConversations = Array.from(conversationMap.values());
        
                            ChatApp.State.allConversations = mergedConversations;
                            ChatApp.Store.saveAllConversations();
                            ChatApp.UI.showToast('Data merged. Reloading...');
                            setTimeout(() => location.reload(), 1500);
                        }
                    } catch (error) {
                        ChatApp.UI.showToast(`Merge error: ${error.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        deleteAllData() {
            if (confirm('DANGER: This will delete ALL conversations and settings permanently. Are you sure?')) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.THEME);
                ChatApp.State.allConversations = [];
                ChatApp.UI.showToast('All data deleted. Reloading...', 'error');
                setTimeout(() => location.reload(), 1500);
            }
        },
        handlePreviewClick(event) {
            const image = event.target.closest('.generated-image, .attachment-media');
            const svgBox = event.target.closest('.svg-render-box');
            const htmlBox = event.target.closest('.html-render-box');
            if (image) { 
                event.preventDefault(); 
                const mediaElement = event.target;
                if (mediaElement.tagName === 'IMG') {
                    ChatApp.UI.showFullscreenPreview(mediaElement.src, 'image'); 
                } else if (mediaElement.tagName === 'VIDEO') {
                    ChatApp.UI.showFullscreenPreview(mediaElement.src, 'video'); 
                }
            } 
            else if (svgBox) { const svgElement = svgBox.querySelector('svg'); if (svgElement) { ChatApp.UI.showFullscreenPreview(svgElement.outerHTML, 'svg'); } } 
            else if (htmlBox) { const iframe = htmlBox.querySelector('iframe'); if (iframe) { ChatApp.UI.showFullscreenPreview(iframe.srcdoc, 'html'); } }
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

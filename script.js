import { MessageFormatter } from './formatter.js';
import { SyntaxHighlighter } from './syntaxHighlighter.js';

const ChatApp = {
    Config: {
        PROVIDERS: {
            GOOGLE: 'google',
            OPENAI: 'openai',
            ANTHROPIC: 'anthropic'
        },
        API_ENDPOINTS: {
            GOOGLE_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
            OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
            ANTHROPIC_MESSAGES: 'https://api.anthropic.com/v1/messages'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations',
            TOOLS: 'jbai_tools_config',
            PROVIDER_SETTINGS: 'jbai_provider_settings'
        },
        DEFAULT_THEME: 'light',
        DEFAULT_PROVIDER_SETTINGS: {
            provider: 'google',
            models: {
                google: 'gemini-2.5-flash',
                openai: 'gpt-4.1-mini',
                anthropic: 'claude-3-5-haiku-latest'
            },
            apiKeys: {
                google: '',
                openai: '',
                anthropic: ''
            }
        },
        DEFAULT_TOOLS: {
            googleSearch: false,
            codeExecution: false,
            agentMode: false
        },
        TYPING_SPEED_MS: 15,
        MAX_FILE_SIZE_BYTES: 4 * 1024 * 1024,
        MAX_FILES: 5,
        MAX_GENERATED_FILES: 50,
        MAX_GENERATED_FILE_BYTES: 1024 * 1024,
        MAX_GENERATED_TOTAL_BYTES: 10 * 1024 * 1024,
        MAX_GENERATED_FILENAME_LENGTH: 120,
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
            PAUSE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
            AGENT_ACTIVITY: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path><path d="M12 6v6l4 2"></path></svg>`
        }
    },

    State: {
        currentConversation: [],
        allConversations: [],
        currentChatId: null,
        isGenerating: false,
        typingInterval: null,
        attachedFiles: [],
        previewObjectUrls: [],
        generatedDownloadUrls: [],
        fileRenderCache: new Map(),
        abortController: null,
        toolsConfig: {},
        providerSettings: {},
        setCurrentConversation(history) {
            this.currentConversation = Array.isArray(history)
                ? history.map((msg, index) => ChatApp.Utils.normalizeMessage(msg, index)).filter(Boolean)
                : [];
        },
        addMessage(message) { this.currentConversation.push(message); },
        removeMessage(messageId) { this.currentConversation = this.currentConversation.filter(msg => msg.id !== messageId); },
        registerGeneratedDownloadUrl(url) {
            if (typeof url !== 'string' || !url.startsWith('blob:')) return;
            this.generatedDownloadUrls.push(url);
        },
        revokeGeneratedDownloadUrls() {
            this.generatedDownloadUrls.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.warn('Failed to revoke generated download URL:', error);
                }
            });
            this.generatedDownloadUrls = [];
            this.fileRenderCache.clear();
        },
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
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return str.replace(/[&<>"']/g, m => map[m]);
        },
        generateUUID() { 
            return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                if (!(blob instanceof Blob)) {
                    reject(new Error('Invalid blob provided'));
                    return;
                }
                if (blob.size > ChatApp.Config.MAX_FILE_SIZE_BYTES) {
                    reject(new Error(`File size exceeds maximum of ${ChatApp.Config.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`));
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read blob'));
                reader.onabort = () => reject(new Error('Blob read was aborted'));
                reader.readAsDataURL(blob);
            });
        },
        sanitizeTextForApi(text) {
            if (!text || typeof text !== 'string') return "";
            // Remove excessive whitespace but preserve intentional formatting
            return text.trim();
        },
        validateMessage(text, files) {
            if (!text && files.length === 0) return { valid: false, error: 'Message cannot be empty' };
            if (text && text.length > 10000) return { valid: false, error: 'Message is too long (max 10000 characters)' };
            return { valid: true };
        },
        isValidFileType(file) {
            const ALLOWED_TYPES = [ 'image/', 'video/', 'audio/', 'text/', 'application/json', 'application/javascript', 'text/javascript', 'text/css', 'text/html' ];
            const ALLOWED_EXTENSIONS = ['.js', '.lua', '.css', '.html', '.json', '.txt', '.md', '.py', '.sh'];
            return ALLOWED_TYPES.some(type => file.type.startsWith(type)) || ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
        },
        inferMimeType(fileName) {
            const extension = (fileName || '').split('.').pop()?.toLowerCase();
            const mimeTypes = {
                js: 'application/javascript',
                mjs: 'application/javascript',
                json: 'application/json',
                txt: 'text/plain',
                md: 'text/markdown',
                html: 'text/html',
                css: 'text/css',
                svg: 'image/svg+xml',
                xml: 'application/xml',
                py: 'text/x-python',
                sh: 'text/x-shellscript',
                lua: 'text/plain'
            };
            return mimeTypes[extension] || 'application/octet-stream';
        },
        sanitizeGeneratedFilename(name, fallbackIndex = 0) {
            const raw = typeof name === 'string' ? name : '';
            const basename = raw.replace(/\\/g, '/').split('/').pop() || '';
            let safeName = basename
                .replace(/\.\./g, '')
                .replace(/[<>:"|?*\x00-\x1F]/g, '_')
                .trim();

            if (!safeName) safeName = `file-${fallbackIndex + 1}.txt`;
            if (safeName.length > ChatApp.Config.MAX_GENERATED_FILENAME_LENGTH) {
                const lastDot = safeName.lastIndexOf('.');
                if (lastDot > 0 && lastDot < safeName.length - 1) {
                    const ext = safeName.slice(lastDot);
                    const baseMax = ChatApp.Config.MAX_GENERATED_FILENAME_LENGTH - ext.length;
                    safeName = `${safeName.slice(0, Math.max(1, baseMax))}${ext}`;
                } else {
                    safeName = safeName.slice(0, ChatApp.Config.MAX_GENERATED_FILENAME_LENGTH);
                }
            }
            return safeName;
        },
        normalizeAttachment(attachment, index = 0) {
            if (!attachment || typeof attachment !== 'object') return null;
            const name = typeof attachment.name === 'string' && attachment.name.trim()
                ? attachment.name.trim().slice(0, 120)
                : `attachment-${index + 1}`;
            const type = typeof attachment.type === 'string' && attachment.type.trim()
                ? attachment.type.trim()
                : this.inferMimeType(name);
            const data = typeof attachment.data === 'string' ? attachment.data : null;
            return { name, type, data };
        },
        normalizeMessage(message, index = 0) {
            if (!message || typeof message !== 'object') return null;

            const role = message?.content?.role;
            if (role !== 'user' && role !== 'model') return null;

            const rawParts = Array.isArray(message?.content?.parts) ? message.content.parts : [];
            const parts = rawParts.map((part) => {
                if (!part || typeof part !== 'object') return null;

                if (typeof part.text === 'string') {
                    return { text: part.text };
                }

                const inlineData = part.inlineData;
                if (
                    inlineData &&
                    typeof inlineData === 'object' &&
                    typeof inlineData.mimeType === 'string' &&
                    typeof inlineData.data === 'string'
                ) {
                    return {
                        inlineData: {
                            mimeType: inlineData.mimeType,
                            data: inlineData.data
                        }
                    };
                }

                return null;
            }).filter(Boolean);

            if (parts.length === 0) return null;

            const normalized = {
                id: message.id ? String(message.id) : this.generateUUID(),
                content: { role, parts }
            };

            const groundingMetadata = message?.content?.groundingMetadata;
            if (groundingMetadata && typeof groundingMetadata === 'object') {
                normalized.content.groundingMetadata = groundingMetadata;
            }

            if (Array.isArray(message.attachments)) {
                const attachments = message.attachments
                    .map((attachment, attachmentIndex) => this.normalizeAttachment(attachment, attachmentIndex))
                    .filter(Boolean);
                if (attachments.length > 0) normalized.attachments = attachments;
            }

            return normalized;
        },
        normalizeConversations(conversations) {
            if (!Array.isArray(conversations)) return [];

            return conversations.map((chat, index) => {
                if (!chat || typeof chat !== 'object') return null;

                const hasNumericId = typeof chat.id === 'number' && Number.isFinite(chat.id);
                const hasStringId = typeof chat.id === 'string' && chat.id.trim().length > 0;
                const id = hasNumericId || hasStringId ? chat.id : `${Date.now()}-${index}`;
                const title = typeof chat.title === 'string' && chat.title.trim()
                    ? chat.title.trim().slice(0, 120)
                    : 'Untitled Chat';
                const history = Array.isArray(chat.history)
                    ? chat.history.map((msg, msgIndex) => this.normalizeMessage(msg, msgIndex)).filter(Boolean)
                    : [];

                if (history.length === 0) return null;
                return { id, title, history };
            }).filter(Boolean);
        },
        async copyToClipboard(text) {
            const value = typeof text === 'string' ? text : String(text ?? '');
            if (!value) return false;

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                return true;
            }

            const temp = document.createElement('textarea');
            temp.value = value;
            temp.setAttribute('readonly', '');
            temp.style.position = 'absolute';
            temp.style.left = '-9999px';
            document.body.appendChild(temp);
            temp.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(temp);
            return copied;
        },
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    },

    Store: {
        saveAllConversations() { 
            const leanConversations = ChatApp.State.allConversations.map(chat => ({
                ...chat,
                history: chat.history.map(msg => {
                    const cleanMsg = JSON.parse(JSON.stringify(msg)); 
                    if (cleanMsg.attachments) {
                        cleanMsg.attachments = cleanMsg.attachments.map(att => ({
                            name: att.name,
                            type: att.type,
                            data: typeof att.type === 'string' && att.type.startsWith('text/') ? att.data : null 
                        }));
                    }
                    return cleanMsg;
                })
            }));

            try {
                localStorage.setItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(leanConversations));
            } catch (e) {
                console.error("Storage limit reached", e);
                ChatApp.UI.showToast("History full. Old chats may not save.", "error");
            }
        },
        loadAllConversations() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS);
                const parsed = stored ? JSON.parse(stored) : [];
                ChatApp.State.allConversations = ChatApp.Utils.normalizeConversations(parsed);
            } catch (e) {
                console.error("Failed to parse conversations, resetting.", e);
                ChatApp.State.allConversations = [];
            }
        },
        saveTheme(themeName) { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName); },
        getTheme() { return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME; },
        saveProviderSettings(settings) {
            const defaultSettings = ChatApp.Config.DEFAULT_PROVIDER_SETTINGS;
            const provider = Object.values(ChatApp.Config.PROVIDERS).includes(settings?.provider)
                ? settings.provider
                : defaultSettings.provider;

            const sanitized = {
                provider,
                models: {
                    ...defaultSettings.models,
                    ...(settings?.models || {})
                },
                apiKeys: {
                    ...defaultSettings.apiKeys,
                    ...(settings?.apiKeys || {})
                }
            };

            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS, JSON.stringify(sanitized));
            ChatApp.State.providerSettings = sanitized;
            return sanitized;
        },
        getProviderSettings() {
            const defaultSettings = ChatApp.Config.DEFAULT_PROVIDER_SETTINGS;

            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS);
                const parsed = stored ? JSON.parse(stored) : {};
                const provider = Object.values(ChatApp.Config.PROVIDERS).includes(parsed?.provider)
                    ? parsed.provider
                    : defaultSettings.provider;

                const merged = {
                    provider,
                    models: {
                        ...defaultSettings.models,
                        ...(parsed?.models || {})
                    },
                    apiKeys: {
                        ...defaultSettings.apiKeys,
                        ...(parsed?.apiKeys || {})
                    }
                };

                ChatApp.State.providerSettings = merged;
                return merged;
            } catch (error) {
                const fallback = JSON.parse(JSON.stringify(defaultSettings));
                ChatApp.State.providerSettings = fallback;
                return fallback;
            }
        },
        getActiveProviderSettings() {
            const hasSettings = ChatApp.State.providerSettings && typeof ChatApp.State.providerSettings === 'object';
            const settings = hasSettings ? ChatApp.State.providerSettings : this.getProviderSettings();
            const provider = Object.values(ChatApp.Config.PROVIDERS).includes(settings?.provider)
                ? settings.provider
                : ChatApp.Config.DEFAULT_PROVIDER_SETTINGS.provider;

            return {
                provider,
                model: String(settings?.models?.[provider] || '').trim(),
                apiKey: String(settings?.apiKeys?.[provider] || '').trim()
            };
        },
        saveToolsConfig(config) { 
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.TOOLS, JSON.stringify(config)); 
            ChatApp.State.toolsConfig = config;
        },
        getToolsConfig() {
            try {
                const stored = localStorage.getItem(ChatApp.Config.STORAGE_KEYS.TOOLS);
                const config = stored ? JSON.parse(stored) : ChatApp.Config.DEFAULT_TOOLS;
                const finalConfig = { ...ChatApp.Config.DEFAULT_TOOLS, ...config };
                ChatApp.State.toolsConfig = finalConfig;
                return finalConfig;
            } catch (e) {
                ChatApp.State.toolsConfig = { ...ChatApp.Config.DEFAULT_TOOLS };
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
        _renderMathInElement(element) {
            if (typeof window.katex === 'undefined') {
                console.warn('KaTeX library not loaded. Math rendering unavailable.');
                return;
            }
            try {
                // Render block math
                element.querySelectorAll('[data-latex="true"]').forEach(el => {
                    if (el.classList.contains('math-block') || el.classList.contains('math-inline')) {
                        try {
                            const content = el.textContent;
                            const isBlock = el.classList.contains('math-block');
                            window.katex.render(content, el, { displayMode: isBlock, throwOnError: false });
                        } catch (error) {
                            console.warn('KaTeX rendering error:', error);
                        }
                    }
                });
            } catch (error) {
                console.warn('Math rendering failed:', error);
            }
        },
        initTooltips() {
            let tooltipTimeout;
            const tooltip = this.elements.customTooltip;
            if (!tooltip) return;
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
        showToast(message, type = 'info', duration = 3000) {
            if (!message || typeof message !== 'string') return;
            if (!this.elements.toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `toast-message ${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            toast.textContent = message;
            this.elements.toastContainer.appendChild(toast);
            requestAnimationFrame(() => { toast.classList.add('show'); });
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => { if (toast.parentNode) toast.remove(); }, { once: true });
            }, duration);
        },
        scrollToBottom() {
            const area = this.elements.messageArea;
            if (!area) return;
            // Always scroll to bottom during streaming
            requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
        },
        forceScrollToBottom() {
            const area = this.elements.messageArea;
            if (!area) return;
            requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
        },
        clearChatArea() {
            this.elements.messageArea.innerHTML = '';
            this.elements.chatInput.value = '';
            this.elements.chatInput.style.height = 'auto';
            this.toggleSendButtonState();
        },
        _revokeFilePreviewUrls() {
            ChatApp.State.previewObjectUrls.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.warn('Failed to revoke object URL:', error);
                }
            });
            ChatApp.State.previewObjectUrls = [];
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
            const list = this.elements.conversationList;
            if (!list) return;
            list.innerHTML = '';
            
            if (ChatApp.State.allConversations.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'conversation-empty';
                emptyState.setAttribute('aria-label', 'No conversations yet');
                emptyState.textContent = 'No conversations yet';
                list.appendChild(emptyState);
                return;
            }
            
            const sortedConversations = [...ChatApp.State.allConversations].sort((a, b) => {
                const aId = Number(a?.id);
                const bId = Number(b?.id);
                if (Number.isFinite(aId) && Number.isFinite(bId)) return bId - aId;
                return 0;
            });
            sortedConversations.forEach((chat, index) => {
                const item = document.createElement('button');
                item.className = 'conversation-item';
                item.dataset.chatId = chat.id;
                item.setAttribute('role', 'menuitem');
                if (chat.id === ChatApp.State.currentChatId) { item.classList.add('active'); item.setAttribute('aria-current', 'true'); }
                const title = chat.title || 'Untitled Chat';
                item.setAttribute('aria-label', `Load conversation: ${title}`);

                const titleSpan = document.createElement('span');
                titleSpan.className = 'conversation-title';
                titleSpan.setAttribute('data-tooltip', title);
                titleSpan.textContent = title;

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('data-tooltip', 'Delete Chat');
                deleteBtn.setAttribute('aria-label', `Delete conversation: ${title}`);
                deleteBtn.innerHTML = ChatApp.Config.ICONS.DELETE;

                item.appendChild(titleSpan);
                item.appendChild(deleteBtn);
                item.addEventListener('click', (e) => { if (!e.target.closest('.delete-btn')) ChatApp.Controller.loadChat(chat.id); });
                item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ChatApp.Controller.loadChat(chat.id); } });
                if (deleteBtn) { deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); ChatApp.Controller.deleteConversation(chat.id); }); }
                list.appendChild(item);
            });
        },
        async renderMessage(message, isTyping = false) {
            const messageEl = document.createElement('div');
            messageEl.dataset.messageId = message.id;
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            let rawContent = ''; 
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
                } else if (Array.isArray(rawContent)) {
                    rawContent = await Promise.all(rawContent.map(async (part) => {
                        if (!part?.text || typeof part.text !== 'string') return part;
                        const processed = await ChatApp.Controller.processResponseForFiles(part.text);
                        return { ...part, text: processed };
                    }));
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
                if (Array.isArray(rawContent)) { textRepresentation = rawContent.map(p => p.text || '').join('\n'); } else { textRepresentation = rawContent; }
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
                    if (file.type.startsWith('image/')) { contentHTML = `<img src="${file.data}" alt="${ChatApp.Utils.escapeHTML(file.name)}" class="attachment-media">`; } 
                    else if (file.type.startsWith('video/')) { contentHTML = `<video src="${file.data}" class="attachment-media" controls data-tooltip="${ChatApp.Utils.escapeHTML(file.name)}"></video>`; }
                } else {
                    const extension = file.name.split('.').pop()?.toLowerCase() || '';
                    const iconMap = { 'html': ChatApp.Config.ICONS.HTML, 'css': ChatApp.Config.ICONS.CSS, 'js': ChatApp.Config.ICONS.JS, 'svg': ChatApp.Config.ICONS.SVG, };
                    const icon = iconMap[extension] || ChatApp.Config.ICONS.DOCUMENT;
                    contentHTML = `<div class="attachment-generic">${icon}<span class="attachment-filename">${ChatApp.Utils.escapeHTML(file.name)}</span></div>`;
                }
                item.innerHTML = contentHTML;
                container.appendChild(item);
            });
            return container;
        },
        renderFilePreviews() {
            this._revokeFilePreviewUrls();
            this.elements.filePreviewsContainer.innerHTML = '';
            if (ChatApp.State.attachedFiles.length === 0) { this.elements.filePreviewsContainer.style.display = 'none'; return; }
            this.elements.filePreviewsContainer.style.display = 'flex';
            ChatApp.State.attachedFiles.forEach((file, index) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                const objectURL = URL.createObjectURL(file);
                ChatApp.State.previewObjectUrls.push(objectURL);
                let previewContent = '';
                if (file.type.startsWith('image/')) { previewContent = `<img src="${objectURL}" alt="Preview of ${ChatApp.Utils.escapeHTML(file.name)}">`; } 
                else if (file.type.startsWith('video/')) { previewContent = `<video src="${objectURL}" autoplay muted loop playsinline data-tooltip="Preview of ${ChatApp.Utils.escapeHTML(file.name)}"></video>`; } 
                else {
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
        async updateStreamingMessage(messageEl, rawText) {
             const contentEl = messageEl.querySelector('.message-content');
             contentEl.innerHTML = await MessageFormatter.format(rawText);
             if (!contentEl.classList.contains('result-streaming')) {
                 contentEl.classList.add('result-streaming');
             }
             this._renderMathInElement(contentEl);
        },
        async finalizeBotMessage(messageEl, contentParts, messageId, botMessageForState) {
            if (ChatApp.State.typingInterval) { clearInterval(ChatApp.State.typingInterval); ChatApp.State.typingInterval = null; }
            messageEl.classList.remove('thinking');
            messageEl.dataset.messageId = messageId;
            const contentEl = messageEl.querySelector('.message-content');
            
            contentEl.classList.remove('result-streaming');

            const fullText = Array.isArray(contentParts) ? contentParts.map(p => p.text || '').join('\n') : contentParts;
            const groundingMetadata = botMessageForState.content.groundingMetadata || null;

            contentEl.innerHTML = await MessageFormatter.format(contentParts, groundingMetadata);
            this._renderMathInElement(contentEl);
            this._addMessageInteractions(messageEl, fullText, messageId);
            this.scrollToBottom();
            ChatApp.Controller.completeGeneration(botMessageForState);
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
                copyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const copied = await ChatApp.Utils.copyToClipboard(rawText);
                        if (!copied) throw new Error('Clipboard unavailable');
                        copyBtn.innerHTML = CHECK;
                        this.showToast('Message copied!');
                        setTimeout(() => { copyBtn.innerHTML = COPY; }, 2000);
                    } catch (error) {
                        this.showToast('Unable to copy text.', 'error');
                    }
                });
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
                                const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-container-bg').trim();
                                const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
                                const pausedHtml = `<!DOCTYPE html><html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:${bgColor};color:${textColor};font-family:sans-serif;font-size:14px;">Preview Paused</body></html>`;
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
                        let rawContent = '';
                        try {
                            rawContent = decodeURIComponent(wrapper.dataset.rawContent || '');
                        } catch {
                            rawContent = wrapper.dataset.rawContent || '';
                        }
                        const previewType = wrapper.dataset.previewable;
                        const newWindow = window.open('about:blank', '_blank');
                        if (!newWindow || newWindow.closed) { this.showToast('Enable popups to open in a new tab.', 'error'); return; }
                        try {
                            newWindow.opener = null;
                            newWindow.document.open();
                            if (previewType === 'html' || previewType === 'svg') {
                                newWindow.document.write(rawContent);
                            } else {
                                newWindow.document.write(
                                    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Code Preview</title>' +
                                    '<style>body{margin:0;padding:16px;background:#0f172a;color:#e2e8f0;font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;}pre{margin:0;white-space:pre-wrap;word-break:break-word;}</style>' +
                                    '</head><body><pre>' + ChatApp.Utils.escapeHTML(rawContent) + '</pre></body></html>'
                                );
                            }
                            newWindow.document.close();
                        } catch (error) {
                            try { newWindow.close(); } catch {}
                            this.showToast('Unable to open preview in a new tab.', 'error');
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
                copyCodeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const copied = await ChatApp.Utils.copyToClipboard(pre.textContent);
                        if (!copied) throw new Error('Clipboard unavailable');
                        copyCodeBtn.innerHTML = CHECK;
                        this.showToast('Code copied!');
                        setTimeout(() => { copyCodeBtn.innerHTML = COPY; }, 2000);
                    } catch (error) {
                        this.showToast('Unable to copy code.', 'error');
                    }
                });
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
            const providerSettings = ChatApp.Store.getProviderSettings();
            
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
                <div class="settings-row">
                    <label for="toggle-fullscreen">Full Screen Mode</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-fullscreen" ${document.fullscreenElement ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <hr>
                <h3>Provider & Model</h3>
                <div class="settings-row">
                    <label for="provider-select">Provider</label>
                    <select id="provider-select">
                        <option value="google">Google</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                    </select>
                </div>
                <div class="settings-row settings-row-input">
                    <label for="provider-model-input">Model Name</label>
                    <input id="provider-model-input" type="text" autocomplete="off" spellcheck="false">
                </div>
                <div class="settings-row settings-row-input">
                    <label for="provider-api-key-input">API Key</label>
                    <input id="provider-api-key-input" type="password" autocomplete="off" spellcheck="false">
                </div>
                <p id="provider-capability-note" style="font-size:0.85em; color:var(--text-secondary); margin-top:-10px; margin-bottom:16px;"></p>
                <hr>
                <h3>AI Capabilities</h3>
                <div class="settings-row">
                    <label for="toggle-agent-mode" style="font-weight:bold; color:var(--focus-color);">Agent Mode (Autonomous)</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-agent-mode" ${tools.agentMode ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <p style="font-size:0.85em; color:var(--text-secondary); margin-top:-10px; margin-bottom:20px;">
                    Enables autonomous reasoning and planning. On Google provider, this also enables Search and Code Execution.
                </p>

                <div class="settings-row" data-google-tool-row="true">
                    <label for="toggle-google-search">Google Search (Grounding)</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-google-search" ${tools.googleSearch ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-row" data-google-tool-row="true">
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

            const providerSelect = overlay.querySelector('#provider-select');
            const providerModelInput = overlay.querySelector('#provider-model-input');
            const providerApiKeyInput = overlay.querySelector('#provider-api-key-input');
            const providerCapabilityNote = overlay.querySelector('#provider-capability-note');
            const googleToolRows = overlay.querySelectorAll('[data-google-tool-row="true"]');
            const googleSearchToggle = overlay.querySelector('#toggle-google-search');
            const codeExecToggle = overlay.querySelector('#toggle-code-exec');

            const providerMetadata = {
                google: {
                    modelPlaceholder: 'gemini-2.5-flash',
                    keyPlaceholder: 'AIza...',
                    supportsGoogleTools: true
                },
                openai: {
                    modelPlaceholder: 'gpt-4.1-mini',
                    keyPlaceholder: 'sk-...',
                    supportsGoogleTools: false
                },
                anthropic: {
                    modelPlaceholder: 'claude-3-5-haiku-latest',
                    keyPlaceholder: 'sk-ant-...',
                    supportsGoogleTools: false
                }
            };

            let draftProviderSettings = JSON.parse(JSON.stringify(providerSettings));
            const persistProviderSettings = () => {
                draftProviderSettings = ChatApp.Store.saveProviderSettings(draftProviderSettings);
            };

            const refreshProviderUI = () => {
                const provider = providerSelect.value;
                const metadata = providerMetadata[provider] || providerMetadata.google;

                providerModelInput.value = draftProviderSettings.models?.[provider] || '';
                providerApiKeyInput.value = draftProviderSettings.apiKeys?.[provider] || '';
                providerModelInput.placeholder = metadata.modelPlaceholder;
                providerApiKeyInput.placeholder = metadata.keyPlaceholder;

                const disableGoogleTools = metadata.supportsGoogleTools !== true;
                googleToolRows.forEach((row) => {
                    row.classList.toggle('settings-row-disabled', disableGoogleTools);
                });
                googleSearchToggle.disabled = disableGoogleTools;
                codeExecToggle.disabled = disableGoogleTools;

                providerCapabilityNote.textContent = disableGoogleTools
                    ? 'Google Search and Code Execution are only available when Provider is Google.'
                    : 'Google Search and Code Execution are available for this provider.';
            };

            providerSelect.value = draftProviderSettings.provider;
            refreshProviderUI();

            providerSelect.addEventListener('change', () => {
                draftProviderSettings.provider = providerSelect.value;
                persistProviderSettings();
                refreshProviderUI();
            });

            providerModelInput.addEventListener('input', () => {
                const provider = providerSelect.value;
                draftProviderSettings.models[provider] = providerModelInput.value;
                persistProviderSettings();
            });

            providerApiKeyInput.addEventListener('input', () => {
                const provider = providerSelect.value;
                draftProviderSettings.apiKeys[provider] = providerApiKeyInput.value;
                persistProviderSettings();
            });

            overlay.querySelector('#toggle-fullscreen').addEventListener('change', (e) => {
                ChatApp.Controller.toggleFullScreen(e.target.checked);
            });

            const updateTools = () => {
                const config = {
                    googleSearch: overlay.querySelector('#toggle-google-search').checked,
                    codeExecution: overlay.querySelector('#toggle-code-exec').checked,
                    agentMode: overlay.querySelector('#toggle-agent-mode').checked
                };
                ChatApp.Store.saveToolsConfig(config);
            };
            overlay.querySelector('#toggle-google-search').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-code-exec').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-agent-mode').addEventListener('change', updateTools);
            
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
                case 'video': const vid = document.createElement('video'); vid.src = content; vid.controls = true; vid.autoplay = true; fullscreenContent.appendChild(vid); break;
                case 'image':
                    const img = document.createElement('img');
                    img.src = content;
                    img.alt = 'Image preview';
                    fullscreenContent.appendChild(img);
                    break;
                case 'svg':
                    const svgImg = document.createElement('img');
                    svgImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
                    svgImg.alt = 'SVG preview';
                    fullscreenContent.appendChild(svgImg);
                    break;
                case 'html':
                    const iframe = document.createElement('iframe'); 
                    iframe.srcdoc = content; 
                    iframe.sandbox = "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox";
                    fullscreenContent.appendChild(iframe); 
                    break;
            }
            fullscreenOverlay.style.display = 'flex';
            body.classList.add('modal-open');
        },
    },

    Api: {
        getProviderLabel(provider) {
            switch (provider) {
                case ChatApp.Config.PROVIDERS.OPENAI:
                    return 'OpenAI';
                case ChatApp.Config.PROVIDERS.ANTHROPIC:
                    return 'Anthropic';
                default:
                    return 'Google';
            }
        },
        getActiveProviderConfig() {
            const { provider, model, apiKey } = ChatApp.Store.getActiveProviderSettings();
            const providerLabel = this.getProviderLabel(provider);
            if (!apiKey) {
                throw new Error(`${providerLabel} API key is missing. Add it in Settings.`);
            }
            if (!model) {
                throw new Error(`${providerLabel} model name is missing. Add it in Settings.`);
            }
            return { provider, model, apiKey };
        },
        sanitizeApiContents(apiContents) {
            return apiContents.map((content) => {
                if (!content?.role || !Array.isArray(content.parts)) return content;
                return {
                    role: content.role,
                    parts: content.parts.map((part) => {
                        if (part?.text) {
                            return { text: ChatApp.Utils.sanitizeTextForApi(part.text) };
                        }
                        return part;
                    })
                };
            });
        },
        joinSystemInstruction(systemInstruction) {
            if (!systemInstruction || !Array.isArray(systemInstruction.parts)) return '';
            return systemInstruction.parts
                .map((part) => (typeof part?.text === 'string' ? part.text : ''))
                .filter(Boolean)
                .join('\n\n')
                .trim();
        },
        buildGoogleTools(toolsConfig) {
            const tools = [];
            if (!toolsConfig || typeof toolsConfig !== 'object') return tools;

            const isAgent = toolsConfig.agentMode === true;
            if (toolsConfig.googleSearch === true || isAgent) tools.push({ googleSearch: {} });
            if (toolsConfig.codeExecution === true || isAgent) tools.push({ codeExecution: {} });
            return tools;
        },
        partsToOpenAiContent(parts) {
            const content = [];
            let omittedCount = 0;

            parts.forEach((part) => {
                if (typeof part?.text === 'string' && part.text) {
                    content.push({ type: 'text', text: part.text });
                    return;
                }

                const inlineData = part?.inlineData;
                if (!inlineData || typeof inlineData !== 'object') return;

                const mimeType = typeof inlineData.mimeType === 'string' ? inlineData.mimeType : 'application/octet-stream';
                const data = typeof inlineData.data === 'string' ? inlineData.data : '';

                if (!data) return;
                if (mimeType.startsWith('image/')) {
                    content.push({
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${data}`
                        }
                    });
                    return;
                }

                omittedCount += 1;
            });

            if (omittedCount > 0) {
                content.push({
                    type: 'text',
                    text: `[${omittedCount} non-image attachment(s) omitted because OpenAI direct mode only forwards image attachments.]`
                });
            }

            if (content.length === 0) {
                return [{ type: 'text', text: '' }];
            }

            return content;
        },
        partsToAnthropicContent(parts) {
            const content = [];
            let omittedCount = 0;

            parts.forEach((part) => {
                if (typeof part?.text === 'string' && part.text) {
                    content.push({ type: 'text', text: part.text });
                    return;
                }

                const inlineData = part?.inlineData;
                if (!inlineData || typeof inlineData !== 'object') return;

                const mimeType = typeof inlineData.mimeType === 'string' ? inlineData.mimeType : 'application/octet-stream';
                const data = typeof inlineData.data === 'string' ? inlineData.data : '';

                if (!data) return;
                if (mimeType.startsWith('image/')) {
                    content.push({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mimeType,
                            data
                        }
                    });
                    return;
                }

                omittedCount += 1;
            });

            if (omittedCount > 0) {
                content.push({
                    type: 'text',
                    text: `[${omittedCount} non-image attachment(s) omitted because Anthropic direct mode only forwards image attachments.]`
                });
            }

            if (content.length === 0) {
                return [{ type: 'text', text: '' }];
            }

            return content;
        },
        toOpenAiMessages(contents, systemInstructionText) {
            const messages = [];
            if (systemInstructionText) {
                messages.push({ role: 'system', content: systemInstructionText });
            }

            contents.forEach((message) => {
                const role = message.role === 'model' ? 'assistant' : 'user';
                messages.push({
                    role,
                    content: this.partsToOpenAiContent(message.parts || [])
                });
            });
            return messages;
        },
        toAnthropicMessages(contents) {
            return contents.map((message) => ({
                role: message.role === 'model' ? 'assistant' : 'user',
                content: this.partsToAnthropicContent(message.parts || [])
            }));
        },
        extractOpenAiText(data) {
            const content = data?.choices?.[0]?.message?.content;
            if (typeof content === 'string') return content;
            if (Array.isArray(content)) {
                return content
                    .map((item) => {
                        if (typeof item?.text === 'string') return item.text;
                        if (typeof item?.content === 'string') return item.content;
                        return '';
                    })
                    .filter(Boolean)
                    .join('');
            }
            return '';
        },
        extractAnthropicText(data) {
            if (!Array.isArray(data?.content)) return '';
            return data.content
                .map((item) => (item?.type === 'text' && typeof item?.text === 'string' ? item.text : ''))
                .filter(Boolean)
                .join('');
        },
        extractGoogleText(data) {
            const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
            const chunks = [];
            candidates.forEach((candidate) => {
                const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
                parts.forEach((part) => {
                    if (typeof part?.text === 'string' && part.text) {
                        chunks.push(part.text);
                    }
                });
            });
            return chunks.join('');
        },
        async getErrorMessageFromResponse(response, providerLabel) {
            const fallback = `${providerLabel} API error: ${response.status}`;
            let raw = '';
            try {
                raw = await response.text();
            } catch {
                return fallback;
            }
            if (!raw) return fallback;

            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed?.error?.message === 'string') return parsed.error.message;
                if (typeof parsed?.message === 'string') return parsed.message;
            } catch {
                // Keep raw fallback.
            }

            return raw.slice(0, 300) || fallback;
        },
        async requestGoogleText({ apiKey, model, contents, systemInstruction, toolsConfig, signal, titleMode = false }) {
            const endpoint = `${ChatApp.Config.API_ENDPOINTS.GOOGLE_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const tools = this.buildGoogleTools(toolsConfig);
            const payload = {
                contents,
                ...(systemInstruction ? { systemInstruction } : {}),
                ...(tools.length > 0 ? { tools } : {}),
                ...(titleMode ? { generationConfig: { maxOutputTokens: 40, temperature: 0.3 } } : {})
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getErrorMessageFromResponse(response, 'Google'));
            }

            const data = await response.json();
            const text = this.extractGoogleText(data).trim();
            if (!text) throw new Error('Google returned an empty response.');
            return text;
        },
        async requestOpenAiText({ apiKey, model, contents, systemInstructionText, signal, titleMode = false }) {
            const payload = {
                model,
                messages: this.toOpenAiMessages(contents, systemInstructionText),
                temperature: titleMode ? 0.2 : 0.7,
                ...(titleMode ? { max_tokens: 30 } : {})
            };

            const response = await fetch(ChatApp.Config.API_ENDPOINTS.OPENAI_CHAT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getErrorMessageFromResponse(response, 'OpenAI'));
            }

            const data = await response.json();
            const text = this.extractOpenAiText(data).trim();
            if (!text) throw new Error('OpenAI returned an empty response.');
            return text;
        },
        async requestAnthropicText({ apiKey, model, contents, systemInstructionText, signal, titleMode = false }) {
            const payload = {
                model,
                max_tokens: titleMode ? 30 : 2048,
                temperature: titleMode ? 0.2 : 0.7,
                messages: this.toAnthropicMessages(contents),
                ...(systemInstructionText ? { system: systemInstructionText } : {})
            };

            const response = await fetch(ChatApp.Config.API_ENDPOINTS.ANTHROPIC_MESSAGES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getErrorMessageFromResponse(response, 'Anthropic'));
            }

            const data = await response.json();
            const text = this.extractAnthropicText(data).trim();
            if (!text) throw new Error('Anthropic returned an empty response.');
            return text;
        },
        splitTextForStreaming(text, chunkSize = 120) {
            const safeText = typeof text === 'string' ? text : '';
            const chunks = [];
            if (!safeText) return chunks;
            for (let i = 0; i < safeText.length; i += chunkSize) {
                chunks.push(safeText.slice(i, i + chunkSize));
            }
            return chunks;
        },
        async generateText({ apiContents, systemInstruction, signal, toolsConfig, titleMode = false }) {
            if (!Array.isArray(apiContents)) {
                throw new Error('Invalid contents for generation.');
            }

            const { provider, model, apiKey } = this.getActiveProviderConfig();
            const sanitizedContents = this.sanitizeApiContents(apiContents);
            const systemInstructionText = this.joinSystemInstruction(systemInstruction);

            if (provider === ChatApp.Config.PROVIDERS.OPENAI) {
                return this.requestOpenAiText({
                    apiKey,
                    model,
                    contents: sanitizedContents,
                    systemInstructionText,
                    signal,
                    titleMode
                });
            }

            if (provider === ChatApp.Config.PROVIDERS.ANTHROPIC) {
                return this.requestAnthropicText({
                    apiKey,
                    model,
                    contents: sanitizedContents,
                    systemInstructionText,
                    signal,
                    titleMode
                });
            }

            return this.requestGoogleText({
                apiKey,
                model,
                contents: sanitizedContents,
                systemInstruction,
                toolsConfig,
                signal,
                titleMode
            });
        },
        async getSystemContext(isAgentMode = false, provider = ChatApp.Config.PROVIDERS.GOOGLE) {
            if (isAgentMode) {
                return this.getAgentSystemContext(provider);
            }

            const providerNote = provider === ChatApp.Config.PROVIDERS.GOOGLE
                ? '- Tool note: Google Search and Code Execution can be enabled from Settings.'
                : `- Tool note: External Search/Code tools are unavailable on ${this.getProviderLabel(provider)} direct mode.`;

            return `You are J.B.A.I., a helpful and context-aware assistant. You were created by Jeremiah (gokuthug1).
--- Custom Commands ---
/html -> Give a random HTML code that's interesting and fun.
/profile -> List all custom commands and explain what each does.
/concept -> Ask what concept the user wants to create.
/song -> Ask about the user's music taste, then recommend a fitting song.
/word -> Give a new word and its definition.
/tip -> Share a useful lifehack or tip.
/invention -> Generate a fictional, interesting invention idea.
/sp -> Correct any text the user sends for spelling and grammar.
/art -> Suggest a prompt or idea for a creative art project.
/bdw -> Break down a word: pronunciation, definition, and similar-sounding word.

--- General Rules ---
- Use standard Markdown in your responses (including tables).
${providerNote}

--- MULTIPLE FILES & DOWNLOAD (CRITICAL) ---
When users ask for multiple files, separate files, or a download link, you MUST use this format:
\`[FILES: { "files": [{"name": "file1.ext", "content": "content here"}, {"name": "file2.ext", "content": "content here"}] }]\`

EXAMPLE:
\`[FILES: { "files": [{"name": "index.html", "content": "<!DOCTYPE html>\\n<html>...</html>"}, {"name": "style.css", "content": "body { margin: 0; }"}, {"name": "script.js", "content": "console.log('hello');"}] }]\`

CRITICAL: In JSON "content" fields, you MUST escape special characters:
- Newlines: use \\n (not actual newlines)
- Quotes: use \\" (not just ")
- Backslashes: use \\\\ (not just \\)
- Tabs: use \\t
The content is a JSON string, so ALL special characters must be properly escaped!

This creates an automatic ZIP download button. JSZip is integrated. DO NOT say you cannot create download links - use this format instead.

- Current Date/Time: ${new Date().toLocaleString()}
- For single-file HTML responses (without file requests), HTML must be self-contained in one markdown block. When using [FILES: {...}], you can include multiple files.`;
        },
        async getAgentSystemContext(provider = ChatApp.Config.PROVIDERS.GOOGLE) {
            const toolCapability = provider === ChatApp.Config.PROVIDERS.GOOGLE
                ? 'Use Google Search and Code Execution tools when needed.'
                : `No external tools are available in ${this.getProviderLabel(provider)} direct mode. Reason using only the conversation context and your own model output.`;

            return `You are J.B.A.I. in **AGENT MODE**. You are an autonomous digital worker designed to solve complex, multi-step problems.
            
--- CORE DIRECTIVES ---
1. **PERCEIVE & REASON**: Do not just answer immediately. Analyze the request, break it down, and plan your approach.
2. **ACT**: ${toolCapability}
3. **REFLECT**: Look at your intermediate results. If they are weak, revise your plan.
4. **SYNTHESIZE**: Only provide the final answer after enough evidence has been gathered.

--- FORMATTING RULES (CRITICAL) ---
You MUST wrap your internal thought process, planning, and observations inside \`<agent_process>\` and \`</agent_process>\` tags.
Your final answer to the user must be OUTSIDE these tags.

--- CAPABILITIES ---
- **Files**: You can generate multiple files using the standard [FILES: {...}] format.

--- BEHAVIORAL RULES ---
- Be autonomous. Do not ask the user for permission to proceed.
- If an error occurs, analyze it, fix your approach, and try again.
- Current Date/Time: ${new Date().toLocaleString()}

You are a digital professional. Be concise, accurate, and effective.`;
        },
        async fetchTitle(chatHistory) {
            if (!Array.isArray(chatHistory) || chatHistory.length === 0) return 'New Chat';
            const safeHistory = chatHistory.filter((message) => {
                const text = message?.content?.parts?.[0]?.text;
                return text && typeof text === 'string';
            });
            if (safeHistory.length < 2) return 'New Chat';

            const userText = safeHistory[0].content.parts[0].text.substring(0, 200);
            const aiText = safeHistory[1].content.parts[0].text.substring(0, 200);
            const prompt = `Based on this conversation, create a short, concise title (4 words max). Output only the title, no quotes, no markdown, no punctuation at the end.\n\nUser: ${userText}\nAI: ${aiText}`;

            try {
                const titleText = await this.generateText({
                    apiContents: [{ role: 'user', parts: [{ text: prompt }] }],
                    systemInstruction: null,
                    signal: undefined,
                    toolsConfig: { googleSearch: false, codeExecution: false, agentMode: false },
                    titleMode: true
                });
                const sanitizedTitle = titleText
                    .trim()
                    .replace(/^["'`]|["'`]$/g, '')
                    .replace(/^\*+|\*+$/g, '')
                    .replace(/\.$/, '')
                    .substring(0, 50);
                return sanitizedTitle || 'Chat';
            } catch (error) {
                console.warn('Title generation failed:', error);
                return 'Titled Chat';
            }
        },
        async *streamTextResponse(apiContents, systemInstruction, signal, toolsConfig) {
            try {
                const text = await this.generateText({
                    apiContents,
                    systemInstruction,
                    signal,
                    toolsConfig,
                    titleMode: false
                });
                const chunks = this.splitTextForStreaming(text);
                for (const chunk of chunks) {
                    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                    yield chunk;
                }
            } catch (error) {
                if (error?.name === 'AbortError') {
                    throw new Error('Generation stopped by user.');
                }
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    throw new Error('Network error: Please check your connection.');
                }
                throw error;
            }
        }
    },

    Controller: {
        init() {
            ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
            ChatApp.Store.loadAllConversations();
            ChatApp.Store.getProviderSettings();
            ChatApp.Store.getToolsConfig();
            ChatApp.UI.cacheElements();
            ChatApp.UI.initTooltips();
            ChatApp.UI.renderSidebar();
            ChatApp.UI.toggleSendButtonState();
            this.initOfflineDetection();
            
            const { elements } = ChatApp.UI;
            const { Controller } = ChatApp;
            
            elements.sendButton.addEventListener('click', Controller.handleChatSubmission.bind(Controller));
            elements.stopButton.addEventListener('click', Controller.stopGeneration.bind(Controller));
            elements.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Controller.handleChatSubmission(); } });
            elements.chatInput.addEventListener('input', () => { elements.chatInput.style.height = 'auto'; elements.chatInput.style.height = `${elements.chatInput.scrollHeight}px`; ChatApp.UI.toggleSendButtonState(); });
            elements.chatInput.addEventListener('paste', Controller.handlePaste.bind(Controller));
            elements.newChatBtn.addEventListener('click', Controller.startNewChat.bind(Controller));
            elements.settingsButton.addEventListener('click', ChatApp.UI.renderSettingsModal.bind(ChatApp.UI));
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', Controller.handleFileSelection.bind(Controller));
            elements.sidebarToggle.addEventListener('click', () => { const isOpen = elements.body.classList.toggle('sidebar-open'); elements.sidebarToggle.setAttribute('aria-expanded', isOpen.toString()); });
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
            elements.messageArea.addEventListener('click', Controller.handleMessageAreaClick.bind(Controller));
            elements.fullscreenCloseBtn.addEventListener('click', Controller.closeFullscreenPreview.bind(Controller));
            elements.fullscreenOverlay.addEventListener('click', (e) => { if (e.target === elements.fullscreenOverlay) { Controller.closeFullscreenPreview(); } });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.body.classList.contains('modal-open')) { Controller.closeFullscreenPreview(); } });
            elements.body.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); elements.body.classList.add('drag-over'); });
            elements.body.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); if (e.relatedTarget === null || !elements.body.contains(e.relatedTarget)) { elements.body.classList.remove('drag-over'); } });
            elements.body.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); elements.body.classList.remove('drag-over'); if (e.dataTransfer?.files?.length > 0) { Controller.addFilesToState(e.dataTransfer.files); } });
            window.addEventListener('beforeunload', () => {
                ChatApp.UI._revokeFilePreviewUrls();
                ChatApp.State.revokeGeneratedDownloadUrls();
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
                // If a partial message exists, treat it as finished
                const streamingMsg = document.querySelector('.result-streaming');
                if (streamingMsg) streamingMsg.classList.remove('result-streaming');
            }
        },
        toggleFullScreen(enable) {
            if (enable) { if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen(); } } 
            else { if (document.exitFullscreen && document.fullscreenElement) { document.exitFullscreen(); } }
        },
        async handleChatSubmission() {
            if (!navigator.onLine) { ChatApp.UI.showToast('Cannot send message while offline. Please check your connection.', 'error'); return; }
            const userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            
            const validation = ChatApp.Utils.validateMessage(userInput, files);
            if (!validation.valid) { ChatApp.UI.showToast(validation.error, 'error'); return; }
            
            if (ChatApp.State.isGenerating) return;

            try {
                ChatApp.Api.getActiveProviderConfig();
            } catch (error) {
                ChatApp.UI.showToast(error.message || 'Provider settings are incomplete.', 'error');
                return;
            }

            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            
            ChatApp.State.abortController = new AbortController();
            ChatApp.State.setGenerating(true);
            this.clearAttachedFiles();

            const fileDataPromises = files.map(file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = typeof e.target?.result === 'string' ? e.target.result : '';
                    const base64Data = result.includes(',') ? result.split(',')[1] : '';
                    if (!base64Data) {
                        reject(new Error(`Failed to encode "${file.name}" for upload.`));
                        return;
                    }
                    resolve({
                        mimeType: file.type || ChatApp.Utils.inferMimeType(file.name),
                        data: base64Data
                    });
                };
                reader.onerror = reject;
                reader.onabort = () => reject(new Error('File read aborted'));
                reader.readAsDataURL(file);
            }));
            
            try {
                const fileApiData = await Promise.all(fileDataPromises);
                const messageParts = fileApiData.map(p => ({ inlineData: p }));
                if (userInput) { messageParts.push({ text: userInput }); }

                const userMessageAttachments = await Promise.all(files.map(async (file) => {
                    const fileType = file.type || ChatApp.Utils.inferMimeType(file.name);
                    if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
                        const base64 = await ChatApp.Utils.blobToBase64(file);
                        return { name: file.name, type: fileType, data: base64 };
                    }
                    return { name: file.name, type: fileType, data: null };
                }));

                const userMessage = { id: ChatApp.Utils.generateUUID(), content: { role: "user", parts: messageParts }, attachments: userMessageAttachments };
                ChatApp.State.addMessage(userMessage);
                await ChatApp.UI.renderMessage(userMessage);
                await this._generateText();
            } catch (error) {
                ChatApp.UI.showToast(`Error processing files: ${error.message}`, 'error');
                ChatApp.State.setGenerating(false);
            }
        },
        addFilesToState(files) {
            if (!files || files.length === 0) return;
            const newFiles = Array.from(files);
            const MAX_FILES = ChatApp.Config.MAX_FILES;
            if (ChatApp.State.attachedFiles.length + newFiles.length > MAX_FILES) { ChatApp.UI.showToast(`Maximum ${MAX_FILES} files allowed.`, 'error'); return; }
            
            const validFiles = newFiles.filter(file => {
                if (!(file instanceof File)) { console.warn('Invalid file object:', file); return false; }
                if (file.size > ChatApp.Config.MAX_FILE_SIZE_BYTES) { 
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2); 
                    const maxMB = (ChatApp.Config.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(2); 
                    ChatApp.UI.showToast(`File "${ChatApp.Utils.escapeHTML(file.name)}" is too large (${sizeMB}MB). Maximum: ${maxMB}MB.`, 'error'); 
                    return false; 
                }
                const isValidType = ChatApp.Utils.isValidFileType(file);
                if (!isValidType) { ChatApp.UI.showToast(`File "${ChatApp.Utils.escapeHTML(file.name)}" type not supported.`, 'error'); return false; }
                const isDuplicate = ChatApp.State.attachedFiles.some(existing => existing.name === file.name && existing.size === file.size);
                if (isDuplicate) { ChatApp.UI.showToast(`File "${ChatApp.Utils.escapeHTML(file.name)}" is already attached.`, 'error'); return false; }
                return true;
            });
            if (validFiles.length > 0) { ChatApp.State.attachedFiles.push(...validFiles); ChatApp.UI.renderFilePreviews(); ChatApp.UI.showToast(`${validFiles.length} file(s) attached.`); }
        },
        handleFileSelection(event) { this.addFilesToState(event.target.files); event.target.value = null; },
        handlePaste(event) {
            const files = event.clipboardData?.files;
            if (!files || files.length === 0) return;
            const filesToProcess = Array.from(files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
            if (filesToProcess.length > 0) { event.preventDefault(); this.addFilesToState(filesToProcess); ChatApp.UI.showToast(`${filesToProcess.length} file(s) pasted.`); }
        },
        removeAttachedFile(index) { ChatApp.State.attachedFiles.splice(index, 1); ChatApp.UI.renderFilePreviews(); ChatApp.UI.hideTooltip(); },
        clearAttachedFiles() { ChatApp.State.attachedFiles = []; ChatApp.UI.renderFilePreviews(); },
        async _generateText() {
            // 1. Initial Placeholder
            const messageEl = await ChatApp.UI.renderMessage({ id: null }, true); // render as "thinking"
            let fullTextAccumulator = "";
            let messageId = ChatApp.Utils.generateUUID();
            let hasRemovedThinking = false;

            try {
                const toolsConfig = ChatApp.State.toolsConfig;
                const isAgentMode = toolsConfig.agentMode === true;
                const { provider } = ChatApp.Store.getActiveProviderSettings();
                
                const systemText = await ChatApp.Api.getSystemContext(isAgentMode, provider);
                const systemInstruction = { parts: [{ text: systemText }] };
                
                const apiContents = ChatApp.State.currentConversation.map(msg => ({ role: msg.content.role, parts: msg.content.parts }));

                // 2. Start Stream
                const stream = ChatApp.Api.streamTextResponse(apiContents, systemInstruction, ChatApp.State.abortController.signal, toolsConfig);
                
                // 3. Process Stream Chunks
                for await (const chunk of stream) {
                    if (!chunk) continue;
                    
                    if (!hasRemovedThinking) {
                        messageEl.classList.remove('thinking');
                        messageEl.dataset.messageId = messageId;
                        hasRemovedThinking = true;
                    }

                    fullTextAccumulator += chunk;
                    await ChatApp.UI.updateStreamingMessage(messageEl, fullTextAccumulator);
                    ChatApp.UI.scrollToBottom();
                }

                // If no text was accumulated and no chunks were received, handle gracefully
                if (!fullTextAccumulator) {
                    if (!hasRemovedThinking) {
                        // No chunks were ever received
                        throw new Error("No response generated. The API returned no content.");
                    } else {
                        // Chunks were received but all empty - treat as valid empty response
                        fullTextAccumulator = "(No response text generated)";
                    }
                }

                // 4. Post-processing (Files)
                const rawModelText = fullTextAccumulator;
                const processedModelText = await this.processResponseForFiles(rawModelText);

                // 5. Finalize
                const contentObj = { role: "model", parts: [{ text: rawModelText }] };
                const botMessageForState = { id: messageId, content: contentObj };
                
                await ChatApp.UI.finalizeBotMessage(messageEl, [{ text: processedModelText }], messageId, botMessageForState);

            } catch (error) {
                // If checking for abort
                if (error.message === "Generation stopped by user.") {
                    ChatApp.UI.showToast(error.message);
                    if (!hasRemovedThinking) messageEl.remove(); // Clean up if stopped before first chunk
                } else if (error instanceof TypeError) {
                    console.error("Type error during generation:", error);
                    let errorMsg = "Connection error. Please try again.";
                    if (error.message.includes('NetworkError')) { errorMsg = "Network error: Unable to reach the API."; }
                    if (!hasRemovedThinking) messageEl.remove();
                    const errorBotMessage = { id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: errorMsg }] } };
                    await ChatApp.UI.renderMessage(errorBotMessage);
                    ChatApp.UI.showToast(errorMsg, 'error', 5000);
                } else {
                    console.error("Generation error:", error);
                    let errorMsg = "An error occurred while generating a response.";
                    if (error.message && error.message.includes("Network")) { errorMsg = "Network error: Please check your internet connection and try again."; } 
                    else if (error.message && error.message.includes("429")) { errorMsg = "Rate limit exceeded. Please wait a moment and try again."; } 
                    else if (error.message && error.message.includes("401")) { errorMsg = "Authorization error: Please check your API key."; } 
                    else if (error.message && error.message.includes("403")) { errorMsg = "Access denied: Your API key may not have permission for this operation."; }
                    else if (error.message) { errorMsg = `Error: ${error.message.substring(0, 150)}`; }

                    // Replace/Append error message
                    if (!hasRemovedThinking && messageEl && messageEl.parentNode) messageEl.remove();
                    
                    const errorBotMessage = { id: ChatApp.Utils.generateUUID(), content: { role: 'model', parts: [{ text: errorMsg }] } };
                    await ChatApp.UI.renderMessage(errorBotMessage);
                    ChatApp.UI.showToast(errorMsg, 'error', 5000);
                }
            } finally {
                 ChatApp.State.setGenerating(false);
            }
        },
        async processResponseForFiles(rawText) {
            if (!rawText || typeof rawText !== 'string') return rawText;
            const cachedProcessedText = ChatApp.State.fileRenderCache.get(rawText);
            if (cachedProcessedText) return cachedProcessedText;
            if (typeof JSZip === 'undefined') { console.warn('JSZip library not loaded. File creation feature unavailable.'); return rawText; }
            const matches = [];
            let searchIndex = 0;
            while ((searchIndex = rawText.indexOf('[FILES:', searchIndex)) !== -1) {
                const jsonStart = rawText.indexOf('{', searchIndex);
                if (jsonStart === -1) { searchIndex++; continue; }
                let braceCount = 0;
                let inString = false;
                let escapeNext = false;
                let jsonEnd = -1;
                for (let i = jsonStart; i < rawText.length; i++) {
                    const char = rawText[i];
                    if (escapeNext) { escapeNext = false; continue; }
                    if (char === '\\') { escapeNext = true; continue; }
                    if (char === '"') { inString = !inString; continue; }
                    if (!inString) {
                        if (char === '{') braceCount++;
                        if (char === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i; break; } }
                    }
                }
                if (jsonEnd !== -1) {
                    const endIndex = rawText.indexOf(']', jsonEnd);
                    if (endIndex !== -1) {
                        const fullMatch = rawText.substring(searchIndex, endIndex + 1);
                        const jsonString = rawText.substring(jsonStart, jsonEnd + 1);
                        matches.push([fullMatch, jsonString]);
                        searchIndex = endIndex + 1;
                        continue;
                    }
                }
                searchIndex++;
            }
            if (matches.length === 0) return rawText;
            const replacementPromises = matches.map(async (match) => {
                const originalTag = match[0];
                const jsonString = match[1];
                try {
                    const params = JSON.parse(jsonString);
                    if (!params.files || !Array.isArray(params.files) || params.files.length === 0) { throw new Error('Missing or invalid files array in file parameters'); }
                    if (params.files.length > ChatApp.Config.MAX_GENERATED_FILES) {
                        throw new Error(`Generated file count exceeds ${ChatApp.Config.MAX_GENERATED_FILES}`);
                    }

                    let totalBytes = 0;
                    const zip = new JSZip();
                    params.files.forEach((file, index) => {
                        if (!file || file.content === undefined) {
                            throw new Error('Each file must have a name and content property');
                        }

                        const safeName = ChatApp.Utils.sanitizeGeneratedFilename(file.name, index);
                        const fileContent = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
                        const fileBytes = new Blob([fileContent]).size;

                        if (fileBytes > ChatApp.Config.MAX_GENERATED_FILE_BYTES) {
                            throw new Error(`"${safeName}" exceeds ${Math.round(ChatApp.Config.MAX_GENERATED_FILE_BYTES / 1024)}KB`);
                        }

                        totalBytes += fileBytes;
                        if (totalBytes > ChatApp.Config.MAX_GENERATED_TOTAL_BYTES) {
                            throw new Error('Generated files exceed total size limit');
                        }

                        zip.file(safeName, fileContent);
                    });

                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const blobUrl = URL.createObjectURL(zipBlob);
                    ChatApp.State.registerGeneratedDownloadUrl(blobUrl);

                    const blockId = `files-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
                    const fileList = params.files.map((file, index) => ChatApp.Utils.sanitizeGeneratedFilename(file.name, index)).join(', ');
                    const safeFileList = ChatApp.Utils.escapeHTML(fileList);
                    const fileCount = params.files.length;
                    return { original: originalTag, replacement: `[FILES: ${blockId}](${blobUrl}|${safeFileList}|${fileCount})` };
                } catch (error) {
                    console.error('File creation error:', error);
                    const errorMsg = error.message || 'Unknown error';
                    return { original: originalTag, replacement: `[File Creation Error: ${ChatApp.Utils.escapeHTML(errorMsg)}]` };
                }
            });
            const replacements = await Promise.all(replacementPromises);
            let processedText = rawText;
            replacements.forEach(({ original, replacement }) => { processedText = processedText.replace(original, replacement); });
            if (processedText !== rawText) {
                ChatApp.State.fileRenderCache.set(rawText, processedText);
                if (ChatApp.State.fileRenderCache.size > 200) {
                    const firstKey = ChatApp.State.fileRenderCache.keys().next().value;
                    ChatApp.State.fileRenderCache.delete(firstKey);
                }
            }
            return processedText;
        },
        completeGeneration(botMessage) {
            ChatApp.State.addMessage(botMessage);
            this.saveCurrentChat();
            ChatApp.State.setGenerating(false);
        },
        async saveCurrentChat() {
            if (ChatApp.State.currentConversation.length === 0) return;
            try {
                if (ChatApp.State.currentChatId) {
                    const chat = ChatApp.State.allConversations.find(c => c.id === ChatApp.State.currentChatId);
                    if (chat) { 
                        chat.history = ChatApp.State.currentConversation;
                        const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                        if (userMessages >= 2 && (chat.title === 'New Chat' || chat.title === 'Titled Chat' || chat.title === 'Chat')) {
                            try { chat.title = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation); } catch (error) { console.warn('Failed to update title:', error); }
                        }
                    }
                } else {
                    const userMessages = ChatApp.State.currentConversation.filter(m => m.content.role === 'user').length;
                    if (userMessages > 0) {
                        let newTitle = "New Chat";
                        try { newTitle = await ChatApp.Api.fetchTitle(ChatApp.State.currentConversation); } catch (error) { console.warn('Title generation failed, using default:', error); }
                        ChatApp.State.currentChatId = Date.now();
                        ChatApp.State.allConversations.push({ id: ChatApp.State.currentChatId, title: newTitle, history: ChatApp.State.currentConversation });
                    }
                }
                ChatApp.Store.saveAllConversations();
                ChatApp.UI.renderSidebar();
            } catch (error) { console.error('Failed to save chat:', error); ChatApp.UI.showToast('Failed to save conversation. Please try again.', 'error'); }
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
                    if (!parts) parts = [{text: msg.text || ''}]; 
                    await ChatApp.UI.renderMessage({ ...msg, content: { ...msg.content, parts: parts } });
                }
                setTimeout(() => ChatApp.UI.forceScrollToBottom(), 0);
            })();
        },
        async deleteMessage(messageId) {
            if (!messageId) return;
            if (!confirm('Delete this message?')) return;
            ChatApp.State.removeMessage(messageId);
            const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
            if (messageEl) {
                messageEl.classList.add('fade-out');
                setTimeout(() => { messageEl.remove(); ChatApp.UI.scrollToBottom(); }, 400);
            }
            await this.saveCurrentChat();
            ChatApp.UI.showToast('Message deleted.');
        },
        deleteConversation(chatId) {
            if (!chatId) return;
            if (!confirm('Delete this conversation? This action cannot be undone.')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => c.id !== chatId);
            ChatApp.Store.saveAllConversations();
            if (ChatApp.State.currentChatId === chatId) { this.startNewChat(); } else { ChatApp.UI.renderSidebar(); }
            ChatApp.UI.showToast('Conversation deleted.');
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
                        const normalizedData = ChatApp.Utils.normalizeConversations(importedData);
                        if (normalizedData.length === 0) throw new Error("No valid conversations found.");
                        if (confirm('Replace all conversations?')) {
                            ChatApp.State.allConversations = normalizedData;
                            ChatApp.Store.saveAllConversations();
                            ChatApp.Controller.startNewChat();
                            ChatApp.UI.renderSidebar();
                            ChatApp.UI.showToast('Data imported.');
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
                        const normalizedData = ChatApp.Utils.normalizeConversations(importedData);
                        if (normalizedData.length === 0) throw new Error("No valid conversations found.");
                        if (confirm('Merge conversations?')) {
                            const conversationMap = new Map(ChatApp.State.allConversations.map(c => [c.id, c]));
                            normalizedData.forEach(chat => { if (!conversationMap.has(chat.id)) conversationMap.set(chat.id, chat); });
                            ChatApp.State.allConversations = Array.from(conversationMap.values());
                            ChatApp.Store.saveAllConversations();
                            ChatApp.UI.renderSidebar();
                            ChatApp.UI.showToast('Data merged.');
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
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS);
                ChatApp.State.allConversations = [];
                ChatApp.State.currentConversation = [];
                ChatApp.State.currentChatId = null;
                ChatApp.State.providerSettings = {};
                ChatApp.State.revokeGeneratedDownloadUrls();
                ChatApp.UI.clearChatArea();
                ChatApp.UI.renderSidebar();
                ChatApp.UI.showToast('All data deleted.');
            }
        },
        handleMessageAreaClick(event) {
            const toggleBtn = event.target.closest('.collapse-toggle-button');
            if (toggleBtn) { const wrapper = toggleBtn.closest('.code-block-wrapper'); if (wrapper) wrapper.classList.toggle('is-collapsed'); return; }
            
            // Handle Agent Process Toggle
            const agentHeader = event.target.closest('.agent-process-header');
            if (agentHeader) {
                const wrapper = agentHeader.closest('.agent-process-container');
                if (wrapper) wrapper.classList.toggle('collapsed');
                return;
            }

            const mediaTarget = event.target.closest('.attachment-media, .svg-render-box img');
            const htmlBox = event.target.closest('.html-render-box');
            if (mediaTarget) {
                event.preventDefault();
                if (mediaTarget.tagName === 'VIDEO') ChatApp.UI.showFullscreenPreview(mediaTarget.src, 'video');
                if (mediaTarget.tagName === 'IMG') ChatApp.UI.showFullscreenPreview(mediaTarget.src, 'image');
            } 
            else if (htmlBox) { const iframe = htmlBox.querySelector('iframe'); if (iframe) ChatApp.UI.showFullscreenPreview(iframe.srcdoc, 'html'); }
            else { const svgWrapper = event.target.closest('.svg-preview-container'); if (svgWrapper) { const rawContent = svgWrapper.querySelector('.code-block-wrapper')?.dataset.rawContent; if (rawContent) ChatApp.UI.showFullscreenPreview(decodeURIComponent(rawContent), 'svg'); } }
        },
        closeFullscreenPreview() {
            const { fullscreenOverlay, fullscreenContent, body } = ChatApp.UI.elements;
            fullscreenOverlay.style.display = 'none';
            fullscreenContent.innerHTML = '';
            body.classList.remove('modal-open');
        },
        initOfflineDetection() {
            const updateOnlineStatus = () => {
                if (!navigator.onLine) { ChatApp.UI.showToast('You are offline. Some features may not work.', 'error'); document.body.classList.add('offline'); } 
                else { document.body.classList.remove('offline'); }
            };
            window.addEventListener('online', () => { ChatApp.UI.showToast('Connection restored.', 'info'); updateOnlineStatus(); });
            window.addEventListener('offline', () => { ChatApp.UI.showToast('Connection lost. Please check your internet.', 'error'); updateOnlineStatus(); });
            updateOnlineStatus();
        },
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChatApp.Controller.init();
});

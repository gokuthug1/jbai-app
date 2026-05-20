import { MessageFormatter } from './formatter.js';
import { SyntaxHighlighter } from './syntaxHighlighter.js';

const isLocalBrowserContext = () => {
    const { protocol, hostname } = window.location;
    if (protocol === 'file:') return true;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
};

const getDefaultJbAiBaseUrl = () => {
    if (isLocalBrowserContext()) return 'http://localhost:8000';
    return window.location.origin;
};

const JBAI_REMOTE_PLACEHOLDER = 'https://your-jbai-backend.example.com';

const BUILTIN_PROMPT_PRESETS = [];

const ChatApp = {
    Config: {
        PROVIDERS: {
            JBAI: 'jbai',
            GOOGLE: 'google',
            OPENAI: 'openai',
            ANTHROPIC: 'anthropic',
            GROQ: 'groq',
            DEEPSEEK: 'deepseek'
        },
        API_ENDPOINTS: {
            GOOGLE_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
            OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
            ANTHROPIC_MESSAGES: 'https://api.anthropic.com/v1/messages',
            GROQ_CHAT: 'https://api.groq.com/openai/v1/chat/completions',
            DEEPSEEK_CHAT: 'https://api.deepseek.com/v1/chat/completions',
            JBAI_HEALTH_PATH: '/healthz',
            JBAI_OPENAPI_PATH: '/openapi.json',
            JBAI_SEARCH_PATH: '/v1/web-search',
            JBAI_SEARCH_STREAM_PATH: '/v1/web-search/stream',
            JBAI_SKILLS_PATH: '/v1/skills/catalog'
        },
        STORAGE_KEYS: {
            THEME: 'jbai_theme',
            CONVERSATIONS: 'jbai_conversations',
            TOOLS: 'jbai_tools_config',
            PROVIDER_SETTINGS: 'jbai_provider_settings',
            JBAI_BACKEND_CONFIRMATION: 'jbai_backend_url_confirmed',
            CUSTOM_PRESETS: 'jbai_custom_presets'
        },
        JBAI_BACKEND_STATES: {
            UNKNOWN: 'unknown',
            CHECKING: 'checking',
            MISSING: 'missing',
            UNAVAILABLE: 'unavailable',
            API_MISSING: 'api-missing',
            CONNECTED: 'connected'
        },
        DEFAULT_THEME: 'light',
        DEFAULT_PROVIDER_SETTINGS: {
            provider: 'jbai',
            baseUrls: {
                jbai: getDefaultJbAiBaseUrl()
            },
            models: {
                google: 'gemini-2.5-flash',
                openai: 'gpt-4.1-mini',
                anthropic: 'claude-3-5-haiku-latest',
                groq: 'llama-3.3-70b-versatile',
                deepseek: 'deepseek-chat'
            },
            apiKeys: {
                google: '',
                openai: '',
                anthropic: '',
                groq: '',
                deepseek: ''
            }
        },
        PROMPT_LIBRARY_DEFAULT_CATEGORY: 'All',
        BUILTIN_PROMPT_PRESETS,
        DEFAULT_TOOLS: {
            googleSearch: false,
            codeExecution: false,
            agentMode: false,
            autoRunPreviews: true,
            hideScrollbar: false
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
    DB: {
        dbName: 'JBAI_Database',
        storeName: 'conversations',
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => { this.db = request.result; resolve(); };
                request.onerror = () => reject(request.error);
            });
        },
        async saveConversations(accountId, conversations) {
            if (!this.db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const req = store.put({ id: accountId, data: conversations });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        },
        async getConversations(accountId) {
            if (!this.db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.get(accountId);
                req.onsuccess = () => resolve(req.result ? req.result.data : null);
                req.onerror = () => reject(req.error);
            });
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
        jbAiBackend: {
            status: 'unknown',
            title: 'Not checked yet',
            message: 'Check the J.B.A.I backend connection before sending a search request.',
            baseUrl: '',
            checkedAt: 0,
            detail: ''
        },
        skillCatalog: {
            status: 'idle',
            items: [],
            baseUrl: '',
            error: ''
        },
        promptLibrary: {
            category: 'All'
        },
        customPresets: [],
        activeSkill: null,
        activeCommand: null,
        activeTab: 'chats',
        folders: [],
        profiles: [],
        activeProfileId: 'default',
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
            this.activeSkill = null;
            this.activeCommand = null;
            ChatApp.UI.renderActiveCommandPill();
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
        deriveChatTitle(text) {
            const sanitized = this.sanitizeTextForApi(text || '')
                .replace(/[`*_#>\[\](){}]/g, ' ')
                .replace(/[^\w\s-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (!sanitized) return 'New Chat';

            const words = sanitized
                .split(' ')
                .filter(Boolean)
                .slice(0, 4)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

            return words.join(' ').substring(0, 50) || 'Chat';
        },
        isLocalBrowserContext() {
            return isLocalBrowserContext();
        },
        normalizeJbAiBaseUrl(value) {
            const raw = String(value || '').trim();
            if (!raw) return '';

            const candidate = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
            try {
                const parsed = new URL(candidate);
                if (!['http:', 'https:'].includes(parsed.protocol)) return raw;
                const path = parsed.pathname.replace(/\/$/, '');
                const normalizedPath = path === '/' ? '' : path;
                return `${parsed.origin}${normalizedPath}`;
            } catch {
                return raw.replace(/\/$/, '');
            }
        },
        getRemoteJbAiPlaceholder() {
            return this.isLocalBrowserContext() ? getDefaultJbAiBaseUrl() : JBAI_REMOTE_PLACEHOLDER;
        },
        getJbAiConfirmationValue() {
            return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.JBAI_BACKEND_CONFIRMATION) || '';
        },
        setJbAiConfirmationValue(baseUrl) {
            const normalized = this.normalizeJbAiBaseUrl(baseUrl);
            if (!normalized) {
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.JBAI_BACKEND_CONFIRMATION);
                return;
            }
            localStorage.setItem(ChatApp.Config.STORAGE_KEYS.JBAI_BACKEND_CONFIRMATION, normalized);
        },
        shouldMigrateLegacyJbAiOrigin(baseUrl) {
            if (this.isLocalBrowserContext()) return false;
            const normalized = this.normalizeJbAiBaseUrl(baseUrl);
            if (!normalized) return false;
            const origin = this.normalizeJbAiBaseUrl(window.location.origin);
            if (normalized !== origin) return false;
            return this.getJbAiConfirmationValue() !== normalized;
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

            const searchMetadata = message?.searchMetadata;
            if (searchMetadata && typeof searchMetadata === 'object') {
                normalized.searchMetadata = searchMetadata;
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
        normalizeProviderSettings(settings) {
            const defaultSettings = ChatApp.Config.DEFAULT_PROVIDER_SETTINGS;
            const provider = Object.values(ChatApp.Config.PROVIDERS).includes(settings?.provider)
                ? settings.provider
                : defaultSettings.provider;

            const merged = {
                provider,
                baseUrls: {
                    ...defaultSettings.baseUrls,
                    ...(settings?.baseUrls || {})
                },
                models: {
                    ...defaultSettings.models,
                    ...(settings?.models || {})
                },
                apiKeys: {
                    ...defaultSettings.apiKeys,
                    ...(settings?.apiKeys || {})
                }
            };

            merged.baseUrls.jbai = ChatApp.Utils.normalizeJbAiBaseUrl(merged.baseUrls?.jbai);

            // On a deployed (non-local) host, auto-confirm the origin as the backend URL
            // so the legacy migration guard does not wipe it on first load.
            if (!ChatApp.Utils.isLocalBrowserContext()) {
                const origin = ChatApp.Utils.normalizeJbAiBaseUrl(window.location.origin);
                if (!merged.baseUrls.jbai) {
                    merged.baseUrls.jbai = origin;
                }
                if (merged.baseUrls.jbai === origin && ChatApp.Utils.getJbAiConfirmationValue() !== origin) {
                    ChatApp.Utils.setJbAiConfirmationValue(origin);
                }
            }

            if (ChatApp.Utils.shouldMigrateLegacyJbAiOrigin(merged.baseUrls.jbai)) {
                merged.baseUrls.jbai = '';
            }

            return merged;
        },
        getProfileKey(key) {
            const accountId = ChatApp.State.activeAccountId || 'default';
            if (key === ChatApp.Config.STORAGE_KEYS.THEME) return key; // Theme remains global
            return `${accountId}_${key}`;
        },
        async saveAllConversations() { 
            // Save to local storage without attachments to act as a lightweight backup
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
                localStorage.setItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS), JSON.stringify(leanConversations));
            } catch (e) {
                console.warn("Storage limit reached for lightweight history", e);
            }
            
            // Save to IndexedDB with full attachments and base64 images
            const accountId = ChatApp.State.activeAccountId || 'default';
            try {
                await ChatApp.DB.saveConversations(accountId, ChatApp.State.allConversations);
            } catch(e) {
                console.error("Failed to save to IndexedDB", e);
            }
        },
        saveCustomPresets(presets) {
            localStorage.setItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.CUSTOM_PRESETS), JSON.stringify(presets));
            ChatApp.State.customPresets = presets;
        },
        loadCustomPresets() {
            try {
                const stored = localStorage.getItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.CUSTOM_PRESETS));
                ChatApp.State.customPresets = stored ? JSON.parse(stored) : [];
            } catch (e) {
                ChatApp.State.customPresets = [];
            }
        },
        async loadAllConversations() {
            const accountId = ChatApp.State.activeAccountId || 'default';
            try {
                let parsed = await ChatApp.DB.getConversations(accountId);
                
                // If IndexedDB is empty, fallback to LocalStorage Migration
                if (!parsed || parsed.length === 0) {
                    const stored = localStorage.getItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.CONVERSATIONS));
                    parsed = stored ? JSON.parse(stored) : [];
                    if (parsed.length > 0) {
                        await ChatApp.DB.saveConversations(accountId, parsed);
                    }
                }
                
                ChatApp.State.allConversations = ChatApp.Utils.normalizeConversations(parsed || []);
            } catch (e) {
                console.error("Failed to load conversations from IndexedDB", e);
                ChatApp.State.allConversations = [];

            }
        },
        saveTheme(themeName) { localStorage.setItem(ChatApp.Config.STORAGE_KEYS.THEME, themeName); },
        getTheme() { return localStorage.getItem(ChatApp.Config.STORAGE_KEYS.THEME) || ChatApp.Config.DEFAULT_THEME; },
        saveProviderSettings(settings) {
            const sanitized = this.normalizeProviderSettings(settings);

            ChatApp.Utils.setJbAiConfirmationValue(sanitized.baseUrls?.jbai);

            localStorage.setItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS), JSON.stringify(sanitized));
            ChatApp.State.providerSettings = sanitized;
            return sanitized;
        },
        getProviderSettings() {
            try {
                const stored = localStorage.getItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS));
                const parsed = stored ? JSON.parse(stored) : {};
                const merged = this.normalizeProviderSettings(parsed);
                ChatApp.State.providerSettings = merged;
                if (JSON.stringify(parsed) !== JSON.stringify(merged)) {
                    localStorage.setItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.PROVIDER_SETTINGS), JSON.stringify(merged));
                }
                return merged;
            } catch (error) {
                const fallback = this.normalizeProviderSettings(ChatApp.Config.DEFAULT_PROVIDER_SETTINGS);
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
                baseUrl: String(settings?.baseUrls?.[provider] || '').trim(),
                model: String(settings?.models?.[provider] || '').trim(),
                apiKey: String(settings?.apiKeys?.[provider] || '').trim()
            };
        },
        saveToolsConfig(config) { 
            localStorage.setItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.TOOLS), JSON.stringify(config)); 
            ChatApp.State.toolsConfig = config;
        },
        getToolsConfig() {
            try {
                const stored = localStorage.getItem(this.getProfileKey(ChatApp.Config.STORAGE_KEYS.TOOLS));
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

    Accounts: {
        async init() {
            try {
                // Auto-login as default user (no auth overlay)
                ChatApp.State.activeAccountId = 'default';
                ChatApp.State.accounts = [{ id: 'default', username: 'User', pfp: null, themeColor: '#4f46e5' }];
                
                ChatApp.UI.applyTheme(ChatApp.Store.getTheme());
                await ChatApp.Store.loadAllConversations();
                ChatApp.Store.loadCustomPresets();
                ChatApp.Store.getProviderSettings();
                ChatApp.Store.getToolsConfig();
                ChatApp.Folders.loadFolders();
                ChatApp.State.resetCurrentChat();
                ChatApp.UI.renderSidebar();
                ChatApp.UI.renderProfileWidget();
                
                ChatApp.UI.toggleSendButtonState();
                ChatApp.UI.renderConversationSurface();
                ChatApp.Controller.applyDisplaySettings();
                ChatApp.Controller.markJbAiBackendStatusUnknown(ChatApp.Store.getProviderSettings().baseUrls?.jbai || '');
                void ChatApp.Controller.refreshJbAiBackendStatus({ force: false, silent: true });
            } catch (e) {
                console.error("Failed to initialize:", e);
            }
        },
        getActiveAccount() {
            return ChatApp.State.accounts.find(a => a.id === ChatApp.State.activeAccountId) || { id: 'default', username: 'User', pfp: null, themeColor: '#4f46e5' };
        }
    },

    Folders: {
        loadFolders() {
            const key = ChatApp.Store.getProfileKey('jbai_folders');
            try {
                const stored = localStorage.getItem(key);
                ChatApp.State.folders = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Failed to load folders:", e);
                ChatApp.State.folders = [];
            }
        },
        saveFolders() {
            const key = ChatApp.Store.getProfileKey('jbai_folders');
            try {
                localStorage.setItem(key, JSON.stringify(ChatApp.State.folders));
            } catch (e) {
                console.error("Failed to save folders:", e);
            }
        },
        createFolder(name) {
            const id = 'f_' + Date.now();
            const newFolder = { id, name };
            ChatApp.State.folders.push(newFolder);
            this.saveFolders();
            ChatApp.UI.renderSidebar();
            return newFolder;
        },
        renameFolder(id, newName) {
            const folder = ChatApp.State.folders.find(f => f.id === id);
            if (folder) {
                folder.name = newName;
                this.saveFolders();
                ChatApp.UI.renderSidebar();
            }
        },
        deleteFolder(id) {
            ChatApp.State.folders = ChatApp.State.folders.filter(f => String(f.id) !== String(id));
            this.saveFolders();
            
            ChatApp.State.allConversations.forEach(chat => {
                if (chat.folderId && String(chat.folderId) === String(id)) {
                    chat.folderId = null;
                }
            });
            ChatApp.Store.saveAllConversations();
            ChatApp.UI.renderSidebar();
        },
        moveChatToFolder(chatId, folderId) {
            const chat = ChatApp.State.allConversations.find(c => String(c.id) === String(chatId));
            if (chat) {
                chat.folderId = folderId ? String(folderId) : null;
                ChatApp.Store.saveAllConversations();
                ChatApp.UI.renderSidebar();
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
                promptLauncherButton: document.getElementById('prompt-launcher-button'),
                attachFileButton: document.getElementById('attach-file-button'),
                fileInput: document.getElementById('file-input'),
                filePreviewsContainer: document.getElementById('file-previews-container'),
                fullscreenOverlay: document.getElementById('fullscreen-preview-overlay'),
                fullscreenContent: document.getElementById('fullscreen-content'),
                fullscreenCloseBtn: document.getElementById('fullscreen-close-btn'),
                customTooltip: document.getElementById('custom-tooltip'),
                activeSkillContainer: document.getElementById('active-skill-container'),
                activeSkillName: document.getElementById('active-skill-name'),
                clearSkillBtn: document.getElementById('clear-skill-btn'),
                chatInputPillContainer: document.getElementById('chat-input-pill-container'),
                
                // Remastered features elements
                tabChats: document.getElementById('tab-chats'),
                tabMyStuff: document.getElementById('tab-mystuff'),
                sidebarChatsContainer: document.getElementById('sidebar-chats-container'),
                sidebarMyStuffContainer: document.getElementById('sidebar-mystuff-container'),
                myStuffContainer: document.getElementById('my-stuff-container'),
                chatContainer: document.querySelector('.chat-container'),
                
                profileWidget: document.getElementById('profile-widget'),
                profileAvatar: document.getElementById('profile-avatar'),
                profileName: document.getElementById('profile-display-name'),
                
                splitCanvasPanel: document.getElementById('split-canvas-panel'),
                canvasCloseBtn: document.getElementById('canvas-close-btn'),
                canvasCodeTextarea: document.getElementById('canvas-code-textarea'),
                canvasPreviewIframe: document.getElementById('canvas-preview-iframe'),
                profileName: document.getElementById('profile-name')
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
            let activeTooltipTarget = null;
            const tooltip = this.elements.customTooltip;
            if (!tooltip) return;
            const showTooltip = (target) => {
                if (!target || !document.body.contains(target)) return;
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
                activeTooltipTarget = target;
            };
            const hideTooltipFn = () => {
                clearTimeout(tooltipTimeout);
                activeTooltipTarget = null;
                this.hideTooltip();
            };
            document.body.addEventListener('mouseover', (e) => {
                const target = e.target.closest('[data-tooltip]');
                if (target) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = setTimeout(() => showTooltip(target), 300);
                } else {
                    hideTooltipFn();
                }
            });
            document.body.addEventListener('mouseout', (e) => {
                const target = e.target.closest('[data-tooltip]');
                const related = e.relatedTarget;
                if (target) {
                    // Only hide if we're truly leaving the tooltip target
                    if (!related || !target.contains(related)) {
                        hideTooltipFn();
                    }
                }
            });
            // Hide tooltip on any click or mousedown
            document.addEventListener('mousedown', () => hideTooltipFn(), { capture: true });
            document.addEventListener('click', () => hideTooltipFn(), { capture: true });
            document.addEventListener('dragstart', () => hideTooltipFn(), { capture: true });
            document.addEventListener('scroll', () => hideTooltipFn(), { capture: true, passive: true });
            // Hide tooltip when window loses focus or cursor leaves the page
            window.addEventListener('blur', () => hideTooltipFn());
            window.addEventListener('mouseleave', () => hideTooltipFn());

            // MutationObserver to automatically hide tooltip if target is removed from DOM
            const observer = new MutationObserver(() => {
                if (activeTooltipTarget && !activeTooltipTarget.isConnected) {
                    hideTooltipFn();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
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
            this.renderConversationSurface();
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
            const isCheckingJbAi = ChatApp.Store.getActiveProviderSettings().provider === ChatApp.Config.PROVIDERS.JBAI
                && ChatApp.State.jbAiBackend.status === ChatApp.Config.JBAI_BACKEND_STATES.CHECKING;
            this.elements.sendButton.disabled = (!hasText && !hasFiles) || isGenerating || isCheckingJbAi;
            this.elements.sendButton.style.display = isGenerating ? 'none' : 'flex';
        },
        toggleStopButton(isGenerating) {
            this.elements.stopButton.style.display = isGenerating ? 'flex' : 'none';
        },
        initSlashAutocomplete() {
            const inputContainer = document.querySelector('.chat-input-container');
            if (!inputContainer) return;

            // Create container
            const container = document.createElement('div');
            container.className = 'slash-autocomplete-container';
            inputContainer.appendChild(container);
            this.elements.slashAutocompleteContainer = container;

            ChatApp.State.autocompleteSelectedIndex = 0;
            ChatApp.State.autocompleteFilteredItems = [];
            ChatApp.State.autocompleteIsOpen = false;

            const chatInput = this.elements.chatInput;
            if (!chatInput) return;

            // Handle Input / Typing
            chatInput.addEventListener('input', () => {
                const text = chatInput.value;
                if (text.startsWith('/') && !text.includes(' ')) {
                    this.renderAutocompleteDropdown(text);
                } else {
                    this.hideAutocompleteDropdown();
                }
            });

            // Handle keydown for navigation and badge deletion
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && chatInput.value === '') {
                    if (ChatApp.State.activeSkill || ChatApp.State.activeCommand) {
                        e.preventDefault();
                        ChatApp.State.activeSkill = null;
                        ChatApp.State.activeCommand = null;
                        this.renderActiveCommandPill();
                        this.showToast('Pill cleared');
                        return;
                    }
                }

                if (!ChatApp.State.autocompleteIsOpen) return;

                const items = ChatApp.State.autocompleteFilteredItems;
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    ChatApp.State.autocompleteSelectedIndex = (ChatApp.State.autocompleteSelectedIndex + 1) % items.length;
                    this.updateAutocompleteSelection();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    ChatApp.State.autocompleteSelectedIndex = (ChatApp.State.autocompleteSelectedIndex - 1 + items.length) % items.length;
                    this.updateAutocompleteSelection();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.selectAutocompleteItem(items[ChatApp.State.autocompleteSelectedIndex]);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hideAutocompleteDropdown();
                }
            }, true); // Use capture to intercept Enter before it submits the chat

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (ChatApp.State.autocompleteIsOpen && !inputContainer.contains(e.target)) {
                    this.hideAutocompleteDropdown();
                }
            });
        },

        renderAutocompleteDropdown(text) {
            const container = this.elements.slashAutocompleteContainer;
            if (!container) return;

            const query = text.toLowerCase();
            const allItems = this.getAutocompleteItems();
            
            const filtered = allItems.filter(item => {
                return item.name.toLowerCase().includes(query) || 
                       item.title.toLowerCase().includes(query);
            });

            ChatApp.State.autocompleteFilteredItems = filtered;

            if (filtered.length === 0) {
                this.hideAutocompleteDropdown();
                return;
            }

            if (ChatApp.State.autocompleteSelectedIndex >= filtered.length) {
                ChatApp.State.autocompleteSelectedIndex = 0;
            }

            container.innerHTML = '';

            const listEl = document.createElement('div');
            listEl.className = 'slash-autocomplete-list';

            const detailsCardEl = document.createElement('div');
            detailsCardEl.className = 'slash-autocomplete-details-card';

            filtered.forEach((item, index) => {
                const itemEl = document.createElement('button');
                itemEl.type = 'button';
                itemEl.className = 'slash-autocomplete-item';
                if (index === ChatApp.State.autocompleteSelectedIndex) {
                    itemEl.classList.add('is-selected');
                }

                const firstChar = item.title.replace(/^\//, '').charAt(0).toUpperCase();

                itemEl.innerHTML = `
                    <div class="slash-autocomplete-icon">${firstChar}</div>
                    <div class="slash-autocomplete-details">
                        <div class="slash-autocomplete-name">${item.title}</div>
                        <div class="slash-autocomplete-desc">${item.description}</div>
                    </div>
                    <span class="slash-autocomplete-badge">${item.badge}</span>
                `;

                itemEl.addEventListener('mouseover', () => {
                    ChatApp.State.autocompleteSelectedIndex = index;
                    this.updateAutocompleteSelection();
                });

                itemEl.addEventListener('click', () => {
                    this.selectAutocompleteItem(item);
                });

                listEl.appendChild(itemEl);
            });

            container.appendChild(listEl);
            container.appendChild(detailsCardEl);

            container.style.display = 'flex';
            ChatApp.State.autocompleteIsOpen = true;
            
            this.updateAutocompleteSelection();
        },

        updateAutocompleteSelection() {
            const container = this.elements.slashAutocompleteContainer;
            if (!container) return;

            const items = container.querySelectorAll('.slash-autocomplete-item');
            const detailsCard = container.querySelector('.slash-autocomplete-details-card');
            
            const filtered = ChatApp.State.autocompleteFilteredItems;
            const selectedItem = filtered[ChatApp.State.autocompleteSelectedIndex];

            items.forEach((itemEl, index) => {
                if (index === ChatApp.State.autocompleteSelectedIndex) {
                    itemEl.classList.add('is-selected');
                    itemEl.scrollIntoView({ block: 'nearest' });
                } else {
                    itemEl.classList.remove('is-selected');
                }
            });

            if (detailsCard && selectedItem) {
                const titleText = selectedItem.title || selectedItem.name;
                const descText = selectedItem.description || 'Activate this skill/command.';
                const badgeText = selectedItem.badge || 'Item';
                
                detailsCard.innerHTML = `
                    <div class="slash-autocomplete-details-header">
                        <div class="slash-autocomplete-details-title">${titleText}</div>
                        <span class="slash-autocomplete-details-badge">${badgeText}</span>
                    </div>
                    <div class="slash-autocomplete-details-desc">${descText}</div>
                `;
            }
        },

        selectAutocompleteItem(item) {
            if (item.type === 'skill') {
                ChatApp.State.activeSkill = item.data;
                ChatApp.State.activeCommand = null;
                this.renderActiveCommandPill();
                this.setChatInputValue('');
                this.showToast(`Skill activated: ${item.title}`);
            } else if (item.type === 'command') {
                if (item.name === '/image') {
                    ChatApp.State.activeCommand = '/image';
                    ChatApp.State.activeSkill = null;
                    this.renderActiveCommandPill();
                    this.setChatInputValue('');
                } else if (item.name === '/clear' || item.name === '/help' || item.name === '/skills') {
                    ChatApp.State.activeCommand = item.name;
                    ChatApp.State.activeSkill = null;
                    this.renderActiveCommandPill();
                    this.setChatInputValue('');
                } else {
                    this.setChatInputValue(item.name);
                }
            }
            this.hideAutocompleteDropdown();
        },

        renderActiveCommandPill() {
            const container = this.elements.chatInputPillContainer;
            if (!container) return;

            const activeSkill = ChatApp.State.activeSkill;
            const activeCommand = ChatApp.State.activeCommand;

            if (activeSkill) {
                container.innerHTML = `
                    <div class="chat-command-pill">
                        /${activeSkill.id}
                        <button class="chat-input-pill-close" type="button" aria-label="Clear skill">&times;</button>
                    </div>
                `;
                container.style.display = 'flex';
                if (this.elements.chatInput) {
                    this.elements.chatInput.placeholder = "Type instructions...";
                }
                
                const clearBtn = container.querySelector('.chat-input-pill-close');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        ChatApp.State.activeSkill = null;
                        this.renderActiveCommandPill();
                        this.showToast('Active skill cleared');
                    });
                }
            } else if (activeCommand) {
                container.innerHTML = `
                    <div class="chat-command-pill">
                        ${activeCommand}
                        <button class="chat-input-pill-close" type="button" aria-label="Clear command">&times;</button>
                    </div>
                `;
                container.style.display = 'flex';
                if (this.elements.chatInput) {
                    this.elements.chatInput.placeholder = "Type prompt details...";
                }
                
                const clearBtn = container.querySelector('.chat-input-pill-close');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        ChatApp.State.activeCommand = null;
                        this.renderActiveCommandPill();
                        this.showToast('Active command cleared');
                    });
                }
            } else {
                container.innerHTML = '';
                container.style.display = 'none';
                if (this.elements.chatInput) {
                    this.elements.chatInput.placeholder = "Type your message...";
                }
            }
            
            if (this.elements.chatInput) {
                this.elements.chatInput.dispatchEvent(new Event('input'));
            }
        },

        hideAutocompleteDropdown() {
            const container = this.elements.slashAutocompleteContainer;
            if (container) {
                container.style.display = 'none';
            }
            ChatApp.State.autocompleteIsOpen = false;
        },

        getAutocompleteItems() {
            const items = [];
            
            const skills = ChatApp.State.skillCatalog?.items || [];
            skills.forEach(skill => {
                items.push({
                    id: skill.id,
                    name: skill.id.startsWith('/') ? skill.id : '/' + skill.id,
                    title: skill.title || skill.name || skill.id,
                    description: skill.description || 'Activate this skill',
                    badge: 'Skill',
                    type: 'skill',
                    data: skill
                });
            });

            const customCommands = [
                { name: '/image', description: 'Generate an AI image from a text prompt. Usage: /image <prompt>' },
                { name: '/clear', description: 'Clear all conversation history and start a new chat.' },
                { name: '/help', description: 'Show all available J.B.A.I slash commands.' },
                { name: '/skills', description: 'List all custom skills currently loaded in the J.B.A.I catalog.' },
                { name: '/html', description: 'Give a random HTML code that\'s interesting and fun.' },
                { name: '/profile', description: 'List all custom commands and explain what each does.' },
                { name: '/concept', description: 'Ask what concept the user wants to create.' },
                { name: '/song', description: 'Ask about the user\'s music taste, then recommend a song.' },
                { name: '/word', description: 'Give a new word and its definition.' },
                { name: '/tip', description: 'Share a useful lifehack or tip.' },
                { name: '/invention', description: 'Generate a fictional, interesting invention idea.' },
                { name: '/sp', description: 'Correct any text the user sends for spelling and grammar.' },
                { name: '/art', description: 'Suggest a prompt or idea for a creative art project.' },
                { name: '/bdw', description: 'Break down a word: pronunciation, definition, and more.' }
            ];
            customCommands.forEach(cmd => {
                items.push({
                    id: cmd.name,
                    name: cmd.name,
                    title: cmd.name,
                    description: cmd.description,
                    badge: 'Command',
                    type: 'command'
                });
            });

            return items;
        },
        setChatInputValue(value) {
            this.elements.chatInput.value = value || '';
            this.elements.chatInput.dispatchEvent(new Event('input'));
            this.focusChatInput();
            const end = this.elements.chatInput.value.length;
            this.elements.chatInput.setSelectionRange(end, end);
        },
        focusChatInput() {
            this.elements.chatInput.focus();
        },
        getJbAiStatusPresentation(statusData = ChatApp.State.jbAiBackend) {
            const status = statusData?.status || ChatApp.Config.JBAI_BACKEND_STATES.UNKNOWN;
            const baseUrl = statusData?.baseUrl ? `Backend URL: ${statusData.baseUrl}` : '';
            const detail = statusData?.detail ? String(statusData.detail).trim() : '';

            switch (status) {
                case ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED:
                    return {
                        status,
                        label: 'Connected',
                        title: 'J.B.A.I backend connected',
                        message: 'Search mode is ready to search the web, read sources, and load shared skill cards.',
                        meta: baseUrl || 'Backend URL confirmed.'
                    };
                case ChatApp.Config.JBAI_BACKEND_STATES.CHECKING:
                    return {
                        status,
                        label: 'Checking connection',
                        title: 'Checking J.B.A.I backend',
                        message: 'Validating the backend URL and required J.B.A.I routes.',
                        meta: baseUrl || 'Using the configured backend URL.'
                    };
                case ChatApp.Config.JBAI_BACKEND_STATES.MISSING:
                    return {
                        status,
                        label: 'Missing backend URL',
                        title: 'J.B.A.I needs a backend URL',
                        message: 'Add the backend URL in Settings before using the official web search mode.',
                        meta: 'Use http://localhost:8000 for local development or your deployed backend URL.'
                    };
                case ChatApp.Config.JBAI_BACKEND_STATES.API_MISSING:
                    return {
                        status,
                        label: 'J.B.A.I API missing',
                        title: 'Backend responded but J.B.A.I API is missing',
                        message: 'This server responded, but it does not expose the J.B.A.I search endpoints.',
                        meta: detail || baseUrl || 'Verify you pointed Settings at the FastAPI backend.'
                    };
                case ChatApp.Config.JBAI_BACKEND_STATES.UNAVAILABLE:
                    return {
                        status,
                        label: 'Backend unavailable',
                        title: 'J.B.A.I backend is unreachable',
                        message: 'Start the backend service or fix the configured URL before sending search requests.',
                        meta: detail || baseUrl || 'No reachable backend found.'
                    };
                default:
                    return {
                        status: ChatApp.Config.JBAI_BACKEND_STATES.UNKNOWN,
                        label: 'Not checked yet',
                        title: 'J.B.A.I backend not checked yet',
                        message: 'We will verify the backend when you select J.B.A.I, change the URL, or send your first request.',
                        meta: baseUrl || 'Configure a backend URL in Settings.'
                    };
            }
        },
        renderConversationSurface() {
            const area = this.elements.messageArea;
            if (!area) return;

            const hasMessages = ChatApp.State.currentConversation.length > 0;
            area.classList.toggle('message-area-home', !hasMessages);
            if (hasMessages) return;

            // Leave the home screen completely empty per user request.
            area.innerHTML = '';
        },
        refreshPromptLibraryModal() {
            const modalBody = document.querySelector('[data-prompt-library-body="true"]');
            if (!modalBody) return;
            this.populatePromptLibrary(modalBody, { mode: 'modal' });
        },
        populatePromptLibrary(container, { mode = 'home' } = {}) {
            if (!container) return;

            const items = ChatApp.Controller.getPromptCatalogItems();
            const categories = ChatApp.Controller.getVisiblePromptCategories(items);
            const activeCategory = ChatApp.Controller.getActivePromptCategory(categories);
            const filteredItems = activeCategory === ChatApp.Config.PROMPT_LIBRARY_DEFAULT_CATEGORY
                ? items
                : items.filter((item) => item.category === activeCategory);
            const skillCatalogState = ChatApp.State.skillCatalog;
            const provider = ChatApp.Store.getActiveProviderSettings().provider;
            const showStatusCard = false;
            const statusPresentation = {};
            const statusCardMarkup = '';
            const skillStatusNote = '';

            const headerMarkup = mode === 'home'
                ? `<div class="prompt-home-hero"><div class="prompt-home-copy"><h1>My Prompts</h1></div></div>`
                : `<div class="prompt-library-header"><div class="prompt-library-copy"><h2 id="prompt-library-title">My Prompts</h2></div></div>`;

            const categoryChips = categories.map((category) => `
                <button
                    type="button"
                    class="prompt-category-chip ${category === activeCategory ? 'is-active' : ''}"
                    data-prompt-category="${ChatApp.Utils.escapeHTML(category)}"
                >${ChatApp.Utils.escapeHTML(category)}</button>
            `).join('');

            const cards = filteredItems.map((item) => `
                <div style="position: relative; display: flex; flex-direction: column;">
                    <button
                        type="button"
                        class="prompt-card"
                        data-prompt-id="${ChatApp.Utils.escapeHTML(item.id)}"
                        style="flex: 1;"
                    >
                        <div class="prompt-card-header">
                            <h3 class="prompt-card-title">${ChatApp.Utils.escapeHTML(item.title)}</h3>
                        </div>
                        <p class="prompt-card-description">${ChatApp.Utils.escapeHTML(item.description)}</p>
                        <div class="prompt-card-footer">
                            <span class="prompt-badge" data-kind="${ChatApp.Utils.escapeHTML(item.kind)}">${item.kind === 'skill' ? 'Skill' : (item.kind === 'custom' ? 'Custom' : 'Preset')}</span>
                            ${item.providerHint ? `<span class="prompt-badge">${ChatApp.Utils.escapeHTML(item.providerHint)}</span>` : ''}
                        </div>
                    </button>
                    ${item.kind === 'custom' ? `<button type="button" class="delete-custom-preset-btn" data-preset-id="${ChatApp.Utils.escapeHTML(item.id)}" style="position: absolute; top: 12px; right: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; display: flex; padding: 4px; z-index: 2;" title="Delete Custom Preset" onmouseover="this.style.color='var(--error-color)'" onmouseout="this.style.color='var(--text-secondary)'">${ChatApp.Config.ICONS.DELETE}</button>` : ''}
                </div>
            `).join('');

            const customPresetsMarkup = `
                <div class="custom-preset-form-container" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 12px; font-size: 1rem;">Create Custom Preset</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <input type="text" id="custom-preset-title" placeholder="Title (e.g. Code Review)" class="chat-input" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-primary);">
                        <input type="text" id="custom-preset-desc" placeholder="Description" class="chat-input" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-primary);">
                        <input type="text" id="custom-preset-category" placeholder="Category (e.g. Writing)" class="chat-input" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-primary);">
                        <textarea id="custom-preset-template" placeholder="Prompt Template" class="chat-input" rows="3" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-primary); resize: vertical;"></textarea>
                        <button type="button" id="save-custom-preset-btn" class="btn-primary" style="align-self: flex-start; padding: 8px 16px;">Save Custom Preset</button>
                    </div>
                </div>
            `;

            container.innerHTML = `
                ${headerMarkup}
                <div class="prompt-library-content">
                    <div class="prompt-category-row">${categoryChips}</div>
                    ${filteredItems.length > 0 ? `<div class="prompt-grid">${cards}</div>` : '<div class="prompt-home-empty">No prompts yet. Create your first one below.</div>'}
                    ${customPresetsMarkup}
                </div>
            `;
            container.querySelectorAll('[data-prompt-category]').forEach((button) => {
                button.addEventListener('click', () => {
                    ChatApp.Controller.setPromptCategory(button.dataset.promptCategory);
                });
            });

            container.querySelectorAll('[data-prompt-id]').forEach((button) => {
                button.addEventListener('click', () => {
                    ChatApp.Controller.prefillPromptTemplate(button.dataset.promptId);
                });
            });

            container.querySelectorAll('.delete-custom-preset-btn').forEach((button) => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ChatApp.Controller.deleteCustomPreset(button.dataset.presetId);
                });
            });

            const savePresetBtn = container.querySelector('#save-custom-preset-btn');
            if (savePresetBtn) {
                savePresetBtn.addEventListener('click', () => {
                    const title = container.querySelector('#custom-preset-title').value.trim();
                    const desc = container.querySelector('#custom-preset-desc').value.trim();
                    const cat = container.querySelector('#custom-preset-category').value.trim();
                    const tpl = container.querySelector('#custom-preset-template').value.trim();
                    if (!title || !tpl) return;
                    
                    const newPreset = {
                        id: 'custom-' + Date.now(),
                        kind: 'custom',
                        category: cat || 'Custom',
                        title: title,
                        description: desc || 'Custom preset prompt.',
                        promptTemplate: tpl,
                        providerHint: 'Local Custom Preset'
                    };
                    
                    ChatApp.State.customPresets.push(newPreset);
                    ChatApp.Store.saveCustomPresets(ChatApp.State.customPresets);
                    ChatApp.UI.renderConversationSurface();
                    ChatApp.UI.refreshPromptLibraryModal();
                });
            }

            container.querySelectorAll('[data-prompt-action]').forEach((button) => {
                button.addEventListener('click', async () => {
                    const action = button.dataset.promptAction;
                    if (action === 'open-settings') {
                        const promptOverlay = document.querySelector('[data-prompt-library-body="true"]')?.closest('.modal-overlay');
                        if (promptOverlay) promptOverlay.remove();
                        this.renderSettingsModal();
                        return;
                    }
                    if (action === 'switch-provider') {
                        ChatApp.Controller.switchProvider(ChatApp.Config.PROVIDERS.GOOGLE);
                        return;
                    }
                    if (action === 'retry-jbai') {
                        await ChatApp.Controller.refreshJbAiBackendStatus({ force: true, silent: false });
                    }
                });
            });
        },
        openPromptLibrary() {
            if (document.querySelector('.modal-overlay')) return;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="prompt-library-card" role="dialog" aria-modal="true" aria-labelledby="prompt-library-title">
                    <div data-prompt-library-body="true"></div>
                    <button type="button" class="prompt-library-close btn-primary">Close</button>
                </div>
            `;
            document.body.appendChild(overlay);
            const body = overlay.querySelector('[data-prompt-library-body="true"]');
            this.populatePromptLibrary(body, { mode: 'modal' });
            if (ChatApp.Store.getActiveProviderSettings().provider === ChatApp.Config.PROVIDERS.JBAI) {
                void ChatApp.Controller.refreshJbAiBackendStatus({ force: false, silent: true });
            }
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) overlay.remove();
            });
            overlay.querySelector('.prompt-library-close').addEventListener('click', () => overlay.remove());
        },
        renderSidebar() {
            const list = this.elements.conversationList;
            const foldersList = document.getElementById('folders-list');
            if (!list) return;
            list.innerHTML = '';
            
            if (!list._dragBound) {
                list._dragBound = true;
                list._dragCounter = 0;
                list.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    list._dragCounter++;
                    list.classList.add('drag-over');
                });
                list.addEventListener('dragover', (e) => { e.preventDefault(); });
                list.addEventListener('dragleave', () => {
                    list._dragCounter--;
                    if (list._dragCounter <= 0) {
                        list._dragCounter = 0;
                        list.classList.remove('drag-over');
                    }
                });
                list.addEventListener('drop', (e) => {
                    e.preventDefault();
                    list._dragCounter = 0;
                    list.classList.remove('drag-over');
                    const chatId = e.dataTransfer.getData('text/plain');
                    if (chatId) ChatApp.Folders.moveChatToFolder(chatId, null);
                });
            }
            
            if (foldersList) {
                foldersList.innerHTML = '';
            }
            
            if (ChatApp.State.activeTab === 'mystuff') {
                this.renderMyStuffSidebar();
                return;
            }

            let collapsed = [];
            try {
                const stored = localStorage.getItem(ChatApp.Store.getProfileKey('collapsed_folders'));
                collapsed = stored ? JSON.parse(stored) : [];
            } catch(e){}

            if (foldersList && ChatApp.State.folders) {
                ChatApp.State.folders.forEach(folder => {
                    const isCollapsed = collapsed.includes(folder.id);
                    const folderGroup = document.createElement('div');
                    folderGroup.className = 'folder-group' + (isCollapsed ? ' collapsed' : '');
                    
                    folderGroup._dragCounter = 0;
                    folderGroup.addEventListener('dragenter', (e) => {
                        e.preventDefault();
                        folderGroup._dragCounter++;
                        folderGroup.classList.add('drag-over');
                    });
                    folderGroup.addEventListener('dragover', (e) => { e.preventDefault(); });
                    folderGroup.addEventListener('dragleave', () => {
                        folderGroup._dragCounter--;
                        if (folderGroup._dragCounter <= 0) {
                            folderGroup._dragCounter = 0;
                            folderGroup.classList.remove('drag-over');
                        }
                    });
                    folderGroup.addEventListener('drop', (e) => {
                        e.preventDefault();
                        folderGroup._dragCounter = 0;
                        folderGroup.classList.remove('drag-over');
                        const chatId = e.dataTransfer.getData('text/plain');
                        if (chatId) ChatApp.Folders.moveChatToFolder(chatId, folder.id);
                    });
                    
                    const header = document.createElement('div');
                    header.className = 'folder-header';
                    
                    const chevron = document.createElement('span');
                    chevron.className = 'chevron';
                    chevron.innerHTML = ChatApp.Config.ICONS.CHEVRON_DOWN || '▼';
                    chevron.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let collapsedList = [];
                        try {
                            const st = localStorage.getItem(ChatApp.Store.getProfileKey('collapsed_folders'));
                            collapsedList = st ? JSON.parse(st) : [];
                        } catch(e){}
                        if (collapsedList.includes(folder.id)) {
                            collapsedList = collapsedList.filter(id => id !== folder.id);
                            folderGroup.classList.remove('collapsed');
                        } else {
                            collapsedList.push(folder.id);
                            folderGroup.classList.add('collapsed');
                        }
                        localStorage.setItem(ChatApp.Store.getProfileKey('collapsed_folders'), JSON.stringify(collapsedList));
                    });
                    
                    const folderIcon = document.createElement('span');
                    folderIcon.className = 'folder-icon';
                    folderIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
                    
                    const title = document.createElement('span');
                    title.className = 'folder-title';
                    title.textContent = folder.name;
                    title.title = folder.name;
                    
                    title.addEventListener('dblclick', () => {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = folder.name;
                        input.className = 'folder-rename-input';
                        input.style.width = '100%';
                        input.addEventListener('blur', () => {
                            const val = input.value.trim();
                            if (val && val !== folder.name) ChatApp.Folders.renameFolder(folder.id, val);
                            else title.textContent = folder.name;
                        });
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') input.blur();
                            if (e.key === 'Escape') { input.value = folder.name; input.blur(); }
                        });
                        title.innerHTML = '';
                        title.appendChild(input);
                        input.focus();
                    });
                    
                    const controls = document.createElement('div');
                    controls.className = 'folder-controls';
                    
                    const editBtn = document.createElement('button');
                    editBtn.className = 'folder-control-btn';
                    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
                    editBtn.title = 'Rename';
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newName = prompt("Rename folder to:", folder.name);
                        if (newName && newName.trim()) ChatApp.Folders.renameFolder(folder.id, newName.trim());
                    });
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'folder-control-btn';
                    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                    deleteBtn.title = 'Delete Folder';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}"? Chats inside won't be deleted.`)) ChatApp.Folders.deleteFolder(folder.id);
                    });
                    
                    controls.appendChild(editBtn);
                    controls.appendChild(deleteBtn);
                    header.appendChild(chevron);
                    header.appendChild(folderIcon);
                    header.appendChild(title);
                    header.appendChild(controls);
                    
                    const chatList = document.createElement('div');
                    chatList.className = 'folder-chats';
                    
                    const folderChats = ChatApp.State.allConversations.filter(c => c.folderId && String(c.folderId) === String(folder.id));
                    if (folderChats.length === 0) {
                        const emptyInfo = document.createElement('div');
                        emptyInfo.className = 'conversation-empty';
                        emptyInfo.textContent = 'Empty Folder';
                        emptyInfo.style.paddingLeft = '12px';
                        chatList.appendChild(emptyInfo);
                    } else {
                        folderChats.sort((a,b) => Number(b.id) - Number(a.id)).forEach(chat => {
                            chatList.appendChild(this.createChatSidebarItem(chat));
                        });
                    }
                    
                    header.addEventListener('click', (e) => {
                        if (e.target.closest('.folder-controls') || e.target.closest('.folder-rename-input')) return;
                        chevron.click();
                    });
                    
                    folderGroup.appendChild(header);
                    folderGroup.appendChild(chatList);
                    foldersList.appendChild(folderGroup);
                });
            }

            const unassignedConversations = ChatApp.State.allConversations.filter(c => !c.folderId);
            if (unassignedConversations.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'conversation-empty';
                emptyState.textContent = 'No recent chats';
                list.appendChild(emptyState);
            } else {
                unassignedConversations.sort((a, b) => Number(b.id) - Number(a.id)).forEach(chat => {
                    list.appendChild(this.createChatSidebarItem(chat));
                });
            }
        },
        createChatSidebarItem(chat) {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.dataset.chatId = chat.id;
            item.setAttribute('role', 'menuitem');
            item.setAttribute('draggable', 'true');
            if (String(chat.id) === String(ChatApp.State.currentChatId)) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'true');
            }
            const title = chat.title || 'Untitled Chat';
            item.setAttribute('aria-label', `Load conversation: ${title}`);
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', chat.id);
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            const titleSpan = document.createElement('span');
            titleSpan.className = 'conversation-title';
            titleSpan.setAttribute('data-tooltip', title);
            titleSpan.textContent = title;

            titleSpan.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'text';
                input.value = title;
                input.style.width = '100%';
                input.style.background = 'var(--input-bg)';
                input.style.color = 'var(--text-color)';
                input.style.border = '1px solid var(--border-color)';
                input.addEventListener('blur', () => {
                    const val = input.value.trim();
                    if (val && val !== title) {
                        chat.title = val;
                        ChatApp.Store.saveAllConversations();
                        ChatApp.UI.renderSidebar();
                    } else {
                        titleSpan.textContent = title;
                    }
                });
                input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') input.blur(); });
                titleSpan.innerHTML = '';
                titleSpan.appendChild(input);
                input.focus();
            });

            const actions = document.createElement('div');
            actions.className = 'conversation-actions-container';
            actions.style.display = 'flex';
            actions.style.gap = '4px';

            const folderBtn = document.createElement('button');
            folderBtn.type = 'button';
            folderBtn.className = 'folder-btn icon-btn';
            folderBtn.style.padding = '2px';
            folderBtn.style.fontSize = '12px';
            folderBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
            folderBtn.title = 'Move to folder';
            folderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showFolderAssignPopup(chat.id, folderBtn);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn icon-btn';
            deleteBtn.setAttribute('data-tooltip', 'Delete Chat');
            deleteBtn.innerHTML = ChatApp.Config.ICONS.DELETE;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                ChatApp.Controller.deleteConversation(chat.id);
            });

            actions.appendChild(folderBtn);
            actions.appendChild(deleteBtn);
            item.appendChild(titleSpan);
            item.appendChild(actions);

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn') && !e.target.closest('.folder-btn') && !e.target.closest('input')) {
                    ChatApp.Controller.loadChat(chat.id);
                }
            });
            return item;
        },
        showFolderAssignPopup(chatId, buttonEl) {
            const oldPopup = document.querySelector('.folder-select-popup');
            if (oldPopup) oldPopup.remove();

            const popup = document.createElement('div');
            popup.className = 'folder-select-popup';
            
            const noneOpt = document.createElement('button');
            noneOpt.className = 'folder-select-item';
            noneOpt.textContent = '❌ None';
            noneOpt.addEventListener('click', () => { ChatApp.Folders.moveChatToFolder(chatId, null); popup.remove(); document.removeEventListener('click', closeHandler); });
            popup.appendChild(noneOpt);

            ChatApp.State.folders.forEach(folder => {
                const opt = document.createElement('button');
                opt.className = 'folder-select-item';
                opt.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> ${ChatApp.Utils.escapeHTML(folder.name)}`;
                opt.addEventListener('click', () => { ChatApp.Folders.moveChatToFolder(chatId, folder.id); popup.remove(); document.removeEventListener('click', closeHandler); });
                popup.appendChild(opt);
            });

            document.body.appendChild(popup);
            const rect = buttonEl.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            
            // Position above the button by default, flip below if not enough space
            let top = rect.top + window.scrollY - popupRect.height - 4;
            if (top < window.scrollY + 10) {
                top = rect.bottom + window.scrollY + 4;
            }
            let left = rect.left + window.scrollX - popupRect.width / 2 + rect.width / 2;
            if (left < 10) left = 10;
            if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10;
            
            popup.style.position = 'absolute';
            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;

            const closeHandler = (e) => {
                if (!popup.contains(e.target) && e.target !== buttonEl) {
                    popup.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 0);
        },
        renderMyStuffSidebar() {
            const list = this.elements.conversationList;
            if (!list) return;
            list.innerHTML = '';
            
            const header = document.createElement('div');
            header.className = 'chats-header';
            header.innerHTML = '<h3>My Creations</h3>';
            list.appendChild(header);
            
            const categories = [
                { id: 'all', name: 'All Stuff', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
                { id: 'image', name: 'Generated Images', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' },
                { id: 'html', name: 'HTML Codes', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' },
                { id: 'svg', name: 'SVGs', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>' },
                { id: 'script', name: 'Scripts', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>' }
            ];
            
            const listContainer = document.createElement('div');
            listContainer.className = 'mystuff-sidebar-list';
            
            const activeFilter = ChatApp.State.myStuffFilter || 'all';
            categories.forEach(cat => {
                const item = document.createElement('button');
                item.className = 'mystuff-sidebar-item' + (activeFilter === cat.id ? ' active' : '');
                item.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;
                item.addEventListener('click', () => {
                    ChatApp.State.myStuffFilter = cat.id;
                    this.renderSidebar();
                    this.renderMyStuffDashboard();
                });
                listContainer.appendChild(item);
            });
            list.appendChild(listContainer);
        },
        scanCreations() {
            const creations = [];
            ChatApp.State.allConversations.forEach(chat => {
                chat.history.forEach(msg => {
                    if (msg.content && msg.content.role === 'model') {
                        const parts = msg.content.parts || [];
                        const text = typeof parts === 'string' ? parts : (Array.isArray(parts) ? parts.map(p => p.text || '').join('') : '');
                        
                        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
                        let match;
                        while ((match = imgRegex.exec(text)) !== null) {
                            if (match[1].startsWith('data:image/') || match[1].startsWith('blob:') || match[1].includes('tempmediaStorage')) {
                                creations.push({ type: 'image', title: 'Generated Image', content: match[1], chatId: chat.id, date: chat.updatedAt || chat.id });
                            }
                        }
                        
                        const codeBlockRegex = /```(html|svg|javascript|css)\n([\s\S]*?)```/gi;
                        let codeMatch;
                        while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
                            const lang = codeMatch[1].toLowerCase();
                            const code = codeMatch[2];
                            
                            let type = 'script';
                            let title = 'Script File';
                            if (lang === 'html') { type = 'html'; title = 'Webpage Prototype'; }
                            else if (lang === 'svg') { type = 'svg'; title = 'SVG Graphic'; }
                            else if (lang === 'css') { type = 'css'; title = 'Stylesheet'; }
                            
                            if (!creations.some(c => c.content === code && c.chatId === chat.id)) {
                                creations.push({ type, title, content: code, chatId: chat.id, date: chat.updatedAt || chat.id });
                            }
                        }
                    }
                });
            });
            return creations;
        },
        renderMyStuffDashboard() {
            const container = this.elements.myStuffContainer;
            if (!container) return;
            const chatMain = document.getElementById('chat-main-area');
            if (chatMain) chatMain.style.display = 'none';
            container.style.display = 'flex';
            
            const grid = document.getElementById('my-stuff-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            let items = this.scanCreations();
            const sidebarFilter = ChatApp.State.myStuffFilter || 'all';
            if (sidebarFilter !== 'all') items = items.filter(item => item.type === sidebarFilter);
            
            const searchInput = document.getElementById('my-stuff-search');
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            if (query) {
                items = items.filter(item => item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query));
            }
            
            if (items.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'my-stuff-empty';
                empty.innerHTML = `<div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div><h3>No creations found</h3><p>Generated images, web previews, and svgs will automatically appear here.</p>`;
                grid.appendChild(empty);
                return;
            }
            
            items.sort((a, b) => Number(b.date) - Number(a.date)).forEach(item => {
                const card = document.createElement('div');
                card.className = 'my-stuff-card';
                
                const preview = document.createElement('div');
                preview.className = 'my-stuff-card-preview';
                
                if (item.type === 'image') {
                    const img = document.createElement('img');
                    img.src = item.content;
                    img.alt = item.title;
                    preview.appendChild(img);
                } else if (item.type === 'svg') {
                    const wrapper = document.createElement('div');
                    wrapper.style.width = '100%'; wrapper.style.height = '100%';
                    wrapper.style.display = 'flex'; wrapper.style.alignItems = 'center'; wrapper.style.justifyContent = 'center'; wrapper.style.padding = '8px';
                    if (item.content.includes('<svg')) {
                        wrapper.innerHTML = item.content;
                        const svgEl = wrapper.querySelector('svg');
                        if (svgEl) { svgEl.setAttribute('width', '100%'); svgEl.setAttribute('height', '100%'); }
                    } else { wrapper.innerHTML = '<span class="code-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg></span>'; }
                    preview.appendChild(wrapper);
                } else if (item.type === 'html') preview.innerHTML = '<span class="code-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></span>';
                else preview.innerHTML = '<span class="code-icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg></span>';
                
                const info = document.createElement('div');
                info.className = 'my-stuff-card-info';
                
                const title = document.createElement('div');
                title.className = 'my-stuff-card-title';
                title.textContent = item.title;
                
                const meta = document.createElement('div');
                meta.className = 'my-stuff-card-meta';
                const dateStr = new Date(Number(item.date)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                meta.innerHTML = `<span>${dateStr}</span><a href="#" class="convo-jump-link" style="color: var(--focus-color); font-weight:600; text-decoration:none;">Jump to chat</a>`;
                meta.querySelector('.convo-jump-link').addEventListener('click', (e) => { e.preventDefault(); ChatApp.Controller.loadChat(item.chatId); });
                
                info.appendChild(title); info.appendChild(meta);
                
                const actions = document.createElement('div');
                actions.className = 'my-stuff-card-actions';
                
                if (item.type === 'html' || item.type === 'svg') {
                    const canvasBtn = document.createElement('button');
                    canvasBtn.className = 'my-stuff-action-btn';
                    canvasBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
                    canvasBtn.title = 'Open in Canvas';
                    canvasBtn.addEventListener('click', (e) => { e.stopPropagation(); this.openCanvasPanel(item.content, item.type === 'html' ? 'preview' : 'code'); });
                    actions.appendChild(canvasBtn);
                } else if (item.type === 'image') {
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'my-stuff-action-btn';
                    viewBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
                    viewBtn.title = 'Zoom Image';
                    viewBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showFullscreenPreview(item.content, 'image'); });
                    actions.appendChild(viewBtn);
                }
                
                card.appendChild(preview); card.appendChild(info); card.appendChild(actions);
                grid.appendChild(card);
            });
        },
        renderChatArea() {
            const myStuff = this.elements.myStuffContainer;
            if (myStuff) myStuff.style.display = 'none';
            const chatMain = document.getElementById('chat-main-area');
            if (chatMain) chatMain.style.display = 'flex';
        },
        renderProfileWidget() {
            const avatar = this.elements.profileAvatar;
            const nameEl = this.elements.profileName;
            if (avatar && nameEl) {
                avatar.innerHTML = '';
                avatar.textContent = 'U';
                avatar.style.backgroundColor = '#4f46e5';
                nameEl.textContent = 'User';
            }
        },
        showAccountManagerModal() {
            // Open settings modal instead of account manager
            this.renderSettingsModal();
        },
        openCanvasPanel(code, tab = 'preview') {
            const panel = this.elements.splitCanvasPanel;
            if (!panel) return;
            panel.style.display = 'flex';
            if (this.elements.canvasCodeTextarea) this.elements.canvasCodeTextarea.value = code;
            this.switchCanvasTab(tab);
        },
        closeCanvasPanel() {
            const panel = this.elements.splitCanvasPanel;
            if (panel) panel.style.display = 'none';
        },
        switchCanvasTab(tabName) {
            const tabs = document.querySelectorAll('.canvas-tab');
            tabs.forEach(btn => { if (btn.dataset.tab === tabName) btn.classList.add('active'); else btn.classList.remove('active'); });
            const contents = document.querySelectorAll('.canvas-tab-content');
            contents.forEach(cont => { if (cont.dataset.tab === tabName) cont.style.display = 'flex'; else cont.style.display = 'none'; });
            if (tabName === 'preview') this.runCanvasCode();
        },
        runCanvasCode() {
            const code = this.elements.canvasCodeTextarea ? this.elements.canvasCodeTextarea.value : '';
            const iframe = this.elements.canvasPreviewIframe;
            if (iframe && code) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.open(); doc.write(code); doc.close();
                } catch(e) { console.error("Iframe write failed", e); }
            }
        },
        navigateBrowser(url) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
            const addressInput = document.getElementById('browser-address-input');
            if (addressInput) addressInput.value = url;
            const iframe = this.elements.canvasBrowserIframe;
            if (iframe) iframe.src = url;
        },
        async scrapeCurrentBrowserPage() {
            const addressInput = document.getElementById('browser-address-input');
            const url = addressInput ? addressInput.value : '';
            if (!url) return this.showToast("No page loaded to scrape", "error");
            this.showToast("Scraping page content...");
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error("Proxy error");
                const data = await response.json();
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                doc.querySelectorAll('script, style, iframe, noscript').forEach(el => el.remove());
                const text = doc.body ? doc.body.innerText.replace(/\s+/g, ' ').trim() : '';
                const chatInput = this.elements.chatInput;
                if (chatInput) {
                    chatInput.value += `\n[Scraped Content from ${url}]:\n${text.substring(0, 2000)}\n`;
                    chatInput.focus();
                    this.showToast("Page scraped and appended to chat input!");
                }
            } catch(e) {
                console.error("Scraping failed", e);
                this.showToast("Failed to scrape page. Appending url to input.", "warning");
                const chatInput = this.elements.chatInput;
                if (chatInput) chatInput.value += `\n[URL to scrape]: ${url}\n`;
            }
        },
        getSystemInfoData() {
            const allowed = localStorage.getItem(ChatApp.Store.getProfileKey('system_info_allowed')) === 'true';
            if (!allowed) return null;
            return {
                userAgent: navigator.userAgent, platform: navigator.platform, language: navigator.language,
                screenResolution: `${window.screen.width}x${window.screen.height}`, cores: navigator.hardwareConcurrency || 'unknown',
                memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, currentTime: new Date().toString()
            };
        },
        async ensureSystemInfoPermission() {
            const key = ChatApp.Store.getProfileKey('system_info_allowed');
            const stored = localStorage.getItem(key);
            if (stored !== null) return stored === 'true';
            
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'modal-backdrop';
                modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center'; modal.style.zIndex = '1000';
                
                const container = document.createElement('div');
                container.className = 'modal-container';
                container.style.width = '400px'; container.style.padding = '24px'; container.style.borderRadius = '12px';
                container.style.background = 'var(--modal-bg)'; container.style.boxShadow = '0 10px 25px var(--modal-shadow)';
                container.style.color = 'var(--text-color)'; container.style.textAlign = 'center';
                
                container.innerHTML = `
                    <div style="margin-bottom: 12px; color: var(--focus-color);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </div>
                    <h3 style="margin-bottom: 12px; font-weight:bold;">Share System Information?</h3>
                    <p style="font-size:13px; color:var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
                        J.B.A.I wants permission to read your browser, OS, hardware, and timezone details to assist with system-specific questions.
                    </p>
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="primary-btn" id="sys-allow-btn">Allow</button>
                        <button class="secondary-btn" id="sys-deny-btn">Deny</button>
                    </div>
                `;
                
                modal.appendChild(container); document.body.appendChild(modal);
                
                modal.querySelector('#sys-allow-btn').addEventListener('click', () => { localStorage.setItem(key, 'true'); modal.remove(); resolve(true); });
                modal.querySelector('#sys-deny-btn').addEventListener('click', () => { localStorage.setItem(key, 'false'); modal.remove(); resolve(false); });
            });
        },
        async renderMessage(message, isTyping = false) {
            const existingHome = this.elements.messageArea.querySelector('.prompt-home');
            if (existingHome) existingHome.remove();
            this.elements.messageArea.classList.remove('message-area-home');

            const messageEl = document.createElement('div');
            messageEl.dataset.messageId = message.id;
            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';
            let rawContent = ''; 
            let groundingMetadata = null;

            if (isTyping) {
                messageEl.className = 'message bot thinking';
                contentEl.innerHTML = `
                    <div class="thinking-shell">
                        <div class="thinking-dots" aria-hidden="true">
                            <span></span><span></span><span></span>
                        </div>
                        <div class="thinking-label">Thinking...</div>
                    </div>
                `;
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
        updateThinkingMessage(messageEl, label) {
            if (!messageEl || !label) return;
            const labelEl = messageEl.querySelector('.thinking-label');
            if (labelEl) {
                labelEl.textContent = label;
                this.scrollToBottom();
            }
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

                    if (wrapper.dataset.previewable === 'html' || wrapper.dataset.previewable === 'svg') {
                        const canvasBtn = document.createElement('button');
                        canvasBtn.className = 'code-canvas-badge icon-btn';
                        canvasBtn.type = 'button';
                        canvasBtn.dataset.lang = wrapper.dataset.previewable;
                        canvasBtn.setAttribute('data-tooltip', 'Open in Canvas');
                        canvasBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
                        actionsContainer.appendChild(canvasBtn);
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
                <h3>Provider</h3>
                <div class="settings-row">
                    <label for="provider-select">Provider</label>
                    <select id="provider-select">
                        <option value="jbai">J.B.A.I</option>
                        <option value="google">Google</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="groq">Groq</option>
                        <option value="deepseek">DeepSeek</option>
                    </select>
                </div>
                <div class="settings-row settings-row-input" data-provider-base-url-row="true" style="display: none;">
                    <label for="provider-base-url-input">Backend URL</label>
                    <input id="provider-base-url-input" type="text" autocomplete="off" spellcheck="false">
                </div>
                <div class="settings-row settings-row-input provider-status-row" data-provider-status-row="true" style="display: none;">
                    <label for="provider-healthcheck-button">J.B.A.I Backend Status</label>
                    <div class="provider-status-card" id="jbai-provider-status-card">
                        <div class="provider-status-header">
                            <p class="provider-status-title">Checking backend</p>
                            <span class="provider-status-badge" data-status="unknown">Not checked yet</span>
                        </div>
                        <div class="provider-status-body">
                            <p>We verify the backend URL, health endpoint, and required J.B.A.I routes.</p>
                            <div class="provider-status-meta"></div>
                        </div>
                        <div class="provider-status-actions">
                            <button id="provider-healthcheck-button" type="button">Check connection</button>
                        </div>
                    </div>
                </div>
                <div class="settings-row settings-row-input" data-provider-model-row="true">
                    <label for="provider-model-input">Model Name</label>
                    <input id="provider-model-input" type="text" autocomplete="off" spellcheck="false">
                </div>
                <div class="settings-row settings-row-input" data-provider-api-key-row="true">
                    <label for="provider-api-key-input">API Key</label>
                    <input id="provider-api-key-input" type="password" autocomplete="off" spellcheck="false">
                </div>
                <p id="provider-capability-note" style="font-size:0.85em; color:var(--text-secondary); margin-top:-10px; margin-bottom:16px;"></p>
                <hr>
                <h3>AI Capabilities</h3>
                <div class="settings-row" data-agent-tool-row="true">
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
                <h3>Display Options</h3>
                <div class="settings-row">
                    <label for="toggle-auto-previews">Auto-run HTML/SVG Previews</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-auto-previews" ${tools.autoRunPreviews !== false ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <label for="toggle-hide-scrollbar">Hide Scrollbars</label>
                    <label class="switch">
                        <input type="checkbox" id="toggle-hide-scrollbar" ${tools.hideScrollbar ? 'checked' : ''}>
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
            const providerBaseUrlInput = overlay.querySelector('#provider-base-url-input');
            const providerModelInput = overlay.querySelector('#provider-model-input');
            const providerApiKeyInput = overlay.querySelector('#provider-api-key-input');
            const providerCapabilityNote = overlay.querySelector('#provider-capability-note');
            const googleToolRows = overlay.querySelectorAll('[data-google-tool-row="true"]');
            const agentToolRows = overlay.querySelectorAll('[data-agent-tool-row="true"]');
            const providerBaseUrlRow = overlay.querySelector('[data-provider-base-url-row="true"]');
            const providerStatusRow = overlay.querySelector('[data-provider-status-row="true"]');
            const providerModelRow = overlay.querySelector('[data-provider-model-row="true"]');
            const providerApiKeyRow = overlay.querySelector('[data-provider-api-key-row="true"]');
            const agentModeToggle = overlay.querySelector('#toggle-agent-mode');
            const googleSearchToggle = overlay.querySelector('#toggle-google-search');
            const codeExecToggle = overlay.querySelector('#toggle-code-exec');
            const providerStatusCard = overlay.querySelector('#jbai-provider-status-card');
            const providerHealthcheckButton = overlay.querySelector('#provider-healthcheck-button');
            const providerStatusTitle = providerStatusCard.querySelector('.provider-status-title');
            const providerStatusBadge = providerStatusCard.querySelector('.provider-status-badge');
            const providerStatusBody = providerStatusCard.querySelector('.provider-status-body p');
            const providerStatusMeta = providerStatusCard.querySelector('.provider-status-meta');

            const providerMetadata = {
                jbai: {
                    baseUrlPlaceholder: ChatApp.Utils.getRemoteJbAiPlaceholder(),
                    supportsGoogleTools: false,
                    supportsAgentMode: false,
                    requiresBaseUrl: true,
                    requiresModel: false,
                    requiresApiKey: false,
                    capabilityNote: 'J.B.A.I is the official web-grounded mode. It streams live web search, reads sources, and answers with citations through the backend service.'
                },
                google: {
                    modelPlaceholder: 'gemini-2.5-flash',
                    keyPlaceholder: 'AIza...',
                    supportsGoogleTools: true,
                    supportsAgentMode: true,
                    requiresBaseUrl: false,
                    requiresModel: true,
                    requiresApiKey: true,
                    capabilityNote: 'Google direct mode runs fully in the browser with optional Google Search and Code Execution tools.'
                },
                openai: {
                    modelPlaceholder: 'gpt-4.1-mini',
                    keyPlaceholder: 'sk-...',
                    supportsGoogleTools: false,
                    supportsAgentMode: true,
                    requiresBaseUrl: false,
                    requiresModel: true,
                    requiresApiKey: true,
                    capabilityNote: 'OpenAI direct mode sends requests from this browser using your saved API key.'
                },
                anthropic: {
                    modelPlaceholder: 'claude-3-5-haiku-latest',
                    keyPlaceholder: 'sk-ant-...',
                    supportsGoogleTools: false,
                    supportsAgentMode: true,
                    requiresBaseUrl: false,
                    requiresModel: true,
                    requiresApiKey: true,
                    capabilityNote: 'Anthropic direct mode sends requests from this browser using your saved API key.'
                },
                groq: {
                    modelPlaceholder: 'llama-3.3-70b-versatile',
                    keyPlaceholder: 'gsk_...',
                    supportsGoogleTools: false,
                    supportsAgentMode: true,
                    requiresBaseUrl: false,
                    requiresModel: true,
                    requiresApiKey: true,
                    capabilityNote: 'Groq direct mode runs fast inference using your saved Groq API key.'
                },
                deepseek: {
                    modelPlaceholder: 'deepseek-chat',
                    keyPlaceholder: 'sk-...',
                    supportsGoogleTools: false,
                    supportsAgentMode: true,
                    requiresBaseUrl: false,
                    requiresModel: true,
                    requiresApiKey: true,
                    capabilityNote: 'DeepSeek direct mode runs OpenAI-compatible completions using your DeepSeek API key.'
                }
            };

            let draftProviderSettings = JSON.parse(JSON.stringify(providerSettings));
            const persistProviderSettings = () => {
                draftProviderSettings = ChatApp.Store.saveProviderSettings(draftProviderSettings);
                ChatApp.UI.toggleSendButtonState();
                ChatApp.UI.renderConversationSurface();
            };

            const renderProviderStatus = () => {
                const presentation = ChatApp.UI.getJbAiStatusPresentation();
                providerStatusCard.dataset.status = presentation.status;
                providerStatusTitle.textContent = presentation.title;
                providerStatusBadge.dataset.status = presentation.status;
                providerStatusBadge.textContent = presentation.label;
                providerStatusBody.textContent = presentation.message;
                providerStatusMeta.textContent = presentation.meta;
                providerHealthcheckButton.disabled = presentation.status === ChatApp.Config.JBAI_BACKEND_STATES.CHECKING;
            };

            const runJbAiStatusCheck = async (force = false, silent = true) => {
                if (providerSelect.value !== ChatApp.Config.PROVIDERS.JBAI) return;
                await ChatApp.Controller.refreshJbAiBackendStatus({
                    force,
                    silent,
                    baseUrlOverride: providerBaseUrlInput.value
                });
                renderProviderStatus();
            };

            const debouncedJbAiStatusCheck = ChatApp.Utils.debounce(() => {
                runJbAiStatusCheck(true, true);
            }, 500);

            const refreshProviderUI = () => {
                const provider = providerSelect.value;
                const metadata = providerMetadata[provider] || providerMetadata.jbai;

                providerBaseUrlInput.value = draftProviderSettings.baseUrls?.[provider] || '';
                providerModelInput.value = draftProviderSettings.models?.[provider] || '';
                providerApiKeyInput.value = draftProviderSettings.apiKeys?.[provider] || '';
                providerBaseUrlInput.placeholder = metadata.baseUrlPlaceholder || '';
                providerModelInput.placeholder = metadata.modelPlaceholder || '';
                providerApiKeyInput.placeholder = metadata.keyPlaceholder || '';

                providerBaseUrlRow.hidden = metadata.requiresBaseUrl !== true;
                providerStatusRow.hidden = provider !== ChatApp.Config.PROVIDERS.JBAI;
                providerModelRow.hidden = metadata.requiresModel !== true;
                providerApiKeyRow.hidden = metadata.requiresApiKey !== true;

                const disableGoogleTools = metadata.supportsGoogleTools !== true;
                googleToolRows.forEach((row) => {
                    row.classList.toggle('settings-row-disabled', disableGoogleTools);
                });
                googleSearchToggle.disabled = disableGoogleTools;
                codeExecToggle.disabled = disableGoogleTools;

                const disableAgentMode = metadata.supportsAgentMode !== true;
                agentToolRows.forEach((row) => {
                    row.classList.toggle('settings-row-disabled', disableAgentMode);
                });
                agentModeToggle.disabled = disableAgentMode;

                providerCapabilityNote.textContent = metadata.capabilityNote;
                renderProviderStatus();
            };

            providerSelect.value = draftProviderSettings.provider;
            refreshProviderUI();
            if (providerSelect.value === ChatApp.Config.PROVIDERS.JBAI) {
                runJbAiStatusCheck(false, true);
            }

            providerSelect.addEventListener('change', () => {
                draftProviderSettings.provider = providerSelect.value;
                persistProviderSettings();
                refreshProviderUI();
                if (providerSelect.value === ChatApp.Config.PROVIDERS.JBAI) {
                    runJbAiStatusCheck(false, true);
                }
            });

            providerBaseUrlInput.addEventListener('input', () => {
                const provider = providerSelect.value;
                draftProviderSettings.baseUrls[provider] = providerBaseUrlInput.value;
                persistProviderSettings();
                if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                    ChatApp.Controller.markJbAiBackendStatusUnknown(providerBaseUrlInput.value);
                    renderProviderStatus();
                    debouncedJbAiStatusCheck();
                }
            });

            providerBaseUrlInput.addEventListener('blur', () => {
                const provider = providerSelect.value;
                if (provider !== ChatApp.Config.PROVIDERS.JBAI) return;
                draftProviderSettings.baseUrls[provider] = ChatApp.Utils.normalizeJbAiBaseUrl(providerBaseUrlInput.value);
                persistProviderSettings();
                providerBaseUrlInput.value = draftProviderSettings.baseUrls[provider] || '';
                ChatApp.Controller.markJbAiBackendStatusUnknown(providerBaseUrlInput.value);
                renderProviderStatus();
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

            providerHealthcheckButton.addEventListener('click', async () => {
                await runJbAiStatusCheck(true, false);
            });

            const updateTools = () => {
                const config = {
                    googleSearch: overlay.querySelector('#toggle-google-search').checked,
                    codeExecution: overlay.querySelector('#toggle-code-exec').checked,
                    agentMode: overlay.querySelector('#toggle-agent-mode').checked,
                    autoRunPreviews: overlay.querySelector('#toggle-auto-previews').checked,
                    hideScrollbar: overlay.querySelector('#toggle-hide-scrollbar').checked
                };
                ChatApp.Store.saveToolsConfig(config);
                ChatApp.Controller.applyDisplaySettings();
            };
            overlay.querySelector('#toggle-google-search').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-code-exec').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-agent-mode').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-auto-previews').addEventListener('change', updateTools);
            overlay.querySelector('#toggle-hide-scrollbar').addEventListener('change', updateTools);
            
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
        buildJbAiUrl(baseUrl, path) {
            const normalizedBaseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrl);
            return `${normalizedBaseUrl.replace(/\/$/, '')}${path}`;
        },
        async fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: options.signal || controller.signal
                });
                return response;
            } finally {
                window.clearTimeout(timeoutId);
            }
        },
        async checkJbAiBackend(baseUrl) {
            const normalizedBaseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrl);
            const checkedAt = Date.now();

            if (!normalizedBaseUrl) {
                return {
                    status: ChatApp.Config.JBAI_BACKEND_STATES.MISSING,
                    baseUrl: '',
                    checkedAt,
                    detail: ''
                };
            }

            try {
                const healthResponse = await this.fetchWithTimeout(
                    this.buildJbAiUrl(normalizedBaseUrl, ChatApp.Config.API_ENDPOINTS.JBAI_HEALTH_PATH),
                    {
                        method: 'GET',
                        headers: { Accept: 'application/json' }
                    },
                    5000
                );

                if (!healthResponse.ok) {
                    return {
                        status: ChatApp.Config.JBAI_BACKEND_STATES.UNAVAILABLE,
                        baseUrl: normalizedBaseUrl,
                        checkedAt,
                        detail: `Health check returned HTTP ${healthResponse.status}.`
                    };
                }
            } catch (error) {
                const timedOut = error?.name === 'AbortError';
                return {
                    status: ChatApp.Config.JBAI_BACKEND_STATES.UNAVAILABLE,
                    baseUrl: normalizedBaseUrl,
                    checkedAt,
                    detail: timedOut ? 'Health check timed out.' : 'Unable to connect to the backend URL.'
                };
            }

            try {
                const schemaResponse = await this.fetchWithTimeout(
                    this.buildJbAiUrl(normalizedBaseUrl, ChatApp.Config.API_ENDPOINTS.JBAI_OPENAPI_PATH),
                    {
                        method: 'GET',
                        headers: { Accept: 'application/json' }
                    },
                    5000
                );

                if (!schemaResponse.ok) {
                    return {
                        status: ChatApp.Config.JBAI_BACKEND_STATES.API_MISSING,
                        baseUrl: normalizedBaseUrl,
                        checkedAt,
                        detail: `OpenAPI check returned HTTP ${schemaResponse.status}.`
                    };
                }

                const schema = await schemaResponse.json();
                const paths = schema?.paths || {};
                const requiredPaths = [
                    ChatApp.Config.API_ENDPOINTS.JBAI_SEARCH_PATH,
                    ChatApp.Config.API_ENDPOINTS.JBAI_SEARCH_STREAM_PATH,
                    ChatApp.Config.API_ENDPOINTS.JBAI_SKILLS_PATH
                ];
                const hasAllPaths = requiredPaths.every((path) => Boolean(paths[path]));
                if (!hasAllPaths) {
                    return {
                        status: ChatApp.Config.JBAI_BACKEND_STATES.API_MISSING,
                        baseUrl: normalizedBaseUrl,
                        checkedAt,
                        detail: 'Required J.B.A.I API routes were not found on this server.'
                    };
                }
            } catch (error) {
                return {
                    status: ChatApp.Config.JBAI_BACKEND_STATES.API_MISSING,
                    baseUrl: normalizedBaseUrl,
                    checkedAt,
                    detail: 'Unable to verify the J.B.A.I routes from the backend schema.'
                };
            }

            return {
                status: ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED,
                baseUrl: normalizedBaseUrl,
                checkedAt,
                detail: ''
            };
        },
        async fetchJbAiSkillCatalog(baseUrl) {
            const endpoint = this.buildJbAiUrl(baseUrl, ChatApp.Config.API_ENDPOINTS.JBAI_SKILLS_PATH);
            const response = await this.fetchWithTimeout(endpoint, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            }, 6000);

            if (!response.ok) {
                throw new Error(await this.getJbAiBackendErrorMessage(response, baseUrl));
            }

            const data = await response.json();
            if (!Array.isArray(data)) return [];
            return data
                .filter((item) => item && typeof item === 'object')
                .map((item) => ({
                    id: String(item.id || ''),
                    kind: 'skill',
                    category: 'Skills',
                    name: String(item.name || ''),
                    title: String(item.title || item.name || 'Skill'),
                    description: String(item.description || item.summary || 'Shared skill'),
                    summary: String(item.summary || ''),
                    promptTemplate: String(item.promptTemplate || ''),
                    instructions: String(item.instructions || ''),
                    providerHint: 'Best with J.B.A.I',
                    sourcePath: typeof item.sourcePath === 'string' ? item.sourcePath : undefined
                }))
                .filter((item) => item.id && item.promptTemplate);
        },
        mapJbAiCompletionPayload(payload) {
            const citations = Array.isArray(payload?.citations) ? payload.citations : [];
            const sources = Array.isArray(payload?.sources) ? payload.sources : [];
            const queries = Array.isArray(payload?.queries) ? payload.queries : [];
            const groundingChunks = citations
                .map((citation) => {
                    const url = typeof citation?.url === 'string' ? citation.url.trim() : '';
                    if (!url) return null;
                    return {
                        web: {
                            uri: url,
                            title: typeof citation?.title === 'string' ? citation.title : 'Source',
                            domain: typeof citation?.domain === 'string' ? citation.domain : '',
                            publishedAt: typeof citation?.published_at === 'string' ? citation.published_at : null
                        }
                    };
                })
                .filter(Boolean);

            return {
                groundingMetadata: groundingChunks.length > 0 ? { groundingChunks } : null,
                searchMetadata: {
                    citations,
                    sources,
                    queries,
                    insufficientContext: Boolean(payload?.insufficient_context)
                }
            };
        },
        getProviderLabel(provider) {
            switch (provider) {
                case ChatApp.Config.PROVIDERS.JBAI:
                    return 'J.B.A.I';
                case ChatApp.Config.PROVIDERS.OPENAI:
                    return 'OpenAI';
                case ChatApp.Config.PROVIDERS.ANTHROPIC:
                    return 'Anthropic';
                case ChatApp.Config.PROVIDERS.GROQ:
                    return 'Groq';
                case ChatApp.Config.PROVIDERS.DEEPSEEK:
                    return 'DeepSeek';
                default:
                    return 'Google';
            }
        },
        getActiveProviderConfig() {
            const { provider, model, apiKey, baseUrl } = ChatApp.Store.getActiveProviderSettings();
            const providerLabel = this.getProviderLabel(provider);
            if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                const normalizedBaseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrl);
                if (!normalizedBaseUrl) {
                    throw new Error('J.B.A.I backend URL is missing. Add it in Settings.');
                }
                return { provider, baseUrl: normalizedBaseUrl };
            }
            if (!apiKey) {
                throw new Error(`${providerLabel} API key is missing. Add it in Settings.`);
            }
            if (!model) {
                throw new Error(`${providerLabel} model name is missing. Add it in Settings.`);
            }
            return { provider, model, apiKey };
        },
        extractTextFromParts(parts) {
            if (!Array.isArray(parts)) return '';
            return parts
                .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
                .filter(Boolean)
                .join('\n\n')
                .trim();
        },
        sanitizeApiContents(apiContents) {
            return apiContents.map((content) => {
                if (!content?.role || !Array.isArray(content.parts)) return content;
                const mappedRole = content.role === 'assistant' ? 'model' : content.role;
                return {
                    role: mappedRole,
                    parts: content.parts.map((part) => {
                        if (part?.text) {
                            return { text: ChatApp.Utils.sanitizeTextForApi(part.text) };
                        }
                        return part;
                    })
                };
            });
        },
        inferJbAiSearchTopic(query) {
            const lowered = String(query || '').toLowerCase();
            if (/\b(stock|stocks|market|markets|earnings|revenue|valuation|nasdaq|nyse|s&p|bitcoin|btc|crypto|price target)\b/.test(lowered)) {
                return 'finance';
            }
            if (/\b(latest|today|yesterday|this week|breaking|news|update|recent|current|live)\b/.test(lowered)) {
                return 'news';
            }
            return 'general';
        },
        buildJbAiPayload(contents, toolsConfig) {
            const textConversation = contents
                .map((message) => {
                    const text = this.extractTextFromParts(message.parts);
                    if (!text) return null;
                    return {
                        role: message.role === 'model' ? 'assistant' : 'user',
                        content: text
                    };
                })
                .filter(Boolean);

            const lastUserMessage = [...textConversation].reverse().find((message) => message.role === 'user');
            const query = lastUserMessage?.content || '';

            return {
                query,
                conversation: textConversation.slice(-8),
                mode: toolsConfig?.agentMode ? 'deep' : 'balanced',
                search_topic: this.inferJbAiSearchTopic(query),
                max_search_queries: toolsConfig?.agentMode ? 4 : 3,
                max_results_per_query: toolsConfig?.agentMode ? 6 : 5,
                max_sources: toolsConfig?.agentMode ? 8 : 6,
                debug: false,
                skill_instructions: (ChatApp.State.activeSkillForGeneration || ChatApp.State.activeSkill) ? (ChatApp.State.activeSkillForGeneration || ChatApp.State.activeSkill).instructions : null
            };
        },
        parseSseChunk(chunk) {
            if (!chunk || typeof chunk !== 'string') return null;

            const lines = chunk.split('\n');
            let type = 'message';
            let data = '';

            lines.forEach((line) => {
                if (line.startsWith('event:')) {
                    type = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                    data += line.slice(5).trim();
                }
            });

            if (!data) return null;

            try {
                return { type, data: JSON.parse(data) };
            } catch {
                return { type, data };
            }
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
        async getJbAiBackendErrorMessage(response, baseUrl) {
            const normalizedBaseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrl);
            if (response.status === 404) {
                return `Backend responded but J.B.A.I API is missing at ${normalizedBaseUrl}. Check the backend URL in Settings.`;
            }
            if (response.status === 502 || response.status === 503 || response.status === 504) {
                return `J.B.A.I backend is unavailable at ${normalizedBaseUrl}. Please try again after the service recovers.`;
            }
            return this.getErrorMessageFromResponse(response, 'J.B.A.I');
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
        async requestOpenAiCompatibleText({ apiKey, model, contents, systemInstructionText, signal, titleMode = false, endpoint, providerName }) {
            const payload = {
                model,
                messages: this.toOpenAiMessages(contents, systemInstructionText),
                temperature: titleMode ? 0.2 : 0.7,
                ...(titleMode ? { max_tokens: 30 } : {})
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getErrorMessageFromResponse(response, providerName));
            }

            const data = await response.json();
            const text = this.extractOpenAiText(data).trim();
            if (!text) throw new Error(`${providerName} returned an empty response.`);
            return text;
        },
        async requestOpenAiText(args) {
            return this.requestOpenAiCompatibleText({
                ...args,
                endpoint: ChatApp.Config.API_ENDPOINTS.OPENAI_CHAT,
                providerName: 'OpenAI'
            });
        },
        async requestGroqText(args) {
            return this.requestOpenAiCompatibleText({
                ...args,
                endpoint: ChatApp.Config.API_ENDPOINTS.GROQ_CHAT,
                providerName: 'Groq'
            });
        },
        async requestDeepSeekText(args) {
            return this.requestOpenAiCompatibleText({
                ...args,
                endpoint: ChatApp.Config.API_ENDPOINTS.DEEPSEEK_CHAT,
                providerName: 'DeepSeek'
            });
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
        async requestJbAiText({ baseUrl, contents, signal, toolsConfig }) {
            const payload = this.buildJbAiPayload(contents, toolsConfig);

            if (!payload.query || payload.query.length < 2) {
                throw new Error('J.B.A.I mode currently requires a text question. Attachments alone are not supported yet.');
            }

            const endpoint = this.buildJbAiUrl(baseUrl, ChatApp.Config.API_ENDPOINTS.JBAI_SEARCH_PATH);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getJbAiBackendErrorMessage(response, baseUrl));
            }

            const data = await response.json();
            const text = typeof data?.answer === 'string' ? data.answer.trim() : '';
            if (!text) throw new Error('J.B.A.I returned an empty response.');
            return text;
        },
        async *streamJbAiResponse({ contents, signal, toolsConfig }) {
            const { baseUrl } = this.getActiveProviderConfig();
            const payload = this.buildJbAiPayload(contents, toolsConfig);

            if (!payload.query || payload.query.length < 2) {
                throw new Error('J.B.A.I mode currently requires a text question. Attachments alone are not supported yet.');
            }

            const endpoint = this.buildJbAiUrl(baseUrl, ChatApp.Config.API_ENDPOINTS.JBAI_SEARCH_STREAM_PATH);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream'
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                throw new Error(await this.getJbAiBackendErrorMessage(response, baseUrl));
            }

            if (!response.body) {
                throw new Error('J.B.A.I backend did not return a readable stream.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

                buffer += decoder.decode(value, { stream: true });
                let boundaryIndex = buffer.indexOf('\n\n');

                while (boundaryIndex !== -1) {
                    const rawChunk = buffer.slice(0, boundaryIndex);
                    buffer = buffer.slice(boundaryIndex + 2);
                    boundaryIndex = buffer.indexOf('\n\n');

                    const event = this.parseSseChunk(rawChunk);
                    if (!event) continue;

                    if (event.type === 'status') {
                        yield {
                            type: 'status',
                            phase: event.data?.phase || '',
                            message: event.data?.message || 'Working...'
                        };
                        continue;
                    }

                    if (event.type === 'answer_delta') {
                        const delta = typeof event.data?.delta === 'string' ? event.data.delta : '';
                        if (delta) yield { type: 'text', delta };
                        continue;
                    }

                    if (event.type === 'complete') {
                        yield { type: 'complete', payload: event.data || {} };
                        continue;
                    }

                    if (event.type === 'error') {
                        const message = typeof event.data?.message === 'string'
                            ? event.data.message
                            : 'J.B.A.I backend error.';
                        throw new Error(message);
                    }
                }
            }
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

            const { provider, model, apiKey, baseUrl } = this.getActiveProviderConfig();
            const sanitizedContents = this.sanitizeApiContents(apiContents);
            const systemInstructionText = this.joinSystemInstruction(systemInstruction);

            if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                return this.requestJbAiText({
                    baseUrl,
                    contents: sanitizedContents,
                    signal,
                    toolsConfig,
                    titleMode
                });
            }

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

            if (provider === ChatApp.Config.PROVIDERS.GROQ) {
                return this.requestGroqText({
                    apiKey,
                    model,
                    contents: sanitizedContents,
                    systemInstructionText,
                    signal,
                    titleMode
                });
            }

            if (provider === ChatApp.Config.PROVIDERS.DEEPSEEK) {
                return this.requestDeepSeekText({
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

            const providerNote = provider === ChatApp.Config.PROVIDERS.JBAI
                ? '- Tool note: J.B.A.I mode is grounded by the backend web search pipeline.'
                : provider === ChatApp.Config.PROVIDERS.GOOGLE
                    ? '- Tool note: Google Search and Code Execution can be enabled from Settings.'
                    : `- Tool note: External Search/Code tools are unavailable on ${this.getProviderLabel(provider)} direct mode.`;

            let baseContext = `You are J.B.A.I., a helpful and context-aware assistant. You were created by Jeremiah (gokuthug1).
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

--- IMAGE GENERATION SYSTEM ---
If the user explicitly asks you to generate, create, make, draw, paint, or design an image/picture, you can trigger our automatic image generation engine by writing exactly this block in your response:
[IMAGE_GEN: detailed prompt describing the image in English]

Rules for Image Generation:
1. ONLY trigger image generation when the user explicitly asks for an image/picture. Never generate one randomly or unsolicited.
2. The prompt inside the [IMAGE_GEN: ...] tag should be highly detailed, descriptive, and written in English (e.g., [IMAGE_GEN: A beautiful oil painting of a cat playing with a red ball of yarn on a wooden floor, soft lighting, detailed texture]).
3. You can write normal conversational text before or after the tag.

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

            const currentSkill = ChatApp.State.activeSkillForGeneration || ChatApp.State.activeSkill;
            if (currentSkill && currentSkill.instructions) {
                baseContext += `\n\n--- ACTIVE SKILL INSTRUCTIONS ---\n${currentSkill.instructions.trim()}\n\nPlease abide by these skill instructions above all else.`;
            }
            
            return baseContext;
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
                const { provider } = ChatApp.Store.getActiveProviderSettings();
                if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                    return ChatApp.Utils.deriveChatTitle(userText);
                }

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
                const { provider } = ChatApp.Store.getActiveProviderSettings();
                if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                    yield* this.streamJbAiResponse({
                        contents: apiContents,
                        signal,
                        toolsConfig
                    });
                    return;
                }

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
                    yield { type: 'text', delta: chunk };
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
            ChatApp.UI.cacheElements();
            ChatApp.UI.initTooltips();
            ChatApp.UI.initSlashAutocomplete();
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
            elements.promptLauncherButton.addEventListener('click', () => ChatApp.UI.openPromptLibrary());
            elements.attachFileButton.addEventListener('click', () => elements.fileInput.click());
            elements.fileInput.addEventListener('change', Controller.handleFileSelection.bind(Controller));
            if (elements.clearSkillBtn) {
                elements.clearSkillBtn.addEventListener('click', () => {
                    ChatApp.State.activeSkill = null;
                    elements.activeSkillContainer.style.display = 'none';
                    ChatApp.UI.renderActiveCommandPill();
                    ChatApp.UI.showToast('Active skill cleared');
                });
            }

            // New feature bindings
            const profileBtn = document.getElementById('profile-widget');
            if (profileBtn) profileBtn.addEventListener('click', () => ChatApp.UI.renderSettingsModal());

            const addFolderBtn = document.getElementById('add-folder-btn');
            if (addFolderBtn) addFolderBtn.addEventListener('click', () => {
                const name = prompt("Enter new folder name:");
                if (name && name.trim()) ChatApp.Folders.createFolder(name.trim());
            });

            const tabs = document.querySelectorAll('.sidebar-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    ChatApp.State.activeTab = tab.dataset.tab;
                    const folderActions = document.querySelector('.folder-actions');
                    if (folderActions) folderActions.style.display = ChatApp.State.activeTab === 'chats' ? 'flex' : 'none';
                    ChatApp.UI.renderSidebar();
                    if (ChatApp.State.activeTab === 'mystuff') ChatApp.UI.renderMyStuffDashboard();
                    else ChatApp.UI.renderChatArea();
                });
            });

            const canvasTabs = document.querySelectorAll('.canvas-tab');
            canvasTabs.forEach(tab => {
                tab.addEventListener('click', () => ChatApp.UI.switchCanvasTab(tab.dataset.tab));
            });

            const canvasCloseBtn = document.getElementById('canvas-close-btn');
            if (canvasCloseBtn) canvasCloseBtn.addEventListener('click', () => ChatApp.UI.closeCanvasPanel());

            const runBtn = document.getElementById('canvas-run-btn');
            if (runBtn) runBtn.addEventListener('click', () => ChatApp.UI.runCanvasCode());

            const browserGoBtn = document.getElementById('browser-go-btn');
            if (browserGoBtn) browserGoBtn.addEventListener('click', () => ChatApp.UI.navigateBrowser(document.getElementById('browser-address-input')?.value || ''));

            const browserAddressInput = document.getElementById('browser-address-input');
            if (browserAddressInput) browserAddressInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') ChatApp.UI.navigateBrowser(browserAddressInput.value); });

            const browserScrapeBtn = document.getElementById('browser-scrape-btn');
            if (browserScrapeBtn) browserScrapeBtn.addEventListener('click', () => ChatApp.UI.scrapeCurrentBrowserPage());

            const myStuffSearch = document.getElementById('my-stuff-search');
            if (myStuffSearch) myStuffSearch.addEventListener('input', () => ChatApp.UI.renderMyStuffDashboard());

            elements.sidebarToggle.addEventListener('click', () => { const isOpen = elements.body.classList.toggle('sidebar-open'); elements.sidebarToggle.setAttribute('aria-expanded', isOpen.toString()); });
            elements.sidebarBackdrop.addEventListener('click', () => elements.body.classList.remove('sidebar-open'));
            elements.messageArea.addEventListener('click', Controller.handleMessageAreaClick.bind(Controller));
            elements.fullscreenCloseBtn.addEventListener('click', Controller.closeFullscreenPreview.bind(Controller));
            elements.fullscreenOverlay.addEventListener('click', (e) => { if (e.target === elements.fullscreenOverlay) { Controller.closeFullscreenPreview(); } });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && elements.body.classList.contains('modal-open')) { Controller.closeFullscreenPreview(); } });
            let bodyDragCounter = 0;
            elements.body.addEventListener('dragenter', (e) => {
                const isFileDrag = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
                if (!isFileDrag) return;
                e.preventDefault();
                e.stopPropagation();
                bodyDragCounter++;
                const wrapper = document.querySelector('.chat-input-wrapper');
                if (wrapper) wrapper.classList.add('file-drag-over');
            });
            elements.body.addEventListener('dragover', (e) => {
                const isFileDrag = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
                if (!isFileDrag) return;
                e.preventDefault();
                e.stopPropagation();
            });
            elements.body.addEventListener('dragleave', (e) => {
                const isFileDrag = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
                if (!isFileDrag) return;
                e.preventDefault();
                e.stopPropagation();
                bodyDragCounter--;
                if (bodyDragCounter <= 0) {
                    bodyDragCounter = 0;
                    const wrapper = document.querySelector('.chat-input-wrapper');
                    if (wrapper) wrapper.classList.remove('file-drag-over');
                }
            });
            elements.body.addEventListener('drop', (e) => {
                const isFileDrag = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
                if (!isFileDrag) return;
                e.preventDefault();
                e.stopPropagation();
                bodyDragCounter = 0;
                const wrapper = document.querySelector('.chat-input-wrapper');
                if (wrapper) wrapper.classList.remove('file-drag-over');
                if (e.dataTransfer?.files?.length > 0) {
                    Controller.addFilesToState(e.dataTransfer.files);
                }
            });
            // Custom Context Menu
            this.initCustomContextMenu();
            
            window.addEventListener('beforeunload', () => {
                ChatApp.UI._revokeFilePreviewUrls();
                ChatApp.State.revokeGeneratedDownloadUrls();
            });
        },
        initCustomContextMenu() {
            const menu = document.getElementById('custom-context-menu');
            if (!menu) return;
            
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                menu.innerHTML = '';
                
                const items = this.getContextMenuItems(e.target);
                items.forEach(item => {
                    if (item.divider) {
                        const div = document.createElement('div');
                        div.className = 'context-menu-divider';
                        menu.appendChild(div);
                        return;
                    }
                    const el = document.createElement('div');
                    el.className = 'context-menu-item' + (item.danger ? ' danger' : '');
                    el.innerHTML = `<span class="context-menu-icon">${item.icon}</span><span>${item.label}</span>`;
                    el.addEventListener('click', () => { menu.style.display = 'none'; item.action(); });
                    menu.appendChild(el);
                });
                
                menu.style.display = 'block';
                
                // Position: ensure it doesn't go off-screen
                const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8);
                const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
                menu.style.left = `${x}px`;
                menu.style.top = `${y}px`;
            });
            
            document.addEventListener('click', () => { menu.style.display = 'none'; });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.style.display = 'none'; });
            window.addEventListener('blur', () => { menu.style.display = 'none'; });
        },
        getContextMenuItems(target) {
            const ICONS = {
                COPY: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
                PASTE: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
                DELETE: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
                EDIT: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
                NEW_CHAT: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
                RELOAD: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
                SELECT_ALL: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
                ZOOM: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>',
                FOLDER: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
            };
            
            const items = [];
            const selection = window.getSelection().toString().trim();
            
            // Text selection actions
            if (selection) {
                items.push({ icon: ICONS.COPY, label: 'Copy', action: () => ChatApp.Utils.copyToClipboard(selection) });
                items.push({ divider: true });
            }
            
            // Chat input context
            const chatInput = target.closest('#chat-input');
            if (chatInput) {
                if (!selection) {
                    items.push({ icon: ICONS.PASTE, label: 'Paste', action: async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            chatInput.value += text;
                            chatInput.dispatchEvent(new Event('input'));
                        } catch(e) { ChatApp.UI.showToast('Clipboard access denied', 'error'); }
                    }});
                }
                items.push({ icon: ICONS.SELECT_ALL, label: 'Select All', action: () => chatInput.select() });
                items.push({ divider: true });
            }
            
            // Message context
            const messageEl = target.closest('.message');
            if (messageEl) {
                const messageId = messageEl.dataset.messageId;
                const contentEl = messageEl.querySelector('.message-content');
                const rawText = contentEl ? contentEl.innerText : '';
                if (rawText && !selection) {
                    items.push({ icon: ICONS.COPY, label: 'Copy Message', action: () => ChatApp.Utils.copyToClipboard(rawText) });
                }
                if (messageId) {
                    items.push({ icon: ICONS.DELETE, label: 'Delete Message', danger: true, action: () => ChatApp.Controller.deleteMessage(messageId) });
                }
                items.push({ divider: true });
            }
            
            // Conversation sidebar item context
            const convoItem = target.closest('.conversation-item');
            if (convoItem) {
                const chatId = convoItem.dataset.chatId;
                items.push({ icon: ICONS.EDIT, label: 'Rename', action: () => {
                    const titleEl = convoItem.querySelector('.conversation-title');
                    if (titleEl) titleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                }});
                items.push({ icon: ICONS.FOLDER, label: 'Move to Folder', action: () => {
                    const folderBtn = convoItem.querySelector('.folder-btn');
                    if (folderBtn) folderBtn.click();
                }});
                items.push({ icon: ICONS.DELETE, label: 'Delete Chat', danger: true, action: () => ChatApp.Controller.deleteConversation(chatId) });
                items.push({ divider: true });
            }
            
            // Image context
            const imgEl = target.closest('img');
            if (imgEl && !target.closest('.avatar-preview') && !target.closest('.profile-avatar')) {
                items.push({ icon: ICONS.ZOOM, label: 'View Full Size', action: () => ChatApp.UI.showFullscreenPreview(imgEl.src, 'image') });
                items.push({ icon: ICONS.COPY, label: 'Copy Image URL', action: () => ChatApp.Utils.copyToClipboard(imgEl.src) });
                items.push({ divider: true });
            }
            
            // Always-present items
            items.push({ icon: ICONS.NEW_CHAT, label: 'New Chat', action: () => ChatApp.Controller.startNewChat() });
            items.push({ icon: ICONS.RELOAD, label: 'Refresh', action: () => location.reload() });
            
            return items;
        },
        setJbAiBackendStatus(statusUpdate) {
            const current = ChatApp.State.jbAiBackend || {};
            ChatApp.State.jbAiBackend = {
                ...current,
                ...statusUpdate,
                baseUrl: ChatApp.Utils.normalizeJbAiBaseUrl(statusUpdate?.baseUrl ?? current.baseUrl),
                checkedAt: statusUpdate?.checkedAt ?? current.checkedAt ?? 0,
                detail: typeof statusUpdate?.detail === 'string' ? statusUpdate.detail : (current.detail || '')
            };
            ChatApp.UI.toggleSendButtonState();
            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();
            return ChatApp.State.jbAiBackend;
        },
        markJbAiBackendStatusUnknown(baseUrl = '') {
            const normalizedBaseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrl || ChatApp.Store.getProviderSettings().baseUrls?.jbai || '');
            if (ChatApp.State.skillCatalog.baseUrl && ChatApp.State.skillCatalog.baseUrl !== normalizedBaseUrl) {
                ChatApp.State.skillCatalog = {
                    status: 'idle',
                    items: [],
                    baseUrl: normalizedBaseUrl,
                    error: ''
                };
            }
            const status = normalizedBaseUrl
                ? ChatApp.Config.JBAI_BACKEND_STATES.UNKNOWN
                : ChatApp.Config.JBAI_BACKEND_STATES.MISSING;
            return this.setJbAiBackendStatus({
                status,
                baseUrl: normalizedBaseUrl,
                checkedAt: 0,
                detail: ''
            });
        },
        async refreshJbAiBackendStatus({ force = false, silent = true, baseUrlOverride = '' } = {}) {
            const baseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrlOverride || ChatApp.Store.getProviderSettings().baseUrls?.jbai || '');
            const current = ChatApp.State.jbAiBackend;

            if (
                !force &&
                current.baseUrl === baseUrl &&
                current.status !== ChatApp.Config.JBAI_BACKEND_STATES.UNKNOWN &&
                current.status !== ChatApp.Config.JBAI_BACKEND_STATES.CHECKING
            ) {
                return current;
            }

            this.setJbAiBackendStatus({
                status: baseUrl ? ChatApp.Config.JBAI_BACKEND_STATES.CHECKING : ChatApp.Config.JBAI_BACKEND_STATES.MISSING,
                baseUrl,
                detail: ''
            });

            const result = await ChatApp.Api.checkJbAiBackend(baseUrl);
            this.setJbAiBackendStatus(result);

            if (result.status === ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED) {
                await this.ensureSkillCatalog({ force, baseUrlOverride: result.baseUrl });
            } else if (ChatApp.State.skillCatalog.baseUrl !== result.baseUrl) {
                ChatApp.State.skillCatalog = {
                    status: 'idle',
                    items: [],
                    baseUrl: result.baseUrl || '',
                    error: ''
                };
            }

            if (!silent) {
                const presentation = ChatApp.UI.getJbAiStatusPresentation(result);
                const toastType = result.status === ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED ? 'success' : 'error';
                ChatApp.UI.showToast(presentation.label, toastType, 3200);
            }

            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();
            return result;
        },
        async ensureSkillCatalog({ force = false, baseUrlOverride = '' } = {}) {
            const baseUrl = ChatApp.Utils.normalizeJbAiBaseUrl(baseUrlOverride || ChatApp.State.jbAiBackend.baseUrl || ChatApp.Store.getProviderSettings().baseUrls?.jbai || '');
            if (!baseUrl || ChatApp.State.jbAiBackend.status !== ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED) {
                return ChatApp.State.skillCatalog.items;
            }

            const current = ChatApp.State.skillCatalog;
            if (!force && current.status === 'loaded' && current.baseUrl === baseUrl) {
                return current.items;
            }

            ChatApp.State.skillCatalog = {
                ...current,
                status: 'loading',
                baseUrl,
                error: ''
            };
            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();

            try {
                const items = await ChatApp.Api.fetchJbAiSkillCatalog(baseUrl);
                ChatApp.State.skillCatalog = {
                    status: 'loaded',
                    items,
                    baseUrl,
                    error: ''
                };
            } catch (error) {
                ChatApp.State.skillCatalog = {
                    status: 'error',
                    items: current.baseUrl === baseUrl ? current.items : [],
                    baseUrl,
                    error: error?.message || 'Unable to load shared skills from the J.B.A.I backend.'
                };
            }

            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();
            return ChatApp.State.skillCatalog.items;
        },
        getPromptCatalogItems() {
            return [
                ...ChatApp.Config.BUILTIN_PROMPT_PRESETS,
                ...ChatApp.State.customPresets,
                ...ChatApp.State.skillCatalog.items
            ];
        },
        getVisiblePromptCategories(items = this.getPromptCatalogItems()) {
            const knownOrder = ['Research', 'Writing', 'Build', 'Analyze', 'Skills'];
            const available = new Set(items.map((item) => item.category).filter(Boolean));
            return [
                ChatApp.Config.PROMPT_LIBRARY_DEFAULT_CATEGORY,
                ...knownOrder.filter((category) => available.has(category))
            ];
        },
        getActivePromptCategory(categories = this.getVisiblePromptCategories()) {
            const current = ChatApp.State.promptLibrary.category || ChatApp.Config.PROMPT_LIBRARY_DEFAULT_CATEGORY;
            if (categories.includes(current)) return current;
            return ChatApp.Config.PROMPT_LIBRARY_DEFAULT_CATEGORY;
        },
        setPromptCategory(category) {
            const categories = this.getVisiblePromptCategories();
            ChatApp.State.promptLibrary.category = categories.includes(category)
                ? category
                : ChatApp.Config.PROMPT_LIBRARY_DEFAULT_CATEGORY;
            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();
        },
        prefillPromptTemplate(promptId) {
            const item = this.getPromptCatalogItems().find((entry) => entry.id === promptId);
            if (!item) return;
            
            if (item.kind === 'skill' && item.instructions) {
                ChatApp.State.activeSkill = item;
                ChatApp.UI.renderActiveCommandPill();
                ChatApp.UI.showToast(`Skill activated: ${item.title || item.name}`);
            } else {
                ChatApp.UI.setChatInputValue(item.promptTemplate || '');
            }
            
            const promptOverlay = document.querySelector('[data-prompt-library-body="true"]')?.closest('.modal-overlay');
            if (promptOverlay) promptOverlay.remove();
        },
        switchProvider(provider) {
            const settings = ChatApp.Store.getProviderSettings();
            settings.provider = provider;
            ChatApp.Store.saveProviderSettings(settings);
            ChatApp.UI.toggleSendButtonState();
            ChatApp.UI.renderConversationSurface();
            ChatApp.UI.refreshPromptLibraryModal();
            if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                void this.refreshJbAiBackendStatus({ force: false, silent: true });
            }
            ChatApp.UI.showToast(`Provider switched to ${ChatApp.Api.getProviderLabel(provider)}.`, 'info', 2800);
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
            let userInput = ChatApp.UI.elements.chatInput.value.trim();
            const files = [...ChatApp.State.attachedFiles];
            const { provider } = ChatApp.Store.getActiveProviderSettings();
            
            // Detect active command from pill or text prefix
            let activeCommandName = null;
            if (ChatApp.State.activeCommand) {
                activeCommandName = ChatApp.State.activeCommand;
            } else if (userInput.startsWith('/')) {
                const spaceIdx = userInput.indexOf(' ');
                activeCommandName = spaceIdx !== -1 ? userInput.substring(0, spaceIdx) : userInput;
            }

            // Handle non-generation slash commands first
            if (activeCommandName === '/clear') {
                ChatApp.UI.elements.chatInput.value = "";
                ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
                ChatApp.State.activeCommand = null;
                ChatApp.State.activeSkill = null;
                ChatApp.UI.renderActiveCommandPill();
                this.startNewChat();
                ChatApp.UI.showToast('Conversation cleared', 'info');
                return;
            }

            if (activeCommandName === '/help') {
                ChatApp.UI.elements.chatInput.value = "";
                ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
                ChatApp.State.activeCommand = null;
                ChatApp.State.activeSkill = null;
                ChatApp.UI.renderActiveCommandPill();
                const helpMsg = {
                    id: ChatApp.Utils.generateUUID(),
                    content: {
                        role: "model",
                        parts: [{ text: `### J.B.A.I Slash Commands & Skills Help\n\nHere are the available commands:\n- **/image <prompt>** - Generate an AI image (uses FLUX.1 / Pollinations fallback)\n- **/clear** - Clear the conversation history\n- **/help** - Show this help menu\n- **/skills** - List all discovered skills from the catalog\n- **/<skill-name>** - Activate a custom skill (e.g., **/skill-creator**)` }]
                    }
                };
                ChatApp.State.addMessage(helpMsg);
                await ChatApp.UI.renderMessage(helpMsg);
                return;
            }

            if (activeCommandName === '/skills') {
                ChatApp.UI.elements.chatInput.value = "";
                ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
                ChatApp.State.activeCommand = null;
                ChatApp.State.activeSkill = null;
                ChatApp.UI.renderActiveCommandPill();
                const skills = ChatApp.State.skillCatalog?.items || [];
                let msgText = "### Discovered Skills Catalog\n\n";
                if (skills.length === 0) {
                    msgText += "_No skills found in the catalog._";
                } else {
                    skills.forEach(s => {
                        msgText += `- **/${s.id}** - ${s.title || s.name}: ${s.description}\n`;
                    });
                }
                const skillsMsg = {
                    id: ChatApp.Utils.generateUUID(),
                    content: {
                        role: "model",
                        parts: [{ text: msgText }]
                    }
                };
                ChatApp.State.addMessage(skillsMsg);
                await ChatApp.UI.renderMessage(skillsMsg);
                return;
            }

            if (activeCommandName === '/image') {
                let prompt = userInput;
                if (prompt.startsWith('/image')) {
                    prompt = prompt.replace(/^\/image\s*/, '').trim();
                }
                if (!prompt) {
                    ChatApp.UI.showToast('Please provide a prompt for image generation, e.g., /image a cute cat.', 'error');
                    return;
                }
                ChatApp.UI.elements.chatInput.value = "";
                ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
                ChatApp.State.activeCommand = null;
                ChatApp.State.activeSkill = null;
                ChatApp.UI.renderActiveCommandPill();
                
                await this.generateImage(prompt);
                return;
            }

            // Normal chat submission
            const validation = ChatApp.Utils.validateMessage(userInput, files);
            if (!validation.valid) { ChatApp.UI.showToast(validation.error, 'error'); return; }
            if (ChatApp.State.isGenerating) return;

            try {
                if (provider === ChatApp.Config.PROVIDERS.JBAI) {
                    const status = await ChatApp.Controller.refreshJbAiBackendStatus({
                        force: ChatApp.State.jbAiBackend.status !== ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED,
                        silent: true
                    });
                    if (status.status !== ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED) {
                        const presentation = ChatApp.UI.getJbAiStatusPresentation(status);
                        ChatApp.UI.showToast(presentation.label, 'error', 4200);
                        ChatApp.UI.renderConversationSurface();
                        return;
                    }
                }
                ChatApp.Api.getActiveProviderConfig();
            } catch (error) {
                ChatApp.UI.showToast(error.message || 'Provider settings are incomplete.', 'error');
                return;
            }

            if (provider === ChatApp.Config.PROVIDERS.JBAI && !userInput) {
                ChatApp.UI.showToast('J.B.A.I mode currently requires a text question. Attachments alone are not supported yet.', 'error');
                return;
            }
            if (provider === ChatApp.Config.PROVIDERS.JBAI && files.length > 0) {
                ChatApp.UI.showToast('Attachments stay in the chat, but J.B.A.I mode currently sends only the text prompt to the web search backend.', 'info', 4500);
            }

            // Capture active skill for text generation context, prepend tag
            const activeSkill = ChatApp.State.activeSkill;
            if (activeSkill) {
                const prefix = `/${activeSkill.id} `;
                if (!userInput.startsWith(prefix)) {
                    userInput = prefix + userInput;
                }
                ChatApp.State.activeSkillForGeneration = activeSkill;
            } else {
                ChatApp.State.activeSkillForGeneration = null;
            }

            // Clear input and pills immediately
            ChatApp.UI.elements.chatInput.value = "";
            ChatApp.UI.elements.chatInput.dispatchEvent(new Event('input'));
            ChatApp.State.activeCommand = null;
            ChatApp.State.activeSkill = null;
            ChatApp.UI.renderActiveCommandPill();
            
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

        async generateImage(prompt) {
            const userMsg = {
                id: ChatApp.Utils.generateUUID(),
                content: {
                    role: "user",
                    parts: [{ text: `/image ${prompt}` }]
                }
            };
            ChatApp.State.addMessage(userMsg);
            await ChatApp.UI.renderMessage(userMsg);
            
            await this.generateImageInline(prompt);
        },

        async generateImageInline(prompt) {
            ChatApp.State.setGenerating(true);
            const placeholderEl = await ChatApp.UI.renderMessage({ id: null }, true);
            ChatApp.UI.updateThinkingMessage(placeholderEl, "Generating image...");
            ChatApp.UI.scrollToBottom();
            
            try {
                let imageData = null;
                const isJbAiConnected = ChatApp.State.jbAiBackend && ChatApp.State.jbAiBackend.status === ChatApp.Config.JBAI_BACKEND_STATES.CONNECTED;
                
                if (isJbAiConnected) {
                    try {
                        const backendUrl = ChatApp.State.jbAiBackend.baseUrl || 'http://localhost:8000';
                        const response = await fetch(`${backendUrl}/v1/images/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: prompt })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            imageData = data.image_data;
                        }
                    } catch (err) {
                        console.warn("Backend image generation failed, falling back to direct Pollinations request:", err);
                    }
                }
                
                if (!imageData) {
                    const encodedPrompt = encodeURIComponent(prompt);
                    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
                    
                    const res = await fetch(fallbackUrl);
                    if (res.ok) {
                        const blob = await res.blob();
                        imageData = await ChatApp.Utils.blobToBase64(blob);
                    } else {
                        throw new Error("Failed to load image from Pollinations AI");
                    }
                }
                
                placeholderEl.classList.remove('thinking');
                placeholderEl.dataset.messageId = ChatApp.Utils.generateUUID();
                
                const assistantMsgId = ChatApp.Utils.generateUUID();
                const assistantText = `Here is your generated image for: **${ChatApp.Utils.escapeHTML(prompt)}**\n\n![${ChatApp.Utils.escapeHTML(prompt)}](${imageData})`;
                
                const assistantMessage = {
                    id: assistantMsgId,
                    content: {
                        role: "model",
                        parts: [{ text: assistantText }]
                    }
                };
                
                placeholderEl.innerHTML = '';
                ChatApp.State.addMessage(assistantMessage);
                
                const formattedHtml = await MessageFormatter.format(assistantText);
                
                placeholderEl.innerHTML = `
                    <div class="message-content">
                        ${formattedHtml}
                        <div class="image-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                            <a href="${imageData}" download="generated-image.jpg" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; background-color: var(--sidebar-hover); color: var(--text-color); border: 1px solid var(--border-color);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download Image
                            </a>
                        </div>
                    </div>
                `;
                
                ChatApp.UI.scrollToBottom();
            } catch (error) {
                placeholderEl.classList.remove('thinking');
                placeholderEl.innerHTML = `
                    <div class="message-content error-message">
                        Failed to generate image: ${error.message}
                    </div>
                `;
                ChatApp.UI.scrollToBottom();
            } finally {
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
            let completionPayload = null;

            try {
                const toolsConfig = ChatApp.State.toolsConfig;
                const isAgentMode = toolsConfig.agentMode === true;
                const { provider } = ChatApp.Store.getActiveProviderSettings();
                
                let systemText = await ChatApp.Api.getSystemContext(isAgentMode, provider);
                const skill = ChatApp.State.activeSkillForGeneration || ChatApp.State.activeSkill;
                if (skill) {
                    const skillRules = skill.instructions || skill.promptTemplate || '';
                    if (skillRules) {
                        systemText = `Active Skill Rules for [${skill.title || skill.name || skill.id}]:\n${skillRules}\n\n${systemText}`;
                    }
                }

                // Check for time/system requests
                const lastMsg = ChatApp.State.currentConversation[ChatApp.State.currentConversation.length - 1];
                let systemContextOverride = '';
                if (lastMsg && lastMsg.content && lastMsg.content.parts) {
                    const textVal = typeof lastMsg.content.parts === 'string' 
                        ? lastMsg.content.parts 
                        : (Array.isArray(lastMsg.content.parts) ? lastMsg.content.parts.map(p => p.text || '').join('') : '');
                    const textValLower = textVal.toLowerCase();
                    if (textValLower.includes('time') || textValLower.includes('date today') || textValLower.includes('current date')) {
                        systemContextOverride += `\n[Time Service]: The current user time is ${new Date().toString()}.`;
                    }
                    if (textValLower.includes('system info') || textValLower.includes('my specs') || textValLower.includes('browser info') || textValLower.includes('hardware specs') || textValLower.includes('screen resolution')) {
                        const isAllowed = await ChatApp.UI.ensureSystemInfoPermission();
                        if (isAllowed) {
                            const info = ChatApp.UI.getSystemInfoData();
                            systemContextOverride += `\n[System Info Service]: User System Info: ${JSON.stringify(info)}.`;
                        } else {
                            systemContextOverride += `\n[System Info Service]: Access Denied by User.`;
                        }
                    }
                }
                if (systemContextOverride) {
                    systemText = systemText + "\n\n" + systemContextOverride;
                }

                const systemInstruction = { parts: [{ text: systemText }] };
                
                const apiContents = ChatApp.State.currentConversation.map(msg => ({ role: msg.content.role, parts: msg.content.parts }));

                // 2. Start Stream
                const stream = ChatApp.Api.streamTextResponse(apiContents, systemInstruction, ChatApp.State.abortController.signal, toolsConfig);

                // 3. Process Stream Chunks
                for await (const event of stream) {
                    if (!event) continue;

                    if (event.type === 'status') {
                        ChatApp.UI.updateThinkingMessage(messageEl, event.message || 'Working...');
                        continue;
                    }

                    if (event.type === 'complete') {
                        completionPayload = event.payload || null;
                        if (!fullTextAccumulator && typeof completionPayload?.answer === 'string' && completionPayload.answer.trim()) {
                            if (!hasRemovedThinking) {
                                messageEl.classList.remove('thinking');
                                messageEl.dataset.messageId = messageId;
                                hasRemovedThinking = true;
                            }
                            fullTextAccumulator = completionPayload.answer.trim();
                            await ChatApp.UI.updateStreamingMessage(messageEl, fullTextAccumulator);
                            ChatApp.UI.scrollToBottom();
                        }
                        continue;
                    }

                    if (event.type !== 'text') continue;
                    const chunk = event.delta;
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
                let contentObj = { role: "model", parts: [{ text: rawModelText }] };
                const jbAiMetadata = completionPayload ? ChatApp.Api.mapJbAiCompletionPayload(completionPayload) : null;
                if (jbAiMetadata?.groundingMetadata) {
                    contentObj.groundingMetadata = jbAiMetadata.groundingMetadata;
                }
                let botMessageForState = { id: messageId, content: contentObj };
                if (jbAiMetadata?.searchMetadata) {
                    botMessageForState.searchMetadata = jbAiMetadata.searchMetadata;
                }
                
                // Check if the assistant wants to generate an image
                const imageGenMatch = rawModelText.match(/\[IMAGE_GEN:\s*([\s\S]+?)\]/i);
                let finalProcessed = processedModelText;
                let triggerImagePrompt = null;
                if (imageGenMatch) {
                    triggerImagePrompt = imageGenMatch[1].trim();
                    const cleanRaw = rawModelText.replace(/\[IMAGE_GEN:\s*([\s\S]+?)\]/gi, '').trim();
                    finalProcessed = processedModelText.replace(/\[IMAGE_GEN:\s*([\s\S]+?)\]/gi, '').trim();
                    
                    contentObj.parts[0].text = cleanRaw;
                    botMessageForState.content = contentObj;
                }

                await ChatApp.UI.finalizeBotMessage(messageEl, [{ text: finalProcessed }], messageId, botMessageForState);

                if (triggerImagePrompt) {
                    void this.generateImageInline(triggerImagePrompt);
                }

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
                 ChatApp.State.activeSkillForGeneration = null;
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
                    const chat = ChatApp.State.allConversations.find(c => String(c.id) === String(ChatApp.State.currentChatId));
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
            if (String(ChatApp.State.currentChatId) === String(chatId)) return;
            const chat = ChatApp.State.allConversations.find(c => String(c.id) === String(chatId));
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
                setTimeout(() => {
                    messageEl.remove();
                    if (ChatApp.State.currentConversation.length === 0) {
                        ChatApp.UI.renderConversationSurface();
                    } else {
                        ChatApp.UI.scrollToBottom();
                    }
                }, 400);
            }
            await this.saveCurrentChat();
            ChatApp.UI.showToast('Message deleted.');
        },
        deleteConversation(chatId) {
            if (!chatId) return;
            if (!confirm('Delete this conversation? This action cannot be undone.')) return;
            ChatApp.State.allConversations = ChatApp.State.allConversations.filter(c => String(c.id) !== String(chatId));
            ChatApp.Store.saveAllConversations();
            if (String(ChatApp.State.currentChatId) === String(chatId)) { this.startNewChat(); } else { ChatApp.UI.renderSidebar(); }
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
                localStorage.removeItem(ChatApp.Config.STORAGE_KEYS.JBAI_BACKEND_CONFIRMATION);
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

            // Handle Canvas Action Buttons
            const canvasBtn = event.target.closest('.code-canvas-badge');
            if (canvasBtn) {
                event.preventDefault();
                const wrapper = canvasBtn.closest('.code-block-wrapper');
                if (wrapper) {
                    const code = decodeURIComponent(wrapper.dataset.rawContent || '');
                    const lang = canvasBtn.dataset.lang || 'html';
                    ChatApp.UI.openCanvasPanel(code, lang === 'html' ? 'preview' : 'code');
                }
                return;
            }

            const mediaTarget = event.target.closest('.attachment-media, .svg-render-box img, .message-content img:not(.avatar)');
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
        applyDisplaySettings() {
            const config = ChatApp.Store.getToolsConfig();
            if (config.hideScrollbar) {
                document.body.classList.add('hide-scrollbar');
            } else {
                document.body.classList.remove('hide-scrollbar');
            }
            if (config.autoRunPreviews === false) {
                document.body.classList.add('hide-previews');
            } else {
                document.body.classList.remove('hide-previews');
            }
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

document.addEventListener('DOMContentLoaded', async () => {
    ChatApp.Controller.init();
    await ChatApp.Accounts.init();
});

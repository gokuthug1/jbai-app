// --- Constants ---
const API_URLS = {
    TEXT: 'https://jbai-app.onrender.com/api/generate',
    IMAGE: '/api/img-gen'
};
const STORAGE_KEYS = {
    THEME: 'jbai_theme',
    CONVERSATIONS: 'jbai_conversations'
};
const DEFAULT_THEME = 'light';

// --- Application State ---
const appState = {
    currentConversation: [],
    allConversations: [],
    currentChatId: null,
    ttsEnabled: false,
    selectedVoice: null,
    ttsVolume: 1,
    filteredVoices: [],
    isGenerating: false,
    typingInterval: null
};

// --- DOM Element References ---
const UIElements = {
    body: document.body,
    sidebarToggle: document.getElementById('sidebar-toggle'),
    newChatBtn: document.getElementById('new-chat-btn'),
    conversationList: document.getElementById('conversation-list'),
    messageArea: document.getElementById('message-area'),
    chatInput: document.getElementById('chat-input'),
    sendButton: document.getElementById('send-button'),
    settingsButton: document.getElementById('toggle-options-button')
};

// --- Helper Functions ---
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// --- Theme Management ---
function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
}

// --- Data Management ---
function saveAllConversations() {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(appState.allConversations));
}

function loadAllConversations() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        appState.allConversations = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse conversations, resetting.", e);
        appState.allConversations = [];
    }
}

// --- UI Rendering ---
function displayMessage(content, sender, messageId, isTyping = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.dataset.messageId = messageId;
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    if (isTyping) {
        messageEl.classList.add('thinking');
        contentEl.textContent = content || "●";
    } else {
        contentEl.innerHTML = (sender === 'bot') ? formatMessageContent(content) : escapeHTML(content);
        addCopyButtons(contentEl, content);
        // Add listeners for deletion
        let pressTimer = null;
        messageEl.addEventListener('click', e => { if (e.shiftKey) { e.preventDefault(); deleteMessage(messageId); } });
        messageEl.addEventListener('touchstart', () => { pressTimer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(50); deleteMessage(messageId); }, 800); }, { passive: true });
        messageEl.addEventListener('touchend', () => clearTimeout(pressTimer));
        messageEl.addEventListener('touchmove', () => clearTimeout(pressTimer));
    }
    
    messageEl.appendChild(contentEl);
    UIElements.messageArea.appendChild(messageEl);
    UIElements.messageArea.scrollTop = UIElements.messageArea.scrollHeight;
    return messageEl;
}

function formatMessageContent(text) {
    let html = escapeHTML(text);
    // Image markdown: [IMAGE: prompt](blob:url)
    html = html.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
        const safeFilename = alt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_').substring(0, 50) || 'generated-image';
        return `
        <div class="generated-image-wrapper">
            <p class="image-prompt-text"><em>Image Prompt: ${escapeHTML(alt)}</em></p>
            <div class="image-container">
                <img src="${url}" alt="${escapeHTML(alt)}" class="generated-image">
                <a href="${url}" download="${safeFilename}.png" class="download-image-button" title="Download Image">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M19 21H5" /></svg>
                </a>
            </div>
        </div>`;
    });
    // Standard markdown
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`);
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^((\s*[-*] .*\n?)+)/gm, match => `<ul>${match.trim().split('\n').map(item => `<li>${item.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`);
    html = html.replace(/^((\s*\d+\. .*\n?)+)/gm, match => `<ol>${match.trim().split('\n').map(item => `<li>${item.replace(/^\s*\d+\. /, '')}</li>`).join('')}</ol>`);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Wrap non-block lines in <p> tags
    return html.split('\n').map(line => line.trim()).filter(line => line).map(line => (!line.match(/^<(p|h[1-3]|ul|ol|pre|li|strong|em|code|div)/)) ? `<p>${line}</p>` : line).join('');
}

function addCopyButtons(contentEl, rawText) {
    if (rawText.startsWith('[IMAGE:')) return;
    const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    // Message copy button
    if (!contentEl.querySelector('.copy-button')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.title = 'Copy full message';
        copyBtn.innerHTML = copyIcon;
        copyBtn.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(rawText).then(() => {
                copyBtn.innerHTML = checkIcon;
                setTimeout(() => { copyBtn.innerHTML = copyIcon; }, 2000);
            });
        });
        contentEl.appendChild(copyBtn);
    }
    // Code block copy buttons
    contentEl.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.copy-code-button')) return;
        const code = pre.querySelector('code');
        const copyCodeBtn = document.createElement('button');
        copyCodeBtn.className = 'copy-code-button';
        copyCodeBtn.innerHTML = copyIcon + 'Copy';
        copyCodeBtn.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(code.textContent).then(() => {
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => { copyCodeBtn.innerHTML = copyIcon + 'Copy'; }, 2000);
            });
        });
        pre.appendChild(copyCodeBtn);
    });
}

function loadSidebar() {
    UIElements.conversationList.innerHTML = '';
    appState.allConversations.sort((a, b) => b.id - a.id).forEach(chat => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.chatId = chat.id;
        if (chat.id === appState.currentChatId) item.classList.add('active');
        const titleSpan = document.createElement('span');
        titleSpan.className = 'conversation-title';
        titleSpan.textContent = chat.title || 'Untitled Chat';
        titleSpan.title = chat.title || 'Untitled Chat';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete Chat';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`;
        item.addEventListener('click', () => loadChat(chat.id));
        deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteConversation(chat.id); });
        item.appendChild(titleSpan);
        item.appendChild(deleteBtn);
        UIElements.conversationList.appendChild(item);
    });
}

// --- Chat Logic ---
function startNewChat() {
    if (appState.isGenerating) {
        clearInterval(appState.typingInterval);
        appState.isGenerating = false;
    }
    appState.currentConversation = [];
    appState.currentChatId = null;
    UIElements.messageArea.innerHTML = '';
    UIElements.chatInput.value = '';
    UIElements.chatInput.style.height = 'auto';
    document.querySelectorAll('.conversation-item.active').forEach(el => el.classList.remove('active'));
}

function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const index = appState.currentConversation.findIndex(msg => msg.id === messageId);
    if (index > -1) {
        appState.currentConversation.splice(index, 1);
        const messageEl = document.querySelector(`[data-message-id='${messageId}']`);
        if (messageEl) messageEl.classList.add('fade-out');
        setTimeout(() => messageEl?.remove(), 400);
        saveCurrentChat();
    }
}

function deleteConversation(chatId) {
    if (confirm('Are you sure you want to delete this chat? This action is permanent.')) {
        appState.allConversations = appState.allConversations.filter(c => c.id !== chatId);
        saveAllConversations();
        if (appState.currentChatId === chatId) {
            startNewChat();
        }
        loadSidebar();
    }
}

function loadChat(chatId) {
    const chat = appState.allConversations.find(c => c.id === chatId);
    if (!chat || !Array.isArray(chat.history)) {
        console.error("Chat not found or is corrupted:", chatId);
        return;
    }

    if (appState.isGenerating) {
        clearInterval(appState.typingInterval);
        appState.isGenerating = false;
    }
    appState.currentChatId = chatId;

    // Data migration for older message formats
    const migratedHistory = chat.history.map((msg, index) => {
        if (msg && msg.content && Array.isArray(msg.content.parts)) {
            return msg;
        }
        if (msg && msg.role && typeof msg.text !== 'undefined') {
            return {
                id: msg.id || (Date.now() + index),
                content: { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }
            };
        }
        return null;
    }).filter(Boolean);

    appState.currentConversation = migratedHistory;
    
    UIElements.messageArea.innerHTML = '';
    appState.currentConversation.forEach(msg => {
        const text = msg.content.parts[0]?.text || '';
        const sender = msg.content.role === 'model' ? 'bot' : 'user';
        displayMessage(text, sender, msg.id);
    });

    setTimeout(() => { UIElements.messageArea.scrollTop = UIElements.messageArea.scrollHeight; }, 0);
    loadSidebar();
}

async function saveCurrentChat() {
    if (appState.currentConversation.length === 0) return;

    if (appState.currentChatId) {
        const chat = appState.allConversations.find(c => c.id === appState.currentChatId);
        if (chat) chat.history = appState.currentConversation;
    } else if (appState.currentConversation.length >= 2) {
        const newTitle = await generateTitle(appState.currentConversation);
        appState.currentChatId = Date.now();
        appState.allConversations.push({ id: appState.currentChatId, title: newTitle, history: appState.currentConversation });
    }
    saveAllConversations();
    loadSidebar();
}

async function handleChatSubmission() {
    const userMessage = UIElements.chatInput.value.trim();
    if (!userMessage || appState.isGenerating) return;

    const userMessageId = Date.now();
    appState.currentConversation.push({ id: userMessageId, content: { role: "user", parts: [{ text: userMessage }] } });
    displayMessage(userMessage, 'user', userMessageId);
    
    UIElements.chatInput.value = ""; 
    UIElements.chatInput.style.height = 'auto';

    if (userMessage.toLowerCase().startsWith('/img ')) {
        const prompt = userMessage.substring(5).trim();
        if (prompt) generateImageResponse(prompt);
        else displayMessage("Please provide a prompt after `/img`. For example: `/img a cat in a spaceship`", 'bot', Date.now() + 1);
    } else {
        generateTextResponse();
    }
}

// --- API Calls ---
async function getSystemContext() {
    return `You are a helpful assistant named J.B.A.I. Use standard markdown. You have access to the user's real-time context. Use it to answer relevant questions.\nCurrent Context:\n- Current Date/Time: ${new Date().toLocaleString()}\n---`;
}

async function generateTitle(chatHistory) {
    const safeHistory = chatHistory.filter(h => h.content?.parts?.[0] && !h.content.parts[0].text.startsWith('[IMAGE:'));
    if (safeHistory.length < 2) return "New Chat";
    const prompt = `Based on this conversation, create a short, concise title (4-5 words max). Output only the title, no quotes.\nUser: ${safeHistory[0].content.parts[0].text}\nAI: ${safeHistory[1].content.parts[0].text}`;
    try {
        const response = await fetch(API_URLS.TEXT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        });
        if (!response.ok) return "New Chat";
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text.trim().replace(/["*]/g, '') || "New Chat";
    } catch (error) {
        console.error("Title generation failed:", error);
        return "New Chat";
    }
}

async function generateTextResponse() {
    appState.isGenerating = true;
    const thinkingMessage = displayMessage(null, 'bot', null, true);
    const systemInstruction = { parts: [{ text: await getSystemContext() }] };
    const apiContents = appState.currentConversation.map(msg => msg.content);

    try {
        const response = await fetch(API_URLS.TEXT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: apiContents, systemInstruction })
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!botResponseText) throw new Error("Invalid or empty API response.");

        thinkingMessage.remove();
        
        const botMessageId = Date.now() + 1;
        const botMessageEl = displayMessage('', 'bot', botMessageId);
        const contentEl = botMessageEl.querySelector('.message-content');
        
        let i = 0;
        appState.typingInterval = setInterval(() => {
            if (i < botResponseText.length) {
                contentEl.innerHTML += escapeHTML(botResponseText[i]);
                i++;
                if (i % 10 === 0) UIElements.messageArea.scrollTop = UIElements.messageArea.scrollHeight;
            } else {
                clearInterval(appState.typingInterval);
                contentEl.innerHTML = formatMessageContent(botResponseText);
                addCopyButtons(contentEl, botResponseText);
                appState.currentConversation.push({ id: botMessageId, content: { role: "model", parts: [{ text: botResponseText }] } });
                saveCurrentChat();
                speakTTS(botResponseText);
                appState.isGenerating = false;
            }
        }, 1);

    } catch (error) {
        thinkingMessage.remove();
        displayMessage(`Error: ${error.message}`, 'bot', Date.now() + 1);
        appState.isGenerating = false;
    }
}

async function generateImageResponse(prompt) {
    appState.isGenerating = true;
    const thinkingMessage = displayMessage(`Generating image of "${prompt}"...`, 'bot', Date.now(), true);
    try {
        const response = await fetch(API_URLS.IMAGE, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        if (!imageUrl) throw new Error("Could not create image URL from the response.");
        thinkingMessage.remove();
        const botMessageId = Date.now() + 1;
        const imageMarkdown = `[IMAGE: ${prompt}](${imageUrl})`;
        appState.currentConversation.push({ id: botMessageId, content: { role: "model", parts: [{ text: imageMarkdown }] } });
        displayMessage(imageMarkdown, 'bot', botMessageId);
        saveCurrentChat();
    } catch(error) {
        thinkingMessage.remove();
        displayMessage(`Image Generation Error: ${error.message}`, 'bot', Date.now() + 1);
    } finally {
        appState.isGenerating = false;
    }
}

// --- Settings & TTS ---
function showSettingsModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    const card = document.createElement('div');
    card.className = 'settings-card';
    card.innerHTML = `<h2>Settings</h2>
        <div class="settings-row"><label for="themeSelect">Theme</label><select id="themeSelect"><option value="light">Light</option><option value="dark">Dark</option><option value="midnight">Midnight</option><option value="dracula">Dracula</option><option value="solarized-light">Solarized Light</option></select></div>
        <div class="settings-row"><label>Enable TTS</label><label class="switch"><input type="checkbox" id="ttsToggle"><span class="slider"></span></label></div>
        <div class="settings-row"><label>Voice Volume</label><input type="range" min="0" max="1" step="0.1" value="${appState.ttsVolume}" id="volumeSlider"></div>
        <div class="settings-row"><label for="voiceSelect">Bot Voice</label><select id="voiceSelect" disabled></select></div>
        <hr>
        <button id="upload-data-btn" type="button">Upload Data</button>
        <button id="download-data-btn" type="button">Download Data</button>
        <button id="delete-data-btn" type="button" class="btn-danger">Delete All Data</button>
        <button id="closeSettingsBtn" type="button" class="btn-primary" style="margin-top: 20px;">Close</button>`;
    overlay.appendChild(card);
    UIElements.body.appendChild(overlay);

    document.getElementById('themeSelect').value = localStorage.getItem(STORAGE_KEYS.THEME) || DEFAULT_THEME;
    document.getElementById('themeSelect').addEventListener('change', (e) => applyTheme(e.target.value));
    document.getElementById('ttsToggle').checked = appState.ttsEnabled;
    document.getElementById('ttsToggle').addEventListener('change', (e) => { appState.ttsEnabled = e.target.checked; });
    document.getElementById('volumeSlider').addEventListener('input', (e) => { appState.ttsVolume = parseFloat(e.target.value); });
    document.getElementById('voiceSelect').addEventListener('change', (e) => { if(appState.filteredVoices[e.target.value]) appState.selectedVoice = appState.filteredVoices[e.target.value]; });
    
    document.getElementById('upload-data-btn').addEventListener('click', handleDataUpload);
    document.getElementById('download-data-btn').addEventListener('click', downloadAllData);
    document.getElementById('delete-data-btn').addEventListener('click', deleteAllData);
    document.getElementById('closeSettingsBtn').addEventListener('click', () => overlay.remove());
    
    populateVoiceList();
}

function speakTTS(text) {
    if (!window.speechSynthesis || !appState.ttsEnabled || !text.trim() || text.startsWith('[IMAGE:')) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, 'Code block.'));
    utterance.volume = appState.ttsVolume;
    if (appState.selectedVoice) utterance.voice = appState.selectedVoice;
    window.speechSynthesis.speak(utterance);
}

function populateVoiceList() {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect || typeof speechSynthesis === 'undefined') return;
    const setVoices = () => {
        appState.filteredVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
        voiceSelect.innerHTML = '';
        if (appState.filteredVoices.length === 0) {
            voiceSelect.disabled = true; voiceSelect.innerHTML = '<option>No English voices</option>'; return;
        }
        voiceSelect.disabled = false;
        let selectedIdx = 0;
        appState.filteredVoices.forEach((voice, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
            if (appState.selectedVoice && appState.selectedVoice.name === voice.name) selectedIdx = i;
        });
        voiceSelect.selectedIndex = selectedIdx;
        if (!appState.selectedVoice) appState.selectedVoice = appState.filteredVoices[0];
    };
    setVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setVoices;
}

// --- Data Import/Export ---
function downloadAllData() {
    const dataStr = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!dataStr || dataStr === '[]') { alert('No conversation data to download.'); return; }
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jbai_conversations_backup.json';
    UIElements.body.appendChild(a); a.click(); UIElements.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleDataUpload() {
    let fileInput = document.getElementById('upload-data-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.id = 'upload-data-input';
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.style.display = 'none';
        UIElements.body.appendChild(fileInput);
        fileInput.addEventListener('change', processUploadedFile);
    }
    fileInput.click();
}

function processUploadedFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) throw new Error("Data is not a valid array.");
            const isValid = importedData.every(c => c.id && c.title && Array.isArray(c.history));
            if (!isValid) throw new Error("JSON has incorrect format.");
            if (confirm('Overwrite all current conversations with this data? This cannot be undone.')) {
                localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(importedData));
                alert('Data successfully imported. The application will now reload.');
                location.reload();
            }
        } catch (error) {
            alert(`Error importing data: ${error.message}`);
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = () => { alert('Error reading the file.'); event.target.value = ''; };
    reader.readAsText(file);
}

function deleteAllData() {
    if (confirm('Are you absolutely sure you want to delete ALL your chat data? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
        alert('All chat data has been deleted.');
        location.reload();
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    UIElements.newChatBtn.addEventListener('click', startNewChat);
    UIElements.sidebarToggle.addEventListener('click', () => UIElements.body.classList.toggle('sidebar-open'));
    UIElements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmission(); }
    });
    UIElements.chatInput.addEventListener('input', () => {
        UIElements.chatInput.style.height = 'auto';
        UIElements.chatInput.style.height = `${UIElements.chatInput.scrollHeight}px`;
    });
    UIElements.sendButton.addEventListener('click', handleChatSubmission);
    UIElements.settingsButton.addEventListener('click', showSettingsModal);
}

// --- App Initialization ---
function init() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || DEFAULT_THEME;
    applyTheme(savedTheme);
    loadAllConversations();
    if (window.innerWidth > 768) {
        UIElements.body.classList.add('sidebar-open');
    }
    loadSidebar();
    startNewChat();
    setupEventListeners();
}

// Start the application once the DOM is fully loaded.
init();

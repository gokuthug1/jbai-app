import { SyntaxHighlighter } from './syntaxHighlighter.js';

const LANGUAGE_MAP = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', js: 'JavaScript',
    lua: 'Lua', python: 'Python', py: 'Python', xml: 'XML', svg: 'SVG',
    sh: 'Shell', bash: 'Shell', json: 'JSON',
    bat: 'Batch', cmd: 'Batch', batch: 'Batch',
    cpp: 'C++', cs: 'C#', csharp: 'C#', java: 'Java', go: 'Go', rust: 'Rust',
    sql: 'SQL', yaml: 'YAML', md: 'Markdown', latex: 'LaTeX',
    mermaid: 'Mermaid', typescript: 'TypeScript', ts: 'TypeScript',
    php: 'PHP', ruby: 'Ruby', rb: 'Ruby', swift: 'Swift',
    kotlin: 'Kotlin', kt: 'Kotlin', dart: 'Dart', r: 'R'
};

const EMOJI_MAP = {
    rocket: '🚀', smile: '😄', joy: '😂', heart: '❤️', fire: '🔥', thumbsup: '👍', thumbsdown: '👎',
    check: '✅', warning: '⚠️', info: 'ℹ️', star: '⭐', sparkles: '✨', zap: '⚡', bug: '🐛',
    tada: '🎉', hammer: '🔨', robot: '🤖', alien: '👽', ghost: '👻', skull: '💀', poop: '💩',
    eyes: '👀', brain: '🧠', handshake: '🤝', pray: '🙏', raised_hands: '🙌', clap: '👏',
    partying_face: '🥳', sunglasses: '😎', nerd: '🤓', monocle: '🧐', zzz: '💤', sweat_smile: '😅'
};

function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return (str == null ? '' : String(str)).replace(/[&<>"']/g, m => map[m]);
}

function sanitizeUrl(url, allowedProtocols = ['http:', 'https:']) {
    if (!url || typeof url !== 'string') return null;
    try {
        const parsed = new URL(url.trim(), window.location.origin);
        return allowedProtocols.includes(parsed.protocol) ? parsed.href : null;
    } catch { return null; }
}

function sanitizeImageUrl(url) {
    const safeUrl = sanitizeUrl(url, ['http:', 'https:', 'blob:', 'data:']);
    if (safeUrl?.startsWith('data:')) {
        return /^data:image\/(?:png|jpeg|jpg|gif|webp|bmp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(safeUrl) ? safeUrl : null;
    }
    return safeUrl;
}

function sanitizeHtmlTag(tag) {
    const match = /^(<\/?)(u|details|summary|div|span)(\s+[^>]*?)?>/i.exec(tag);
    if (!match) return '';
    const isClose = match[1] === '</';
    const name = match[2].toLowerCase();
    if (isClose) return `</${name}>`;
    
    const attrs = match[3] || '';
    let safeAttrs = '';
    const attrRegex = /([a-z]+)="([^"]*)"/gi;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        if (['class', 'id', 'open'].includes(attrName)) {
            safeAttrs += ` ${attrName}="${escapeHtml(attrMatch[2])}"`;
        }
    }
    return `<${name}${safeAttrs}>`;
}

// --------------------------------------------------------------------------------
// CUSTOM MARKDOWN LEXER & PARSER
// A fully featured, dependency-free tokenizer/parser to securely process GFM Markdown
// --------------------------------------------------------------------------------

const INLINE_RULES = [
    { type: 'escape', regex: /^\\([\\`*{}\[\]()#+\-.!_>~|=])/ },
    { type: 'footnote', regex: /^\[\^([a-zA-Z0-9]+)\]/ },
    { type: 'image', regex: /^!\[([^\]]*)\]\(([^)]+)\)/ },
    { type: 'link', regex: /^\[([^\]]+)\]\(([^)]+(?:\([^)]+\)[^)]*)*)\)/ },
    { type: 'ref-link', regex: /^\[([^\]]+)\]\[([^\]]+)\]/ },
    { type: 'strong-em', regex: /^\*\*\*([^*]+)\*\*\*/ },
    { type: 'strong', regex: /^\*\*([^*]+)\*\*/ },
    { type: 'strong-ul', regex: /^__([^_]+)__/ },
    { type: 'em', regex: /^\*([^*]+)\*/ },
    { type: 'em-ul', regex: /^_([^_]+)_/ },
    { type: 'strike', regex: /^~~([^~]+)~~/ },
    { type: 'highlight', regex: /^==([^=]+)==/ },
    { type: 'spoiler', regex: /^\|\|([^|]+)\|\|/ },
    { type: 'code', regex: /^`([^`]+)`/ },
    { type: 'emoji', regex: /^:([a-z0-9_+-]+):/ },
    { type: 'html-tag', regex: /^(<\/?(?:u|details|summary|div|span)(?:\s+[^>]*)?>)/i },
    { type: 'placeholder', regex: /^(JBAIBLOCK\d+END)/ }
];

function lexInline(text) {
    let tokens = [];
    while (text) {
        let matched = false;
        for (let rule of INLINE_RULES) {
            let match = rule.regex.exec(text);
            if (match) {
                let token = { type: rule.type, raw: match[0] };
                if (rule.type === 'escape') token.val = match[1];
                if (rule.type === 'footnote') token.id = match[1];
                if (rule.type === 'emoji') token.code = match[1];
                if (['strong-em', 'strong', 'strong-ul', 'em', 'em-ul', 'strike', 'highlight', 'spoiler'].includes(rule.type)) {
                    token.tokens = lexInline(match[1]); // Recursive inline
                }
                if (rule.type === 'link' || rule.type === 'ref-link') {
                    token.tokens = lexInline(match[1]);
                    token.url = match[2];
                }
                if (rule.type === 'image') {
                    token.alt = match[1];
                    token.url = match[2];
                }
                if (rule.type === 'code') token.rawCode = match[1];
                
                tokens.push(token);
                text = text.substring(match[0].length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            let nextIndex = text.search(/[\\\[!*~_=`:|<J]/);
            if (nextIndex === 0) {
                tokens.push({ type: 'text', text: text[0] });
                text = text.substring(1);
            } else if (nextIndex > 0) {
                tokens.push({ type: 'text', text: text.substring(0, nextIndex) });
                text = text.substring(nextIndex);
            } else {
                tokens.push({ type: 'text', text: text });
                text = '';
            }
        }
    }
    return tokens;
}

class BlockLexer {
    constructor(src) {
        this.lines = src.split(/\r?\n/);
        this.tokens = [];
    }
    
    lex() {
        let i = 0;
        while (i < this.lines.length) {
            let line = this.lines[i];
            
            if (!line.trim()) { i++; continue; }
            
            // HR
            if (/^\s*(?:[-*_]\s*){3,}$/.test(line)) {
                this.tokens.push({ type: 'hr' });
                i++; continue;
            }
            
            // Heading
            let hMatch = /^\s*(#{1,6})\s+(.*)$/.exec(line);
            if (hMatch) {
                this.tokens.push({ type: 'heading', depth: hMatch[1].length, text: hMatch[2], inlineTokens: lexInline(hMatch[2]) });
                i++; continue;
            }
            
            // Blockquote & Callouts
            if (/^\s*>/.test(line)) {
                let bqLines = [];
                while (i < this.lines.length && /^\s*>/.test(this.lines[i])) {
                    bqLines.push(this.lines[i].replace(/^\s*>\s?/, ''));
                    i++;
                }
                const content = bqLines.join('\n');
                const calloutMatch = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(bqLines[0]);
                if (calloutMatch) {
                    const calloutType = calloutMatch[1].toLowerCase();
                    const titleRaw = bqLines[0].substring(calloutMatch[0].length).trim() || calloutMatch[1];
                    const body = bqLines.slice(1).join('\n');
                    this.tokens.push({ type: 'callout', calloutType, titleTokens: lexInline(titleRaw), tokens: new BlockLexer(body).lex() });
                } else {
                    this.tokens.push({ type: 'blockquote', tokens: new BlockLexer(content).lex() });
                }
                continue;
            }
            
            // Table
            let tableHeader = /^\s*\|?(.+?)\|?\s*$/.exec(line);
            if (tableHeader && i + 1 < this.lines.length) {
                let tableSep = /^\s*\|?([-:| ]+)\|?\s*$/.exec(this.lines[i+1]);
                if (tableSep && tableHeader[1].includes('|') && tableSep[1].includes('-')) {
                    let headerCells = tableHeader[1].split(/(?<!\\)\|/).map(c => c.trim()).filter(c => c);
                    let aligns = tableSep[1].split('|').map(s => {
                        let tr = s.trim();
                        if (tr.startsWith(':') && tr.endsWith(':')) return 'center';
                        if (tr.endsWith(':')) return 'right';
                        return 'left';
                    }).filter((_, idx) => idx < headerCells.length);
                    
                    i += 2;
                    let rows = [];
                    while (i < this.lines.length) {
                        let rLine = this.lines[i].trim();
                        if (!rLine.includes('|')) break;
                        let rMatch = /^\s*\|?(.+?)\|?\s*$/.exec(this.lines[i]);
                        let cells = rMatch ? rMatch[1].split(/(?<!\\)\|/).map(c => c.trim()).filter(c => c) : [];
                        rows.push(cells.map(c => lexInline(c)));
                        i++;
                    }
                    this.tokens.push({ type: 'table', header: headerCells.map(c => lexInline(c)), aligns, rows });
                    continue;
                }
            }
            
            // Lists (Ordered & Unordered)
            let listMatch = /^\s*([-*+]|\d+\.)\s+(.*)$/.exec(line);
            if (listMatch) {
                let listTokens = [];
                let isOrdered = /^\d/.test(listMatch[1]);
                let bullet = listMatch[1];
                let itemLines = [listMatch[2]];
                let baseIndent = /^\s*/.exec(line)[0].length;
                let itemIndent = baseIndent + bullet.length + 1;
                
                i++;
                while (i < this.lines.length) {
                    let nextLine = this.lines[i];
                    if (!nextLine.trim()) {
                        if (i + 1 < this.lines.length && /^\s*([-*+]|\d+\.)\s+/.test(this.lines[i+1])) {
                             itemLines.push(''); i++; continue;
                        } else if (i + 1 < this.lines.length && /^\s+/.test(this.lines[i+1])) {
                             itemLines.push(''); i++; continue;
                        } else break;
                    }
                    
                    let nextListMatch = /^\s*([-*+]|\d+\.)\s+(.*)$/.exec(nextLine);
                    if (nextListMatch) {
                        let nextIndent = /^\s*/.exec(nextLine)[0].length;
                        if (nextIndent <= baseIndent + 1) { // Same level list item
                            listTokens.push(this.parseListItem(itemLines));
                            itemLines = [nextListMatch[2]];
                            i++; continue;
                        } else {
                            // Sublist, push un-indented
                            itemLines.push(nextLine.substring(Math.min(itemIndent, nextIndent)));
                        }
                    } else {
                        let nextIndent = /^\s*/.exec(nextLine)[0].length;
                        if (nextIndent >= itemIndent || !nextLine.trim()) {
                            itemLines.push(nextLine.substring(Math.min(itemIndent, nextIndent)));
                        } else break;
                    }
                    i++;
                }
                if (itemLines.length > 0) listTokens.push(this.parseListItem(itemLines));
                this.tokens.push({ type: 'list', ordered: isOrdered, items: listTokens });
                continue;
            }
            
            // Paragraph (Fallback)
            let pLines = [];
            while (i < this.lines.length) {
                let pLine = this.lines[i];
                if (!pLine.trim() || /^\s*(#{1,6}|>|[-*_]{3,})/.test(pLine)) break;
                if (/^\s*([-*+]|\d+\.)\s+/.test(pLine)) break;
                if (/^\s*\|?(.+?)\|?\s*$/.test(pLine) && i+1 < this.lines.length && /^\s*\|?([-:| ]+)\|?\s*$/.test(this.lines[i+1])) break;
                pLines.push(pLine);
                i++;
            }
            this.tokens.push({ type: 'paragraph', inlineTokens: lexInline(pLines.join('\n')) });
        }
        return this.tokens;
    }
    
    parseListItem(lines) {
        let text = lines.join('\n');
        let checked = null;
        let taskMatch = /^\[([ xX])\]\s+(.*)/s.exec(text);
        if (taskMatch) {
            checked = taskMatch[1].toLowerCase() === 'x';
            text = taskMatch[2];
        }
        return { type: 'list_item', checked, tokens: new BlockLexer(text).lex() };
    }
}

class MarkdownRenderer {
    constructor(footnoteMap) { this.footnoteMap = footnoteMap; }
    
    renderBlocks(tokens) {
        return tokens.map(t => this.renderBlock(t)).join('\n');
    }
    
    renderBlock(t) {
        switch (t.type) {
            case 'hr': return '<hr>';
            case 'heading': 
                const id = t.text.toLowerCase().replace(/[^\w]+/g, '-');
                return `<h${t.depth} id="${id}">${this.renderInline(t.inlineTokens)}</h${t.depth}>`;
            case 'blockquote':
                return `<blockquote>${this.renderBlocks(t.tokens)}</blockquote>`;
            case 'callout':
                const iconMap = {
                    note: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
                    tip: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.137.164-.326.381-.542.68-.207.3-.33.565-.37.847a.75.75 0 0 1-1.485-.21c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
                    important: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.75.75 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                    warning: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                    caution: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
                };
                return `<div class="callout callout-${t.calloutType}"><div class="callout-title">${iconMap[t.calloutType] || ''} ${this.renderInline(t.titleTokens)}</div><div class="callout-body">${this.renderBlocks(t.tokens)}</div></div>`;
            case 'list':
                const tag = t.ordered ? 'ol' : 'ul';
                let classes = t.items.some(i => i.checked !== null) ? ' class="contains-task-list"' : '';
                return `<${tag}${classes}>${t.items.map(item => this.renderBlock(item)).join('')}</${tag}>`;
            case 'list_item':
                let content = this.renderBlocks(t.tokens);
                // Strip redundant outer <p> for tight lists
                if (content.startsWith('<p>') && content.endsWith('</p>') && (content.match(/<p>/g)||[]).length === 1) {
                    content = content.slice(3, -4);
                }
                if (t.checked !== null) {
                    return `<li class="task-list-item ${t.checked ? 'checked' : ''}"><input type="checkbox" ${t.checked ? 'checked' : ''} disabled> ${content}</li>`;
                }
                return `<li>${content}</li>`;
            case 'table':
                let headers = t.header.map((h, i) => `<th style="text-align: ${t.aligns[i] || 'left'}">${this.renderInline(h)}</th>`).join('');
                let rows = t.rows.map(r => `<tr>${r.map((c, i) => `<td style="text-align: ${t.aligns[i] || 'left'}">${this.renderInline(c)}</td>`).join('')}</tr>`).join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
            case 'paragraph':
                if (t.inlineTokens.length === 1 && t.inlineTokens[0].type === 'placeholder') {
                    return this.renderInline(t.inlineTokens);
                }
                return `<p>${this.renderInline(t.inlineTokens)}</p>`;
        }
    }
    
    renderInline(tokens) {
        if (!tokens) return '';
        return tokens.map(t => {
            switch(t.type) {
                case 'text': return escapeHtml(t.text).replace(/\n/g, '<br>');
                case 'escape': return escapeHtml(t.val);
                case 'strong-em': return `<strong><em>${this.renderInline(t.tokens)}</em></strong>`;
                case 'strong': case 'strong-ul': return `<strong>${this.renderInline(t.tokens)}</strong>`;
                case 'em': case 'em-ul': return `<em>${this.renderInline(t.tokens)}</em>`;
                case 'strike': return `<s>${this.renderInline(t.tokens)}</s>`;
                case 'highlight': return `<mark>${this.renderInline(t.tokens)}</mark>`;
                case 'spoiler': return `<span class="spoiler" onclick="this.classList.add('revealed')">${this.renderInline(t.tokens)}</span>`;
                case 'code': return `<code>${escapeHtml(t.rawCode)}</code>`;
                case 'link': 
                    const safeUrl = sanitizeUrl(t.url);
                    return safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${this.renderInline(t.tokens)}</a>` : this.renderInline(t.tokens);
                case 'ref-link':
                    return `<a href="#ref-${escapeHtml(t.url)}">${this.renderInline(t.tokens)}</a>`;
                case 'image':
                    const safeImg = sanitizeImageUrl(t.url);
                    return safeImg ? `<img src="${escapeHtml(safeImg)}" alt="${escapeHtml(t.alt)}" class="markdown-image" loading="lazy">` : '';
                case 'footnote':
                    if (!this.footnoteMap.has(t.id)) this.footnoteMap.set(t.id, this.footnoteMap.size + 1);
                    const num = this.footnoteMap.get(t.id);
                    return `<sup class="footnote-ref"><a href="#fn-${t.id}" id="fnref-${t.id}">[${num}]</a></sup>`;
                case 'emoji':
                    return EMOJI_MAP[t.code] || `:${t.code}:`;
                case 'html-tag':
                    return sanitizeHtmlTag(t.raw);
                case 'placeholder':
                    return t.raw;
            }
        }).join('');
    }
}

// --------------------------------------------------------------------------------
// MAIN FORMATTER EXPORT
// --------------------------------------------------------------------------------

export const MessageFormatter = {
    async format(input, metadata = null) {
        if (!input) return '';
        let parts = Array.isArray(input) ? input : [{ text: input }];
        let finalHtml = '';
        let footnoteMap = new Map();

        for (const part of parts) {
            if (part.text) {
                let textContent = part.text;
                if (metadata && metadata.groundingChunks) {
                    textContent = this._processCitations(textContent, metadata.groundingChunks);
                }
                
                // 1. EXTRACT RAW BLOCKS
                const { processedText, blocks } = this._extractAndReplaceBlocks(textContent);
                
                // 2. TOKENIZE & PARSE MARKDOWN
                const lexer = new BlockLexer(processedText);
                const ast = lexer.lex();
                
                // 3. RENDER HTML
                const renderer = new MarkdownRenderer(footnoteMap);
                let html = renderer.renderBlocks(ast);
                
                // 4. RESTORE BLOCKS
                html = await this._reinsertBlocks(html, blocks);
                
                // 5. RESTORE CITATIONS
                html = html.replace(/&lt;a href="([^"]+)" class="citation-ref"&gt;(\[\d+\])&lt;\/a&gt;/g, '<a href="$1" class="citation-ref">$2</a>');

                finalHtml += html;
            } 
            else if (part.executableCode) {
                finalHtml += this._renderTerminalBlock(part.executableCode.code, part.executableCode.language.toLowerCase());
            } 
            else if (part.codeExecutionResult) {
                const { outcome, output } = part.codeExecutionResult;
                const isError = outcome !== "OUTCOME_OK";
                finalHtml += `<div class="execution-result ${isError ? 'error' : ''}"><div class="execution-header">${isError ? 'Execution Failed' : 'Standard Output'}</div><pre>${SyntaxHighlighter.escapeHtml(output)}</pre></div>`;
            }
        }

        // APPEND FOOTNOTES & SOURCES
        if (footnoteMap.size > 0) finalHtml += this._renderFootnotes(footnoteMap);
        if (metadata && metadata.groundingChunks) finalHtml += this._renderSourcesList(metadata.groundingChunks);
        
        return finalHtml;
    },

    _extractAndReplaceBlocks(text) {
        if (!text) return { processedText: '', blocks:[] };
        let processedText = text;
        const blocks = [];
        
        const generatePlaceholder = (block, isBlock = false) => {
            const id = blocks.length;
            blocks.push(block);
            const marker = `JBAIBLOCK${id}END`;
            return isBlock ? `\n\n${marker}\n\n` : marker;
        };

        processedText = processedText.replace(/<agent_process>([\s\S]*?)(?:<\/agent_process>|$)/g, (match, content) => {
            return generatePlaceholder({ type: 'agent-process', content: content.trim() }, true);
        });

        processedText = processedText.replace(/```([a-zA-Z0-9_+-]+)?\s*\r?\n([\s\S]*?)(?:```|$)/g, (match, lang, code) => {
            return generatePlaceholder({ type: 'code', lang: lang || 'plaintext', content: code.trim() }, true);
        });

        processedText = processedText.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (match, c1, c2) => {
            return generatePlaceholder({ type: 'math-block', content: (c1 || c2).trim(), latex: true }, true);
        });

        processedText = processedText.replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)\$|\\\((.*?)\\\)/g, (match, c1, c2) => {
            const trimmed = (c1 || c2).trim();
            if (/^\d+\.?\d*$/.test(trimmed)) return match;
            return generatePlaceholder({ type: 'math-inline', content: trimmed, latex: true }, false);
        });

        processedText = processedText.replace(/^(<svg[\s\S]*?<\/svg>)$/gm, (match, svgContent) => {
            return generatePlaceholder({ type: 'svg', content: svgContent.trim() }, true);
        });

        processedText = processedText.replace(/\[FILES:\s*([^\]]+?)\]\(([^|]+)\|([^|]+)\|(\d+)\)/g, (match, blockId, blobUrl, fileList, fileCount) => {
            return generatePlaceholder({ type: 'files', blockId, blobUrl, fileList, fileCount: parseInt(fileCount, 10) }, true);
        });

        return { processedText, blocks };
    },

    _processCitations(text, chunks) {
        return text.replace(/\[(\d+)\]/g, (match, index) => {
            const i = parseInt(index, 10) - 1;
            if (chunks[i]?.web?.uri) {
                const safeUrl = sanitizeUrl(chunks[i].web.uri, ['http:', 'https:']);
                if (safeUrl) return `<a href="${escapeHtml(safeUrl)}" class="citation-ref">[${index}]</a>`;
            }
            return match;
        });
    },

    async _reinsertBlocks(html, blocks) {
        const parts = html.split(/(JBAIBLOCK\d+END)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)END/);
            if (!match) return part;
            const block = blocks[parseInt(match[1], 10)];
            if (!block) return '';

            if (block.type === 'agent-process') return this._renderAgentBlock(block);
            if (block.type === 'code') return block.lang.toLowerCase() === 'html' ? this._renderHtmlPreview(block) : this._renderCodeBlock(block);
            if (block.type === 'math-block') return `<div class="math-block" data-latex="true">${escapeHtml(block.content)}</div>`;
            if (block.type === 'math-inline') return `<span class="math-inline" data-latex="true">${escapeHtml(block.content)}</span>`;
            if (block.type === 'svg') return this._renderSvgPreview(block);
            if (block.type === 'files') return this._renderFilesBlock(block);
            return '';
        }));
        return processedParts.join('');
    },

    _renderAgentBlock(block) {
        const content = block.content;
        let statusText = "Processing...";
        const lC = content.toLowerCase();
        
        if (lC.includes("google search") || lC.includes("searching")) statusText = "Searching the web...";
        else if (lC.includes("python") || lC.includes("code execution")) statusText = "Running code...";
        else if (lC.includes("plan:")) statusText = "Planning approach...";
        else if (lC.includes("error") || lC.includes("correcting")) statusText = "Self-correcting...";
        else if (lC.includes("thought:")) statusText = "Thinking...";

        const lexer = new BlockLexer(content);
        const renderer = new MarkdownRenderer(new Map());
        const internalHtml = renderer.renderBlocks(lexer.lex());

        return `<div class="agent-process-container collapsed"><div class="agent-process-header"><div class="agent-status"><span class="status-spinner"></span><span class="status-text">${statusText}</span></div><div class="agent-toggle-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div></div><div class="agent-process-body">${internalHtml}</div></div>`;
    },

    _renderCodeBlock(block) {
        const lang = block.lang.toLowerCase();
        const highlightedCode = SyntaxHighlighter.highlight(block.content, lang);
        return `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="${lang}" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>${LANGUAGE_MAP[lang] || lang}</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre></div></div>`;
    },

    _renderTerminalBlock(code, lang) {
        const highlightedCode = SyntaxHighlighter.highlight(code, lang);
        return `<div class="code-block-wrapper terminal-style" data-raw-content="${encodeURIComponent(code)}"><div class="code-block-header terminal-header"><div class="terminal-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div><span>EXECUTE: ${lang}</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-${lang} terminal-body"><code class="language-${lang}">${highlightedCode}</code></pre></div></div>`;
    },
    
    _renderHtmlPreview(block) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html');
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="html" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>HTML</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-html"><code class="language-html">${highlightedCode}</code></pre></div></div>`;
        return `<div class="html-preview-container"><div class="html-render-box"><iframe srcdoc="${escapeHtml(block.content)}" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe></div>${codeBlockHtml}</div>`;
    },

    _renderSvgPreview(block) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html');
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="svg" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>SVG</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-xml"><code class="language-xml">${highlightedCode}</code></pre></div></div>`;
        const base64 = btoa(new TextEncoder().encode(block.content).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        return `<div class="svg-preview-container"><div class="svg-render-box"><img src="data:image/svg+xml;base64,${base64}" alt="SVG Preview"></div>${codeBlockHtml}</div>`;
    },

    _renderFilesBlock(block) {
        const fileCount = block.fileCount;
        const blobUrl = sanitizeUrl(block.blobUrl,['blob:']) || '#';
        const rawBlockId = typeof block.blockId === 'string' ? block.blockId : 'files';
        const safeBaseName = rawBlockId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'files';
        
        return `<div class="files-download-wrapper"><div class="files-download-container"><div class="files-download-info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="files-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><div class="files-download-details"><div class="files-download-title">${fileCount} file${fileCount !== 1 ? 's' : ''} ready for download</div><div class="files-download-list">${escapeHtml(String(block.fileList || ''))}</div></div></div><a href="${escapeHtml(blobUrl)}" download="${safeBaseName}.zip" class="download-files-button" data-tooltip="Download all files as ZIP"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download ZIP</a></div></div>`;
    },

    _renderFootnotes(footnoteMap) {
        let html = '<div class="footnotes"><hr><h4>Footnotes</h4><ol>';
        footnoteMap.forEach((num, id) => html += `<li id="fn-${id}">${id} <a href="#fnref-${id}">&#8617;</a></li>`);
        return html + '</ol></div>';
    },

    _renderSourcesList(chunks) {
        const uniqueSources = chunks.filter(c => c.web).map((c, i) => ({ index: i + 1, title: c.web.title || 'Unknown Source', uri: c.web.uri }));
        if (uniqueSources.length === 0) return '';
        let html = '<div class="sources-container"><h4>Sources</h4><div class="sources-list">';
        uniqueSources.forEach(s => {
            const safeUrl = sanitizeUrl(s.uri, ['http:', 'https:']);
            if (safeUrl) html += `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="source-item"><span class="source-index">${s.index}</span><span class="source-title">${escapeHtml(s.title)}</span></a>`;
        });
        return html + '</div></div>';
    }
};

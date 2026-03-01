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
                
                // 1. EXTRACT RAW BLOCKS (Code, Math, Agents, SVGs)
                const { processedText, blocks } = this._extractAndReplaceBlocks(textContent);
                
                // 2. PROCESS MARKDOWN (Blocks, Inline, Paragraphs)
                let html = this._processMarkdown(processedText, footnoteMap);
                
                // 3. RESTORE BLOCKS
                html = await this._reinsertBlocks(html, blocks);
                
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
        const blocks =[];
        
        // Block-level entities get \n\n boundaries to enforce paragraph splitting
        const generatePlaceholder = (block, isBlock = false) => {
            const id = blocks.length;
            blocks.push(block);
            const marker = `JBAIBLOCK${id}END`;
            return isBlock ? `\n\n${marker}\n\n` : marker;
        };

        // 0. Agent Process (Handle gracefully even if unclosed tag)
        processedText = processedText.replace(/<agent_process>([\s\S]*?)(?:<\/agent_process>|$)/g, (match, content) => {
            return generatePlaceholder({ type: 'agent-process', content: content.trim() }, true);
        });

        // 1. Code Blocks (Supports c++, c#, etc.)
        processedText = processedText.replace(/```([a-zA-Z0-9_+-]+)?\s*\r?\n([\s\S]*?)(?:```|$)/g, (match, lang, code) => {
            return generatePlaceholder({ type: 'code', lang: lang || 'plaintext', content: code.trim() }, true);
        });

        // 2. Math Blocks ($$ or \[ \])
        processedText = processedText.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (match, c1, c2) => {
            return generatePlaceholder({ type: 'math-block', content: (c1 || c2).trim(), latex: true }, true);
        });

        // 3. Inline Math ($ or \( \))
        processedText = processedText.replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)\$|\\\((.*?)\\\)/g, (match, c1, c2) => {
            const trimmed = (c1 || c2).trim();
            if (/^\d+\.?\d*$/.test(trimmed)) return match; // skip currency
            return generatePlaceholder({ type: 'math-inline', content: trimmed, latex: true }, false);
        });

        // 4. Inline Code
        processedText = processedText.replace(/`([^`\n]+)`/g, (match, code) => {
            return generatePlaceholder({ type: 'code-inline', content: code }, false);
        });

        // 5. SVG
        processedText = processedText.replace(/^(<svg[\s\S]*?<\/svg>)$/gm, (match, svgContent) => {
            return generatePlaceholder({ type: 'svg', content: svgContent.trim() }, true);
        });

        // 6. Custom Files
        processedText = processedText.replace(/\[FILES:\s*([^\]]+?)\]\(([^|]+)\|([^|]+)\|(\d+)\)/g, (match, blockId, blobUrl, fileList, fileCount) => {
            return generatePlaceholder({ type: 'files', blockId, blobUrl, fileList, fileCount: parseInt(fileCount, 10) }, true);
        });

        return { processedText, blocks };
    },

    _processMarkdown(text, footnoteMap) {
        if (!text) return '';
        let workingText = text;
        
        // Mini "stash" architecture isolates HTML blocks away from line parsers
        const mdBlocks =[];
        const stash = (html) => {
            const id = mdBlocks.length;
            mdBlocks.push(html);
            return `\n\nJBAIMDBLOCK${id}END\n\n`;
        };

        const processInlineOnly = (txt) => {
            let escaped = txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return this._processInline(escaped, footnoteMap);
        };

        // Blockquotes (Lazy processing ensures nested content isn't ruined by HTML escaping)
        workingText = workingText.replace(/^(?:[ \t]*> (.*)\n?)+/gm, (match) => {
            if (match.includes('[!')) return match;
            const content = match.replace(/^[ \t]*> ?/gm, '').trim();
            return stash(`<blockquote>${this._processMarkdown(content, footnoteMap)}</blockquote>`);
        });

        // Callouts
        workingText = workingText.replace(/^[ \t]*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*?)(?:\n((?:[ \t]*>.*(?:\n|$))*))?/gmi, (match, type, title, body) => {
            const cleanBody = body ? body.replace(/^[ \t]*>\s?/gm, '') : '';
            const typeLower = type.toLowerCase();
            const iconMap = { /* SVG Icons shortened here, standard behavior applied below */
                note: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
                tip: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.137.164-.326.381-.542.68-.207.3-.33.565-.37.847a.75.75 0 0 1-1.485-.21c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
                important: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.75.75 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                warning: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                caution: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
            };
            return stash(`<div class="callout callout-${typeLower}"><div class="callout-title">${iconMap[typeLower] || ''} ${processInlineOnly(title)}</div><div class="callout-body">${this._processMarkdown(cleanBody, footnoteMap)}</div></div>`);
        });

        // Tables (Robust alignment & parsing via lookbehinds)
        workingText = workingText.replace(/^[ \t]*\|?(.+?)\|?[ \t]*\n[ \t]*\|?([-:| ]+)\|?[ \t]*\n((?:[ \t]*\|?.*\|?[ \t]*(?:\n|$))*)/gm, (match, header, separator, body) => {
            const aligns = separator.split('|').filter(s => s.trim()).map(s => {
                const tr = s.trim();
                return (tr.startsWith(':') && tr.endsWith(':')) ? 'center' : tr.endsWith(':') ? 'right' : 'left';
            });
            const parseRow = (row) => {
                let clean = row.trim();
                if (clean.startsWith('|')) clean = clean.slice(1);
                if (clean.endsWith('|')) clean = clean.slice(0, -1);
                return clean.split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
            };
            const headers = parseRow(header).map((h, i) => `<th style="text-align: ${aligns[i] || 'left'}">${processInlineOnly(h)}</th>`).join('');
            const rows = body.trim().split('\n').filter(r => r.trim()).map(row => {
                const cells = parseRow(row).map((c, i) => `<td style="text-align: ${aligns[i] || 'left'}">${processInlineOnly(c)}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return stash(`<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`);
        });

        const listCleaner = (html) => {
            const pCount = (html.match(/<p>/g) ||[]).length;
            return (pCount === 1 && html.startsWith('<p>') && html.endsWith('</p>')) ? html.slice(3, -4) : html;
        };

        // Task Lists (Supports Multiline items organically)
        workingText = workingText.replace(/^(?:[ \t]*[-*+] \[[xX ]\].*(?:\n(?![ \t]*[-*+] |[ \t]*\n).*)*\n?)+/gm, (match) => {
            const items = match.trim().split(/(?=^[ \t]*[-*+] )/m).map(item => {
                const isChecked = /^[ \t]*[-*+] \[[xX]\]/.test(item);
                const content = item.replace(/^[ \t]*[-*+] \[[xX ]\] /, '').trim();
                return `<li class="task-list-item ${isChecked ? 'checked' : ''}"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${listCleaner(this._processMarkdown(content, footnoteMap))}</li>`;
            }).join('');
            return stash(`<ul class="contains-task-list">${items}</ul>`);
        });

        // Unordered Lists
        workingText = workingText.replace(/^(?:[ \t]*[-*+] (?!\[[xX ]\]).*(?:\n(?![ \t]*[-*+] |[ \t]*\n).*)*\n?)+/gm, (match) => {
            const items = match.trim().split(/(?=^[ \t]*[-*+] )/m).map(item => `<li>${listCleaner(this._processMarkdown(item.replace(/^[ \t]*[-*+] /, '').trim(), footnoteMap))}</li>`).join('');
            return stash(`<ul>${items}</ul>`);
        });

        // Ordered Lists
        workingText = workingText.replace(/^(?:[ \t]*\d+\. .*(?:\n(?![ \t]*\d+\. |[ \t]*\n).*)*\n?)+/gm, (match) => {
            const items = match.trim().split(/(?=^[ \t]*\d+\. )/m).map(item => `<li>${listCleaner(this._processMarkdown(item.replace(/^[ \t]*\d+\. /, '').trim(), footnoteMap))}</li>`).join('');
            return stash(`<ol>${items}</ol>`);
        });

        // Headers
        workingText = workingText.replace(/^[ \t]*###### (.*$)/gm, (m, c) => stash(`<h6>${processInlineOnly(c)}</h6>`))
                                 .replace(/^[ \t]*##### (.*$)/gm, (m, c) => stash(`<h5>${processInlineOnly(c)}</h5>`))
                                 .replace(/^[ \t]*#### (.*$)/gm, (m, c) => stash(`<h4>${processInlineOnly(c)}</h4>`))
                                 .replace(/^[ \t]*### (.*$)/gm, (m, c) => stash(`<h3>${processInlineOnly(c)}</h3>`))
                                 .replace(/^[ \t]*## (.*$)/gm, (m, c) => stash(`<h2>${processInlineOnly(c)}</h2>`))
                                 .replace(/^[ \t]*# (.*$)/gm, (m, c) => stash(`<h1>${processInlineOnly(c)}</h1>`));

        // Horizontal Rules & Definition Lists
        workingText = workingText.replace(/^[ \t]*([-*_])[ \t]*\1[ \t]*\1+[ \t]*$/gm, () => stash('<hr>'));
        workingText = workingText.replace(/^([^\n]+)\n: ([^\n]+)/gm, (m, dt, dd) => stash(`<dl><dt>${processInlineOnly(dt)}</dt><dd>${processInlineOnly(dd)}</dd></dl>`));

        // HTML Escape Only text remaining outside the core markdown plugins to prevent XSS. 
        workingText = workingText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Final Inline format run for raw leftover loose text inside the wrapper
        workingText = this._processInline(workingText, footnoteMap);

        // BULLETPROOF PARAGRAPH WRAPPER
        // Text is correctly splitted into P tags skipping blocks directly instead of regex searching.
        workingText = workingText.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p !== '')
            .map(p => {
                if ((p.startsWith('JBAIMDBLOCK') && p.endsWith('END')) || 
                    (p.startsWith('JBAIBLOCK') && p.endsWith('END'))) return p;
                return `<p>${p.replace(/\n/g, '<br>')}</p>`;
            })
            .join('\n');

        // Restore Stashed Built-Ins smoothly mapped
        mdBlocks.forEach((blockHtml, i) => {
            workingText = workingText.replace(`JBAIMDBLOCK${i}END`, () => blockHtml);
        });

        return workingText;
    },

    _processInline(text, footnoteMap) {
        if (!text) return '';
        let inlineText = text;

        // Restore Pre-existing safe citation grounding anchors mapped previously
        inlineText = inlineText.replace(/&lt;a href="([^"]+)" class="citation-ref"&gt;(\[\d+\])&lt;\/a&gt;/g, '<a href="$1" class="citation-ref">$2</a>');

        // Deep links/images support nested parentheses e.g [label](url(1))
        inlineText = inlineText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawUrl) => {
            const safeUrl = this._sanitizeImageUrl(rawUrl);
            return safeUrl ? `<img src="${this._escapeAttribute(safeUrl)}" alt="${this._escapeAttribute(alt)}" class="markdown-image">` : '';
        });
        inlineText = inlineText.replace(/\[([^\]]+)\]\(([^)]+(?:\([^)]+\)[^)]*)*)\)/g, (match, label, rawUrl) => {
            const safeUrl = this._sanitizeUrl(rawUrl, ['http:', 'https:']);
            return safeUrl ? `<a href="${this._escapeAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
        });

        // Footnotes
        inlineText = inlineText.replace(/\[\^(\w+)\]/g, (match, id) => {
             if (!footnoteMap.has(id)) footnoteMap.set(id, footnoteMap.size + 1);
             const num = footnoteMap.get(id);
             return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${num}]</a></sup>`;
        });

        // Core Inline Formatting Processors 
        inlineText = inlineText
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/==(.*?)==/g, '<mark>$1</mark>')
            .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler" onclick="this.classList.add(\'revealed\')">$1</span>')
            .replace(/&lt;kbd&gt;(.*?)&lt;\/kbd&gt;/gi, '<kbd>$1</kbd>')
            .replace(/~([^~\n]+)~/g, '<sub>$1</sub>')
            .replace(/\^([^\^\n]+)\^/g, '<sup>$1</sup>');

        return inlineText;
    },

    _processCitations(text, chunks) {
        return text.replace(/\[(\d+)\]/g, (match, index) => {
            const i = parseInt(index, 10) - 1;
            if (chunks[i]?.web?.uri) {
                const safeUrl = this._sanitizeUrl(chunks[i].web.uri, ['http:', 'https:']);
                if (safeUrl) return `<a href="${this._escapeAttribute(safeUrl)}" class="citation-ref">[${index}]</a>`;
            }
            return match;
        });
    },

    async _reinsertBlocks(html, blocks) {
        // Prevent catastrophic Regex $ substitutions manually via function map
        const parts = html.split(/(JBAIBLOCK\d+END)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)END/);
            if (!match) return part;
            const block = blocks[parseInt(match[1], 10)];
            if (!block) return '';

            if (block.type === 'agent-process') return this._renderAgentBlock(block);
            if (block.type === 'code') return block.lang.toLowerCase() === 'html' ? this._renderHtmlPreview(block) : this._renderCodeBlock(block);
            if (block.type === 'code-inline') return `<code>${SyntaxHighlighter.escapeHtml(block.content)}</code>`;
            if (block.type === 'math-block') return `<div class="math-block" data-latex="true">${SyntaxHighlighter.escapeHtml(block.content)}</div>`;
            if (block.type === 'math-inline') return `<span class="math-inline" data-latex="true">${SyntaxHighlighter.escapeHtml(block.content)}</span>`;
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

        let internalHtml = this._processMarkdown(content, new Map());

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
        return `<div class="html-preview-container"><div class="html-render-box"><iframe srcdoc="${this._escapeForSrcdoc(block.content)}" sandbox="allow-scripts allow-forms allow-popups" loading="lazy"></iframe></div>${codeBlockHtml}</div>`;
    },

    _renderSvgPreview(block) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html');
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="svg" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>SVG</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-xml"><code class="language-xml">${highlightedCode}</code></pre></div></div>`;
        return `<div class="svg-preview-container"><div class="svg-render-box"><img src="data:image/svg+xml;base64,${this._toBase64(block.content)}" alt="SVG Preview"></div>${codeBlockHtml}</div>`;
    },

    _renderFilesBlock(block) {
        const fileCount = block.fileCount;
        const blobUrl = this._sanitizeUrl(block.blobUrl,['blob:']) || '#';
        const rawBlockId = typeof block.blockId === 'string' ? block.blockId : 'files';
        const safeBaseName = rawBlockId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'files';
        
        return `<div class="files-download-wrapper"><div class="files-download-container"><div class="files-download-info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="files-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><div class="files-download-details"><div class="files-download-title">${fileCount} file${fileCount !== 1 ? 's' : ''} ready for download</div><div class="files-download-list">${SyntaxHighlighter.escapeHtml(String(block.fileList || ''))}</div></div></div><a href="${this._escapeAttribute(blobUrl)}" download="${safeBaseName}.zip" class="download-files-button" data-tooltip="Download all files as ZIP"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download ZIP</a></div></div>`;
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
            const safeUrl = this._sanitizeUrl(s.uri, ['http:', 'https:']);
            if (safeUrl) html += `<a href="${this._escapeAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer" class="source-item"><span class="source-index">${s.index}</span><span class="source-title">${SyntaxHighlighter.escapeHtml(s.title)}</span></a>`;
        });
        return html + '</div></div>';
    },

    _escapeForSrcdoc(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return (typeof str === 'string' ? str : "").replace(/[&<>"']/g, m => map[m]);
    },

    _escapeAttribute(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return (str == null ? '' : String(str)).replace(/[&<>"']/g, m => map[m]);
    },

    _sanitizeUrl(url, allowedProtocols = ['http:', 'https:']) {
        if (!url || typeof url !== 'string') return null;
        try {
            const parsed = new URL(url.trim(), window.location.origin);
            return allowedProtocols.includes(parsed.protocol) ? parsed.href : null;
        } catch { return null; }
    },

    _sanitizeImageUrl(url) {
        const safeUrl = this._sanitizeUrl(url, ['http:', 'https:', 'blob:', 'data:']);
        if (safeUrl?.startsWith('data:')) {
            return /^data:image\/(?:png|jpeg|jpg|gif|webp|bmp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(safeUrl) ? safeUrl : null;
        }
        return safeUrl;
    },

    _toBase64(str) {
        const utf8 = new TextEncoder().encode(str);
        let binary = '';
        utf8.forEach((byte) => binary += String.fromCharCode(byte));
        return btoa(binary);
    }
};
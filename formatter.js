import { SyntaxHighlighter } from './syntaxHighlighter.js';

const LANGUAGE_MAP = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', js: 'JavaScript',
    lua: 'Lua', python: 'Python', py: 'Python', xml: 'SVG', svg: 'SVG',
    sh: 'Shell', bash: 'Shell', json: 'JSON',
    bat: 'Batch', cmd: 'Batch', batch: 'Batch',
    cpp: 'C++', cs: 'C#', java: 'Java', go: 'Go', rust: 'Rust',
    sql: 'SQL', yaml: 'YAML', md: 'Markdown', latex: 'LaTeX',
    mermaid: 'Mermaid'
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
                
                // 1. EXTRACT BLOCKS (Protect Code, Math, Images, and Agent Activities from Markdown parsing)
                const { processedText, blocks } = this._extractAndReplaceBlocks(textContent);
                
                // 2. PROCESS MARKDOWN
                let html = this._processMarkdown(processedText, footnoteMap);
                
                // 3. RESTORE BLOCKS
                html = await this._reinsertBlocks(html, blocks);
                
                // 4. WRAP TEXT
                finalHtml += this._wrapInParagraphs(html);
            } 
            else if (part.executableCode) {
                finalHtml += this._renderTerminalBlock(part.executableCode.code, part.executableCode.language.toLowerCase());
            } 
            else if (part.codeExecutionResult) {
                const { outcome, output } = part.codeExecutionResult;
                const isError = outcome !== "OUTCOME_OK";
                finalHtml += `<div class="execution-result ${isError ? 'error' : ''}"><div class="execution-header">${isError ? '⚠️ Execution Failed' : '✓ Standard Output'}</div><pre>${SyntaxHighlighter.escapeHtml(output)}</pre></div>`;
            }
        }

        // 5. APPEND FOOTNOTES
        if (footnoteMap.size > 0) {
            finalHtml += this._renderFootnotes(footnoteMap);
        }

        // 6. APPEND SOURCES
        if (metadata && metadata.groundingChunks) {
            finalHtml += this._renderSourcesList(metadata.groundingChunks);
        }
        return finalHtml;
    },

    _extractAndReplaceBlocks(text) {
        if (!text) return { processedText: '', blocks: [] };
        let processedText = text;
        const blocks = [];
        
        // Helper to store blocks safely
        const generatePlaceholder = (block) => {
            const id = blocks.length;
            blocks.push(block);
            return `JBAIBLOCK${id}END`; 
        };

        // 0. Agent Process Blocks (High priority)
        // Detects <agent_process> ... </agent_process>
        processedText = processedText.replace(/<agent_process>([\s\S]*?)<\/agent_process>/g, (match, content) => {
            return generatePlaceholder({ type: 'agent-process', content: content.trim() });
        });

        // 1. Code Blocks (```)
        processedText = processedText.replace(/```(\w+)?\s*\r?\n([\s\S]*?)\s*```/g, (match, lang, code) => {
            return generatePlaceholder({ type: 'code', lang: lang || 'plaintext', content: code.trim() });
        });

        // 2. Math Blocks ($$)
        processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (match, code) => {
            return generatePlaceholder({ type: 'math-block', content: code.trim() });
        });

        // 3. Inline Math ($) - strict lookaround to avoid matching currency
        processedText = processedText.replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (match, code) => {
            const trimmed = code.trim();
            // Skip if it looks like currency (e.g., $100, $1.50)
            if (/^\d+\.?\d*$/.test(trimmed)) return match;
            return generatePlaceholder({ type: 'math-inline', content: trimmed });
        });

        // 4. Inline Code (`)
        processedText = processedText.replace(/`([^`]+)`/g, (match, code) => {
            return generatePlaceholder({ type: 'code-inline', content: code });
        });

        // 5. HTML/SVG Blocks
        processedText = processedText.replace(/^(<svg[\s\S]*?<\/svg>)$/gm, (match, svgContent) => {
            return generatePlaceholder({ type: 'svg', content: svgContent.trim() });
        });

        // 6. Custom Image Syntax [IMAGE: prompt](url)
        processedText = processedText.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
            return generatePlaceholder({ type: 'image', alt: alt, url: url });
        });

        // 7. Custom Files Syntax [FILES: blockId](blobUrl|fileList|fileCount)
        processedText = processedText.replace(/\[FILES: ([^\]]+?)\]\(([^|]+)\|([^|]+)\|(\d+)\)/g, (match, blockId, blobUrl, fileList, fileCount) => {
            return generatePlaceholder({ type: 'files', blockId: blockId, blobUrl: blobUrl, fileList: fileList, fileCount: parseInt(fileCount, 10) });
        });

        return { processedText, blocks };
    },

    _processMarkdown(text, footnoteMap) {
        if (!text) return '';
        let workingText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // --- BLOCK ELEMENTS ---

        // Headers
        workingText = workingText.replace(/^\s*###### (.*$)/gim, '<h6>$1</h6>')
                                 .replace(/^\s*##### (.*$)/gim, '<h5>$1</h5>')
                                 .replace(/^\s*#### (.*$)/gim, '<h4>$1</h4>')
                                 .replace(/^\s*### (.*$)/gim, '<h3>$1</h3>')
                                 .replace(/^\s*## (.*$)/gim, '<h2>$1</h2>')
                                 .replace(/^\s*# (.*$)/gim, '<h1>$1</h1>');

        // Horizontal Rules
        workingText = workingText.replace(/^\s*([-*_])\s*\1\s*\1+\s*$/gm, '<hr>');

        // GitHub Flavored Callouts (Note, Tip, etc.)
        workingText = workingText.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*?)(?:\n((?:>.*(?:\n|$))*))?/gmi, (match, type, title, body) => {
            const cleanBody = body ? body.replace(/^>\s?/gm, '') : '';
            const typeLower = type.toLowerCase();
            const iconMap = {
                note: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
                tip: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.137.164-.326.381-.542.68-.207.3-.33.565-.37.847a.75.75 0 0 1-1.485-.21c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
                important: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.75.75 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                warning: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                caution: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
            };
            return `<div class="callout callout-${typeLower}"><div class="callout-title">${iconMap[typeLower] || ''} ${title}</div><div class="callout-body">${this._processMarkdown(cleanBody, footnoteMap)}</div></div>`;
        });

        // Blockquotes
        workingText = workingText.replace(/^(> (.*)\n?)+/gm, (match) => {
             const content = match.replace(/^> /gm, '').trim();
             return `<blockquote>${this._processMarkdown(content, footnoteMap)}</blockquote>`;
        });

        // Task Lists (Checked/Unchecked)
        workingText = workingText.replace(/^(\s*)- \[[xX]\] (.*)$/gm, '<li class="task-list-item checked"><input type="checkbox" checked disabled> $2</li>');
        workingText = workingText.replace(/^(\s*)- \[ \] (.*)$/gm, '<li class="task-list-item"><input type="checkbox" disabled> $2</li>');

        // Unordered Lists
        workingText = workingText.replace(/^((\s*)[-*] (?!\[[x ]\])(.*)\n?)+/gm, (match) => {
            const items = match.trim().split('\n').map(line => `<li>${line.replace(/^\s*[-*] /, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        });

        // Ordered Lists
        workingText = workingText.replace(/^((\s*)\d+\. (.*)\n?)+/gm, (match) => {
            const items = match.trim().split('\n').map(line => `<li>${line.replace(/^\s*\d+\. /, '')}</li>`).join('');
            return `<ol>${items}</ol>`;
        });

        // Definition Lists (Term : Definition)
        workingText = workingText.replace(/^([^\n]+)\n: ([^\n]+)/gm, '<dl><dt>$1</dt><dd>$2</dd></dl>');

        // Tables (GFM with Alignment)
        workingText = workingText.replace(/^\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.*\|\n?)*)/gm, (match, header, separator, body) => {
            const aligns = separator.split('|').filter(s => s.trim()).map(s => {
                s = s.trim();
                if (s.startsWith(':') && s.endsWith(':')) return 'center';
                if (s.endsWith(':')) return 'right';
                return 'left';
            });
            const headers = header.split('|').filter(h => h.trim()).map((h, i) => {
                const align = aligns[i] || 'left';
                return `<th style="text-align: ${align}">${h.trim()}</th>`;
            }).join('');
            const rows = body.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map((c, i) => {
                     const align = aligns[i] || 'left';
                     return `<td style="text-align: ${align}">${this._processMarkdown(c.trim(), footnoteMap)}</td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        });

        // --- INLINE ELEMENTS ---

        // Footnotes [^1]
        workingText = workingText.replace(/\[\^(\w+)\]/g, (match, id) => {
             if (!footnoteMap.has(id)) footnoteMap.set(id, footnoteMap.size + 1);
             const num = footnoteMap.get(id);
             return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${num}]</a></sup>`;
        });
        
        // Citations (Grounding)
        workingText = workingText.replace(/&lt;a href="([^"]+)" class="citation-ref"&gt;(\[\d+\])&lt;\/a&gt;/g, '<a href="$1" class="citation-ref">$2</a>');

        // Images/Links
        workingText = workingText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');
        workingText = workingText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Text Formatting
        workingText = workingText
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler" onclick="this.classList.add(\'revealed\')">$1</span>') // Spoiler
            .replace(/<kbd>(.*?)<\/kbd>/g, '<kbd>$1</kbd>')
            .replace(/~([^~]+)~/g, '<sub>$1</sub>') // Subscript
            .replace(/\^([^^]+)\^/g, '<sup>$1</sup>'); // Superscript

        return workingText;
    },

    _processCitations(text, chunks) {
        return text.replace(/\[(\d+)\]/g, (match, index) => {
            const i = parseInt(index, 10) - 1;
            if (chunks[i] && chunks[i].web) {
                return `<a href="${chunks[i].web.uri}" class="citation-ref">[${index}]</a>`;
            }
            return match;
        });
    },

    _renderFootnotes(footnoteMap) {
        if (footnoteMap.size === 0) return '';
        let html = '<div class="footnotes"><hr><h4>Footnotes</h4><ol>';
        footnoteMap.forEach((num, id) => {
             html += `<li id="fn-${id}">${id} <a href="#fnref-${id}">↩</a></li>`;
        });
        html += '</ol></div>';
        return html;
    },

    _renderSourcesList(chunks) {
        const uniqueSources = chunks.filter(c => c.web).map((c, i) => ({
            index: i + 1, title: c.web.title || 'Unknown Source', uri: c.web.uri
        }));
        if (uniqueSources.length === 0) return '';
        let html = '<div class="sources-container"><h4>Sources</h4><div class="sources-list">';
        uniqueSources.forEach(source => {
            html += `<a href="${source.uri}" target="_blank" class="source-item"><span class="source-index">${source.index}</span><span class="source-title">${SyntaxHighlighter.escapeHtml(source.title)}</span></a>`;
        });
        return html + '</div></div>';
    },

    async _reinsertBlocks(html, blocks) {
        // Split by the specific placeholder format
        const parts = html.split(/(JBAIBLOCK\d+END)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)END/);
            if (!match) return part;
            const block = blocks[parseInt(match[1], 10)];
            if (!block) return ''; // Safety check

            if (block.type === 'agent-process') return this._renderAgentBlock(block);
            if (block.type === 'code') {
                if (block.lang.toLowerCase() === 'html') return this._renderHtmlPreview(block);
                return this._renderCodeBlock(block);
            }
            if (block.type === 'code-inline') return `<code>${SyntaxHighlighter.escapeHtml(block.content)}</code>`;
            if (block.type === 'math-block') return `<div class="math-block">${SyntaxHighlighter.escapeHtml(block.content)}</div>`;
            if (block.type === 'math-inline') return `<span class="math-inline">${SyntaxHighlighter.escapeHtml(block.content)}</span>`;
            if (block.type === 'svg') return this._renderSvgPreview(block);
            if (block.type === 'image') return this._renderImageBlock(block);
            if (block.type === 'files') return this._renderFilesBlock(block);
            return '';
        }));
        return processedParts.join('');
    },

    _renderAgentBlock(block) {
        const content = block.content;
        let statusText = "Processing...";
        
        // Simple logic to derive status from content
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("google search") || lowerContent.includes("searching")) statusText = "Searching the web...";
        else if (lowerContent.includes("python") || lowerContent.includes("code execution")) statusText = "Running code...";
        else if (lowerContent.includes("plan:")) statusText = "Planning approach...";
        else if (lowerContent.includes("error") || lowerContent.includes("correcting")) statusText = "Self-correcting...";
        else if (lowerContent.includes("thought:")) statusText = "Thinking...";

        let internalHtml = this._processMarkdown(content, new Map()); // Simple markdown pass

        return `
        <div class="agent-process-container collapsed">
            <div class="agent-process-header">
                <div class="agent-status">
                    <span class="status-spinner"></span>
                    <span class="status-text">${statusText}</span>
                </div>
                <div class="agent-toggle-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
            <div class="agent-process-body">
                ${internalHtml}
            </div>
        </div>`;
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
        const safeHtmlForSrcdoc = this._escapeForSrcdoc(block.content);
        return `<div class="html-preview-container"><div class="html-render-box"><iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy"></iframe></div>${codeBlockHtml}</div>`;
    },

    _renderSvgPreview(block) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html');
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="svg" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>SVG</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-xml"><code class="language-xml">${highlightedCode}</code></pre></div></div>`;
        const encodedSvg = btoa(block.content);
        return `<div class="svg-preview-container"><div class="svg-render-box"><img src="data:image/svg+xml;base64,${encodedSvg}" alt="SVG Preview"></div>${codeBlockHtml}</div>`;
    },

    _renderImageBlock(block) {
        const safeAlt = SyntaxHighlighter.escapeHtml(block.alt);
        // If the URL is just placeholder text (e.g. "Image Expired"), render text instead of an image
        if (!block.url.startsWith('http') && !block.url.startsWith('data:')) {
             return `<div class="generated-image-wrapper"><p class="image-prompt-text"><em>[${safeAlt}]</em></p><div class="image-container" style="padding: 20px; border: 1px dashed #666; color: #888;">${block.url}</div></div>`;
        }
        
        const safeFilename = (safeAlt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
        return `<div class="generated-image-wrapper"><p class="image-prompt-text"><em>Image Prompt: ${safeAlt}</em></p><div class="image-container"><img src="${block.url}" alt="${safeAlt}" class="generated-image"><a href="${block.url}" download="${safeFilename}.png" class="download-image-button" data-tooltip="Download Image"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a></div></div>`;
    },

    _renderFilesBlock(block) {
        const safeFileList = block.fileList;
        const fileCount = block.fileCount;
        const blobUrl = block.blobUrl;
        const safeFilename = `files-${Date.now()}.zip`;
        
        return `<div class="files-download-wrapper">
            <div class="files-download-container">
                <div class="files-download-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="files-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <div class="files-download-details">
                        <div class="files-download-title">${fileCount} file${fileCount !== 1 ? 's' : ''} ready for download</div>
                        <div class="files-download-list">${safeFileList}</div>
                    </div>
                </div>
                <a href="${blobUrl}" download="${safeFilename}" class="download-files-button" data-tooltip="Download all files as ZIP">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download ZIP
                </a>
            </div>
        </div>`;
    },

    _wrapInParagraphs(html) {
        if (!html) return '';
        let finalHtml = '';
        // Match block-level elements. If text is NOT inside one of these, wrap it in <p>.
        // Added: callout, math-block, hr, dl, agent-process-container
        const blockRegex = /(<(?:div|blockquote|ul|ol|table|h[1-6]|pre|hr|dl)[\s\S]*?<\/(?:div|blockquote|ul|ol|table|h[1-6]|pre|dl)>|<hr>|<div class="callout[\s\S]*?<\/div>|<div class="math-block"[\s\S]*?<\/div>|<div class="agent-process-container[\s\S]*?<\/div>)/;
        const parts = html.split(blockRegex);
        
        for (const part of parts) {
            if (!part || /^\s*$/.test(part)) continue;
            
            // Check if the part itself is a block tag (starts with <)
            if (part.trim().startsWith('<') && !part.startsWith('<span') && !part.startsWith('<a ') && !part.startsWith('<strong') && !part.startsWith('<em') && !part.startsWith('<code') && !part.startsWith('<kbd')) {
                finalHtml += part;
            } else {
                const paragraphs = part.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
                finalHtml += paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
        }
        return finalHtml;
    },

    /**
     * Escapes HTML for use in iframe srcdoc attribute
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    _escapeForSrcdoc(str) {
        if (!str || typeof str !== 'string') return "";
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }
};
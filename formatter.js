const LANGUAGE_MAP = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', js: 'JavaScript',
    lua: 'Lua', python: 'Python', py: 'Python', xml: 'SVG', svg: 'SVG',
    sh: 'Shell', bash: 'Shell', json: 'JSON',
    bat: 'Batch', cmd: 'Batch', batch: 'Batch',
    cpp: 'C++', cs: 'C#', java: 'Java', go: 'Go', rust: 'Rust',
    sql: 'SQL', yaml: 'YAML', md: 'Markdown', latex: 'LaTeX',
    mermaid: 'Mermaid'
};

function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
}

export const MessageFormatter = {
    /**
     * Formats the raw input from the AI into displayable HTML.
     * This is the main entry point for the formatter.
     * @param {string|Array<Object>} input The raw content from the AI.
     * @param {Object} [metadata=null] Optional metadata, like grounding chunks.
     * @returns {Promise<string>} A promise that resolves to the final HTML string.
     */
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
                
                const { processedText, blocks } = this._extractAndReplaceBlocks(textContent);
                
                let html = this._processMarkdown(processedText, footnoteMap);
                
                html = await this._reinsertBlocks(html, blocks);
                
                finalHtml += this._wrapInParagraphs(html);
            } 
            else if (part.executableCode) {
                finalHtml += this._renderTerminalBlock(part.executableCode.code, part.executableCode.language.toLowerCase());
            } 
            else if (part.codeExecutionResult) {
                const { outcome, output } = part.codeExecutionResult;
                const isError = outcome !== "OUTCOME_OK";
                finalHtml += `<div class="execution-result ${isError ? 'error' : ''}"><div class="execution-header">${isError ? '⚠️ Execution Failed' : '✓ Standard Output'}</div><pre>${escapeHtml(output)}</pre></div>`;
            }
        }

        if (footnoteMap.size > 0) {
            finalHtml += this._renderFootnotes(footnoteMap);
        }

        if (metadata && metadata.groundingChunks) {
            finalHtml += this._renderSourcesList(metadata.groundingChunks);
        }
        return finalHtml;
    },

    /**
     * Extracts special content blocks (like code, math, and custom syntax)
     * and replaces them with placeholders. This protects them from the main
     * markdown parsing process.
     * @param {string} text The raw text content.
     * @returns {{processedText: string, blocks: Array<Object>}}
     * @private
     */
    _extractAndReplaceBlocks(text) {
        let processedText = text;
        const blocks = [];
        
        const generatePlaceholder = (block) => {
            const id = blocks.length;
            blocks.push(block);
            return `JBAIBLOCK${id}END`; 
        };

        processedText = processedText.replace(/<agent_process>([\s\S]*?)<\/agent_process>/g, (match, content) => {
            return generatePlaceholder({ type: 'agent-process', content: content.trim() });
        });

        processedText = processedText.replace(/```(\w+)?\s*\r?\n([\s\S]*?)\s*```/g, (match, lang, code) => {
            return generatePlaceholder({ type: 'code', lang: lang || 'plaintext', content: code.trim() });
        });

        processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (match, code) => {
            return generatePlaceholder({ type: 'math-block', content: code.trim() });
        });

        processedText = processedText.replace(/(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (match, code) => {
            const trimmed = code.trim();
            if (/^\d+\.?\d*$/.test(trimmed)) return match;
            return generatePlaceholder({ type: 'math-inline', content: trimmed });
        });

        processedText = processedText.replace(/`([^`]+)`/g, (match, code) => {
            return generatePlaceholder({ type: 'code-inline', content: code });
        });

        processedText = processedText.replace(/^(<svg[\s\S]*?<\/svg>)$/gm, (match, svgContent) => {
            return generatePlaceholder({ type: 'svg', content: svgContent.trim() });
        });

        processedText = processedText.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
            return generatePlaceholder({ type: 'image', alt: alt, url: url });
        });

        processedText = processedText.replace(/\[FILES: ([^\]]+?)\]\(([^|]+)\|([^|]+)\|(\d+)\)/g, (match, blockId, blobUrl, fileList, fileCount) => {
            return generatePlaceholder({ type: 'files', blockId: blockId, blobUrl: blobUrl, fileList: fileList, fileCount: parseInt(fileCount, 10) });
        });

        return { processedText, blocks };
    },

    _processMarkdown(text, footnoteMap) {
        // Use marked.js for robust markdown parsing
        let html = marked.parse(text, { mangle: false, headerIds: false });

        // Sanitize the HTML to prevent XSS attacks
        html = DOMPurify.sanitize(html);
        
        // Footnotes and Citations need to be handled carefully
        html = html.replace(/\[\^(\w+)\]/g, (match, id) => {
             if (!footnoteMap.has(id)) footnoteMap.set(id, footnoteMap.size + 1);
             const num = footnoteMap.get(id);
             return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${num}]</a></sup>`;
        });
        
        html = html.replace(/&lt;a href="([^"]+)" class="citation-ref"&gt;(\[\d+\])&lt;\/a&gt;/g, '<a href="$1" class="citation-ref">$2</a>');

        return html;
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
            html += `<a href="${source.uri}" target="_blank" class="source-item"><span class="source-index">${source.index}</span><span class="source-title">${escapeHtml(source.title)}</span></a>`;
        });
        return html + '</div></div>';
    },

    /**
     * Re-inserts the special content blocks back into the HTML, replacing the placeholders.
     * @param {string} html The HTML content generated from markdown.
     * @param {Array<Object>} blocks The array of extracted special blocks.
     * @returns {Promise<string>} A promise that resolves to the final HTML with blocks reinserted.
     * @private
     */
    async _reinsertBlocks(html, blocks) {
        const parts = html.split(/(JBAIBLOCK\d+END)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)END/);
            if (!match) return part;
            const block = blocks[parseInt(match[1], 10)];
            
            if (block.type === 'agent-process') return this._renderAgentBlock(block);
            if (block.type === 'code') {
                if (block.lang.toLowerCase() === 'html') return this._renderHtmlPreview(block);
                return this._renderCodeBlock(block);
            }
            if (block.type === 'code-inline') return `<code>${escapeHtml(block.content)}</code>`;
            if (block.type === 'math-block') return `<div class="math-block">${escapeHtml(block.content)}</div>`;
            if (block.type === 'math-inline') return `<span class="math-inline">${escapeHtml(block.content)}</span>`;
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
        
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("google search") || lowerContent.includes("searching")) statusText = "Searching the web...";
        else if (lowerContent.includes("python") || lowerContent.includes("code execution")) statusText = "Running code...";
        else if (lowerContent.includes("plan:")) statusText = "Planning approach...";
        else if (lowerContent.includes("error") || lowerContent.includes("correcting")) statusText = "Self-correcting...";
        else if (lowerContent.includes("thought:")) statusText = "Thinking...";

        let internalHtml = this._processMarkdown(content, new Map());

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
        const langGrammar = Prism.languages[lang];
        const highlightedCode = langGrammar ? Prism.highlight(block.content, langGrammar, lang) : escapeHtml(block.content);
        return `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="${lang}" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>${LANGUAGE_MAP[lang] || lang}</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre></div></div>`;
    },

    _renderTerminalBlock(code, lang) {
        const langGrammar = Prism.languages[lang];
        const highlightedCode = langGrammar ? Prism.highlight(code, langGrammar, lang) : escapeHtml(code);
        return `<div class="code-block-wrapper terminal-style" data-raw-content="${encodeURIComponent(code)}"><div class="code-block-header terminal-header"><div class="terminal-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div><span>EXECUTE: ${lang}</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-${lang} terminal-body"><code class="language-${lang}">${highlightedCode}</code></pre></div></div>`;
    },
    
    _renderHtmlPreview(block) {
        const langGrammar = Prism.languages['html'];
        const highlightedCode = langGrammar ? Prism.highlight(block.content, langGrammar, 'html') : escapeHtml(block.content);
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="html" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>HTML</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-html"><code class="language-html">${highlightedCode}</code></pre></div></div>`;
        const safeHtmlForSrcdoc = this._escapeForSrcdoc(block.content);
        return `<div class="html-preview-container"><div class="html-render-box"><iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy"></iframe></div>${codeBlockHtml}</div>`;
    },

    _renderSvgPreview(block) {
        const langGrammar = Prism.languages['xml'];
        const highlightedCode = langGrammar ? Prism.highlight(block.content, langGrammar, 'xml') : escapeHtml(block.content);
        const codeBlockHtml = `<div class="code-block-wrapper is-collapsible is-collapsed" data-previewable="svg" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>SVG</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-xml"><code class="language-xml">${highlightedCode}</code></pre></div></div>`;
        const encodedSvg = btoa(block.content);
        return `<div class="svg-preview-container"><div class="svg-render-box"><img src="data:image/svg+xml;base64,${encodedSvg}" alt="SVG Preview"></div>${codeBlockHtml}</div>`;
    },

    _renderImageBlock(block) {
        const safeAlt = escapeHtml(block.alt);
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
        let finalHtml = '';
        const blockRegex = /(<(?:div|blockquote|ul|ol|table|h[1-6]|pre|hr|dl)[\s\S]*?<\/(?:div|blockquote|ul|ol|table|h[1-6]|pre|dl)>|<hr>|<div class="callout[\s\S]*?<\/div>|<div class="math-block"[\s\S]*?<\/div>|<div class="agent-process-container[\s\S]*?<\/div>)/;
        const parts = html.split(blockRegex);
        
        for (const part of parts) {
            if (!part || /^\s*$/.test(part)) continue;
            
            if (part.trim().startsWith('<') && !part.startsWith('<span') && !part.startsWith('<a ') && !part.startsWith('<strong') && !part.startsWith('<em') && !part.startsWith('<code') && !part.startsWith('<kbd')) {
                finalHtml += part;
            } else {
                const paragraphs = part.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
                finalHtml += paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
        }
        return finalHtml;
    },

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
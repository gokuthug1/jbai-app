import { SyntaxHighlighter } from './syntaxHighlighter.js';

const LANGUAGE_MAP = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', js: 'JavaScript',
    lua: 'Lua', python: 'Python', py: 'Python', xml: 'SVG', svg: 'SVG',
    sh: 'Shell', bash: 'Shell', json: 'JSON',
    bat: 'Batch', cmd: 'Batch', batch: 'Batch'
};

export const MessageFormatter = {
    async format(input, metadata = null) {
        if (!input) return '';
        let parts = Array.isArray(input) ? input : [{ text: input }];
        let finalHtml = '';

        for (const part of parts) {
            if (part.text) {
                let textContent = part.text;
                if (metadata && metadata.groundingChunks) {
                    textContent = this._processCitations(textContent, metadata.groundingChunks);
                }
                const { processedText, blocks } = this._extractAndReplaceBlocks(textContent);
                let html = this._processMarkdown(processedText);
                html = await this._reinsertBlocks(html, blocks);
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

        if (metadata && metadata.groundingChunks) {
            finalHtml += this._renderSourcesList(metadata.groundingChunks);
        }
        return finalHtml;
    },

    _extractAndReplaceBlocks(text) {
        let processedText = text;
        const blocks = [];
        const generatePlaceholder = (block) => {
            const id = blocks.length;
            blocks.push(block);
            return `JBAIBLOCK${id}`;
        };

        processedText = processedText.replace(/```(\w+)?\s*\r?\n([\s\S]*?)\s*```/g, (match, lang, code) => {
            return generatePlaceholder({ type: 'code', lang: lang || 'plaintext', content: code.trim() });
        });

        processedText = processedText.replace(/^(<svg[\s\S]*?<\/svg>)$/gm, (match, svgContent) => {
            return generatePlaceholder({ type: 'svg', content: svgContent.trim() });
        });

        processedText = processedText.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
            return generatePlaceholder({ type: 'image', alt: alt, url: url });
        });

        return { processedText, blocks };
    },

    _processMarkdown(text) {
        let workingText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        workingText = workingText.replace(/&lt;a href="([^"]+)" class="citation-ref"&gt;(\[\d+\])&lt;\/a&gt;/g, '<a href="$1" class="citation-ref">$2</a>');

        // Table support
        workingText = workingText.replace(/(\n|^)\|(.+)\|(\n\|[-:| ]+\|)(\n\|.+?\|)+/g, (tableMatch) => {
            const rows = tableMatch.trim().split('\n');
            let tableHtml = '<table><thead><tr>';
            const headers = rows[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
            tableHtml += headers + '</tr></thead><tbody>';
            for (let i = 2; i < rows.length; i++) {
                const cells = rows[i].split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                tableHtml += `<tr>${cells}</tr>`;
            }
            return tableHtml + '</tbody></table>';
        });

        return workingText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/^\s*# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\s*## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^\s*### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote><p>${match.replace(/^> /gm, '').trim().replace(/\n/g, '</p><p>')}</p></blockquote>`)
            .replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*]\s*/, '')}</li>`).join('')}</ul>`)
            .replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\.\s*/, '')}</li>`).join('')}</ol>`);
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
        const parts = html.split(/(JBAIBLOCK\d+)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)/);
            if (!match) return part;
            const block = blocks[parseInt(match[1], 10)];
            if (block.type === 'code') {
                if (block.lang.toLowerCase() === 'html') return this._renderHtmlPreview(block);
                return this._renderCodeBlock(block);
            }
            if (block.type === 'svg') return this._renderSvgPreview(block);
            if (block.type === 'image') return this._renderImageBlock(block);
            return '';
        }));
        return processedParts.join('');
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
        const safeFilename = (safeAlt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
        return `<div class="generated-image-wrapper"><p class="image-prompt-text"><em>Image Prompt: ${safeAlt}</em></p><div class="image-container"><img src="${block.url}" alt="${safeAlt}" class="generated-image"><a href="${block.url}" download="${safeFilename}.png" class="download-image-button" data-tooltip="Download Image"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a></div></div>`;
    },

    _wrapInParagraphs(html) {
        let finalHtml = '';
        const parts = html.split(/(<(?:div|blockquote|ul|ol|table|h[1-6]|pre)[\s\S]*?<\/(?:div|blockquote|ul|ol|table|h[1-6]|pre)>)/);
        for (const part of parts) {
            if (!part || /^\s*$/.test(part)) continue;
            if (part.startsWith('<')) {
                finalHtml += part;
            } else {
                const paragraphs = part.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
                finalHtml += paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            }
        }
        return finalHtml;
    },

    _escapeForSrcdoc(str) {
        if (!str) return "";
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
};
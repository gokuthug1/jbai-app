import { SyntaxHighlighter } from './syntaxHighlighter.js';

/**
 * A dedicated module for formatting AI message content.
 * Handles Markdown, code blocks, HTML/SVG previews with script inlining, and custom tags.
 * @namespace MessageFormatter
 */

const LANGUAGE_MAP = {
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    js: 'JavaScript',
    lua: 'Lua',
    python: 'Python',
    xml: 'SVG',
    svg: 'SVG'
};


export const MessageFormatter = {
    /**
     * The main entry point for formatting a raw text message from the AI.
     * @param {string} text - The raw text content.
     * @param {object} options - Formatting options.
     * @param {boolean} options.canvasMode - If true, previews are omitted from the output.
     * @returns {Promise<string>} A promise that resolves to the fully formatted HTML string.
     */
    async format(text, options = {}) {
        if (!text) return '';
        const { processedText, blocks } = this._extractAndReplaceBlocks(text);
        let html = this._processMarkdown(processedText);
        html = await this._reinsertBlocks(html, blocks, options);
        html = this._processImageTags(html);
        return this._wrapInParagraphs(html);
    },

    /**
     * Finds all code, HTML, and SVG blocks, replaces them with placeholders,
     * and returns the processed text and an array of the extracted blocks.
     * @private
     */
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

        return { processedText, blocks };
    },

    /**
     * Applies standard Markdown-to-HTML conversions.
     * @private
     */
    _processMarkdown(text) {
        const escapedText = SyntaxHighlighter.escapeHtml(text);
        return escapedText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[([^\\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^(> (.*)\n?)+/gm, (match) => `<blockquote><p>${match.replace(/^> /gm, '').trim().replace(/\n/g, '</p><p>')}</p></blockquote>`)
            .replace(/^((\s*[-*] .*\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*[-*]\s*/, '')}</li>`).join('')}</ul>`)
            .replace(/^((\s*\d+\. .*\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(i => `<li>${i.replace(/^\s*\d+\.\s*/, '')}</li>`).join('')}</ol>`);
    },

    /**
     * Asynchronously replaces placeholders with fully rendered HTML for each block.
     * @private
     */
    async _reinsertBlocks(html, blocks, options) {
        const parts = html.split(/(JBAIBLOCK\d+)/g);
        const processedParts = await Promise.all(parts.map(async (part) => {
            const match = part.match(/JBAIBLOCK(\d+)/);
            if (!match) return part;
            
            const block = blocks[parseInt(match[1], 10)];
            switch (block.type) {
                case 'code':
                    if (block.lang.toLowerCase() === 'html') {
                        return await this._renderHtmlPreview(block, options);
                    }
                    return this._renderCodeBlock(block);
                case 'svg':
                    return this._renderSvgPreview(block, options);
                default:
                    return '';
            }
        }));
        return processedParts.join('');
    },

    /**
     * Renders a standard code block using the custom syntax highlighter.
     * @private
     */
    _renderCodeBlock(block) {
        const lang = block.lang.toLowerCase();
        const displayName = LANGUAGE_MAP[lang] || lang;
        const highlightedCode = SyntaxHighlighter.highlight(block.content, lang);
        // Standard code blocks are always collapsible, but we'll un-collapse them in canvas mode via JS/CSS
        const isCollapsible = !['html', 'svg', 'xml'].includes(lang);
        const wrapperClasses = `code-block-wrapper ${isCollapsible ? 'is-collapsible is-collapsed' : ''}`;
        return `<div class="${wrapperClasses}"><div class="code-block-header"><span>${displayName}</span><div class="code-block-actions"></div></div><div class="collapsible-content"><pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre></div></div>`;
    },
    
    /**
     * Renders an HTML preview block, inlining scripts and highlighting the code view.
     * @private
     */
    async _renderHtmlPreview(block, options = {}) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html');
        const codeBlockHtml = `<div class="code-block-wrapper" data-previewable="html" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>HTML</span><div class="code-block-actions"></div></div><pre class="language-html"><code class="language-html">${highlightedCode}</code></pre></div>`;

        if (options.canvasMode) {
            // In Canvas mode, only render the code block inside the chat message.
            return codeBlockHtml;
        }

        // In normal mode, render the preview and the collapsible code block.
        const inlinedHtml = await this._inlineExternalScripts(block.content);
        const safeHtmlForSrcdoc = inlinedHtml.replace(/"/g, '&quot;');
        return `<div class="html-preview-container"><h4>Live Preview</h4><div class="html-render-box"><iframe srcdoc="${safeHtmlForSrcdoc}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock" loading="lazy" title="HTML Preview"></iframe></div><h4>HTML Code</h4>${codeBlockHtml.replace('<div class="code-block-wrapper"', '<div class="code-block-wrapper is-collapsible is-collapsed"')}`
    },

    /**
     * Renders an SVG preview block and highlights the code view.
     * @private
     */
    _renderSvgPreview(block, options = {}) {
        const highlightedCode = SyntaxHighlighter.highlight(block.content, 'html'); // Use HTML grammar for SVG
        const codeBlockHtml = `<div class="code-block-wrapper" data-previewable="svg" data-raw-content="${encodeURIComponent(block.content)}"><div class="code-block-header"><span>SVG</span><div class="code-block-actions"></div></div><pre class="language-xml"><code class="language-xml">${highlightedCode}</code></pre></div>`;

        if (options.canvasMode) {
            // In Canvas mode, only render the code block inside the chat message.
            return codeBlockHtml;
        }

        // In normal mode, render the preview and the collapsible code block.
        const encodedSvg = btoa(block.content);
        return `<div class="svg-preview-container"><h4>SVG Preview</h4><div class="svg-render-box"><img src="data:image/svg+xml;base64,${encodedSvg}" alt="SVG Preview"></div><h4>SVG Code</h4>${codeBlockHtml.replace('<div class="code-block-wrapper"', '<div class="code-block-wrapper is-collapsible is-collapsed"')}`;
    },
    
    /**
     * Fetches external scripts via a CORS proxy and embeds them as inline scripts.
     * @private
     */
    async _inlineExternalScripts(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const scriptTags = doc.querySelectorAll('script[src]');
        if (scriptTags.length === 0) return htmlContent;

        const fetchPromises = Array.from(scriptTags).map(async (tag) => {
            const src = tag.getAttribute('src');
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const scriptText = await response.text();
                const inlineScript = doc.createElement('script');
                inlineScript.textContent = scriptText;
                tag.parentNode.replaceChild(inlineScript, tag);
            } catch (error) {
                console.error(`Error inlining script from ${src}:`, error);
                tag.parentNode.replaceChild(doc.createComment(` JBAI Error: Failed to load script from ${src} `), tag);
            }
        });
        await Promise.all(fetchPromises);
        return doc.documentElement.outerHTML;
    },

    /**
     * Processes custom [IMAGE:...] tags into HTML.
     * @private
     */
    _processImageTags(html) {
        return html.replace(/\[IMAGE: (.*?)\]\((.*?)\)/g, (match, alt, url) => {
            const safeAlt = SyntaxHighlighter.escapeHtml(alt);
            const safeFilename = (safeAlt.replace(/[^a-z0-9_.-]/gi, ' ').trim().replace(/\s+/g, '_') || 'generated-image').substring(0, 50);
            return `<div class="generated-image-wrapper"><p class="image-prompt-text"><em>Image Prompt: ${safeAlt}</em></p><div class="image-container"><img src="${url}" alt="${safeAlt}" class="generated-image"><a href="${url}" download="${safeFilename}.png" class="download-image-button" data-tooltip="Download Image" aria-label="Download Image"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a></div></div>`;
        });
    },

    /**
     * Intelligently wraps remaining text nodes in paragraph tags.
     * @private
     */
    _wrapInParagraphs(html) {
        let finalHtml = '';
        const parts = html.split(/(<(?:div|blockquote|ul|ol|h[1-6]|pre)[\s\S]*?<\/(?:div|blockquote|ul|ol|h[1-6]|pre)>)/);
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
    }
};

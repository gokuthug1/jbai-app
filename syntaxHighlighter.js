/**
 * A lightweight, regex-based syntax highlighter created from scratch.
 * It defines grammars for various languages and applies them to code strings.
 * @namespace SyntaxHighlighter
 */
export const SyntaxHighlighter = {
    /**
     * Defines the grammar rules for each supported language.
     * The order of rules is important: process strings and comments first.
     */
    GRAMMAR: {
        javascript: {
            'comment': /(?:\/\/.*)|(?:\/\*[\s\S]*?\*\/)/,
            'string': /(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`)/,
            'class-name': /\b[A-Z][A-Za-z0-9]+\b/,
            'jbai-keyword': new RegExp(`\\b(ChatApp|Config|State|Utils|Store|UI|Api|Controller|init|handleChatSubmission|renderMessage|finalizeBotMessage|getSystemContext|fetchTextResponse|loadChat|saveCurrentChat)\\b`),
            'keyword': /\b(?:const|let|var|if|else|for|while|do|async|await|function|return|new|import|export|from|class|extends|super|this|switch|case|default|break|continue|try|catch|finally|throw|delete|typeof|instanceof)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
            'boolean': /\b(?:true|false|null|undefined)\b/,
            'operator': /[|&^!~*\/%<>=+-]=?|&&|\|\||\?/,
            'punctuation': /[{}[\]();,.:]/,
        },
        python: {
            'comment': /#.*/,
            'string': /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"/,
            'keyword': /\b(?:def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|lambda|and|or|not|is|in)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?\b/,
            'boolean': /\b(?:True|False|None)\b/,
        },
        lua: {
            'comment': /--.*/,
            'string': /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"/,
            'keyword': /\b(?:function|end|if|then|else|elseif|for|while|do|return|local|and|or|not)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?\b/,
            'boolean': /\b(?:true|false|nil)\b/,
        },
        html: {
            'comment': /<!--[\s\S]*?-->/,
            'tag': /<\/?[\w\s="/.':-]+\/?>/,
            'attr-name': /\s+[\w-.:]+(?==)/,
            'attr-value': /="[^"]*"|='[^']*'/,
        },
        css: {
            'comment': /\/\*[\s\S]*?\*\//,
            'selector': /[^{}\s][^{}]*(?=\s*\{)/,
            'property': /[\w-]+(?=\s*:)/,
            'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
            'function': /\b(?:rgb|rgba|url|calc|var)\b/,
            'number': /\b-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh)?\b/,
        },
    },

    /**
     * Takes a raw code string and a language, and returns HTML with syntax highlighting.
     * @param {string} code - The raw code to highlight.
     * @param {string} lang - The programming language (e.g., 'javascript', 'python').
     * @returns {string} The HTML-formatted highlighted code.
     */
    highlight(code, lang) {
        const grammar = this.GRAMMAR[lang];
        if (!grammar) {
            return this.escapeHtml(code);
        }

        // The token stream is an array of strings and tokens
        let tokenStream = [code];

        for (const tokenName in grammar) {
            const pattern = grammar[tokenName];
            const newStream = [];

            tokenStream.forEach(token => {
                if (typeof token === 'string') {
                    const regex = new RegExp(pattern, 'g');
                    let lastIndex = 0;
                    let match;
                    while ((match = regex.exec(token))) {
                        const prevText = token.slice(lastIndex, match.index);
                        if (prevText) newStream.push(prevText);
                        
                        newStream.push({ type: tokenName, content: match[0] });
                        lastIndex = regex.lastIndex;
                    }
                    const remainingText = token.slice(lastIndex);
                    if (remainingText) newStream.push(remainingText);
                } else {
                    newStream.push(token);
                }
            });
            tokenStream = newStream;
        }

        return tokenStream.map(token => {
            if (typeof token === 'string') {
                return this.escapeHtml(token);
            }
            return `<span class="token ${token.type}">${this.escapeHtml(token.content)}</span>`;
        }).join('');
    },

    /**
     * Escapes HTML special characters in a string.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};

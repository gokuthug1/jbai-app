/**
 * A lightweight, regex-based syntax highlighter.
 * @namespace SyntaxHighlighter
 */
export const SyntaxHighlighter = {
    GRAMMAR: {
        json: {
            'property': /"(?:\\.|[^"\\])*"(?=\s*:)/,
            'string': /"(?:\\.|[^"\\])*"/,
            'number': /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
            'boolean': /\b(?:true|false|null)\b/,
            'operator': /:/,
            'punctuation': /[{}[\](),]/,
        },
        javascript: {
            'comment': /(\/\/.*)|(\/\*[\s\S]*?\*\/)/,
            'string': /(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`)/,
            'class-name': /\b[A-Z][A-Za-z0-9_]+\b/,
            'jbai-keyword': /\b(ChatApp|Config|State|Utils|Store|UI|Api|Controller)\b/,
            'keyword': /\b(?:const|let|var|if|else|for|while|do|async|await|function|return|new|import|export|from|class|extends|super|this|switch|case|default|break|continue|try|catch|finally|throw|delete|typeof|instanceof|void)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
            'boolean': /\b(?:true|false|null|undefined)\b/,
            'operator': /=>|\.\.\.|[|&^!~*\/%<>=+-]=?|&&|\|\||\?/,
            'punctuation': /[{}[\]();,.:]/,
        },
        python: {
            'comment': /#.*/,
            'string': /(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\'|[^'])*'|"(?:\\"|[^"])*")/,
            'keyword': /\b(?:def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|lambda|and|or|not|is|in|pass|break|continue|global|nonlocal)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?\b/,
            'boolean': /\b(?:True|False|None)\b/,
            'operator': /([*\/%+\-&|~^<>=!]=?|[*\/]=|\/\/|@)/,
            'punctuation': /[{}[\]();,.:]/,
        },
        lua: {
            'comment': /--.*|--\[\[[\s\S]*?\]\]/,
            'string': /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\[\[[\s\S]*?\]\]/,
            'keyword': /\b(?:function|end|if|then|else|elseif|for|while|do|return|local|and|or|not|break|repeat|until|in)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?\b/,
            'boolean': /\b(?:true|false|nil)\b/,
            'operator': /[+\-%*\/#^=~]=?|~=|[<>]=?|\.\.\.?/,
            'punctuation': /[{}[\]();,.:]/,
        },
        html: {
            'comment': /<!--[\s\S]*?-->/,
            'doctype': /<!DOCTYPE[\s\S]+?>/i,
            'tag': /<\/?[\w:-]+\b/, 
            'attr-value': /("|')(?:\\\1|.)*?\1/,
            'attr-name': /[\w:-]+(?=\s*=\s*["'])/, 
            'punctuation': /\/?>|=/
        },
        css: {
            'comment': /\/\*[\s\S]*?\*\//,
            'selector': /[^{}\s][^{}]*(?=\s*\{)/,
            'property': /[\w-]+(?=\s*:)/,
            'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
            'function': /\b(?:rgb|rgba|url|calc|var|min|max|clamp)\b/,
            'number': /\b-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh|deg|s|ms)?\b/,
        },
        bash: {
             'comment': /#.*/,
             'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
             'variable': /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}/,
             'keyword': /\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|return|exit|echo|printf|read|source|export|local)\b/,
             'function': /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\(\))/,
             'operator': /&&|\|\||;;|\||&|>|<|!/,
             'number': /\b\d+\b/
        }
    },

    highlight(code, lang) {
        const alias = { 'xml': 'html', 'svg': 'html', 'sh': 'bash', 'shell': 'bash', 'js': 'javascript' };
        const effectiveLang = alias[lang] || lang;

        if (effectiveLang === 'html') {
            return this.highlightHtml(code);
        }

        return this._highlightBasic(code, effectiveLang);
    },

    highlightHtml(code) {
        // Regex to split by script and style tags to handle embedded languages
        // Capturing groups: 1=open tag, 2=content, 3=close tag
        const regex = /(<script[\s\S]*?>)([\s\S]*?)(<\/script>)|(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/gi;
        
        let lastIndex = 0;
        let result = '';
        let match;

        while ((match = regex.exec(code)) !== null) {
            // Text before the match (Standard HTML)
            const htmlPart = code.slice(lastIndex, match.index);
            if (htmlPart) {
                result += this._highlightBasic(htmlPart, 'html');
            }

            if (match[1]) { // It's a script
                const openTag = match[1];
                const scriptContent = match[2];
                const closeTag = match[3];
                
                // Highlight the tags as HTML
                result += this._highlightBasic(openTag, 'html');
                // Highlight the content as JS
                result += this._highlightBasic(scriptContent, 'javascript');
                // Highlight the close tag as HTML
                result += this._highlightBasic(closeTag, 'html');
            } else if (match[4]) { // It's a style
                const openTag = match[4];
                const styleContent = match[5];
                const closeTag = match[6];
                
                result += this._highlightBasic(openTag, 'html');
                result += this._highlightBasic(styleContent, 'css');
                result += this._highlightBasic(closeTag, 'html');
            }

            lastIndex = regex.lastIndex;
        }

        // Remaining HTML
        const tail = code.slice(lastIndex);
        if (tail) {
            result += this._highlightBasic(tail, 'html');
        }

        return result;
    },

    _highlightBasic(code, lang) {
        const grammar = this.GRAMMAR[lang];
        if (!grammar) {
            return this.escapeHtml(code);
        }

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

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};
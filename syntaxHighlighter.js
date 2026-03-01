/**
 * A lightweight, regex-based syntax highlighter.
 * Note: Pure Regex highlighting is not an AST parser, so extreme edge-cases 
 * (like highly nested string interpolations) may fall back to default text colors.
 * 
 * @namespace SyntaxHighlighter
 */
export const SyntaxHighlighter = {
    // PRECEDENCE MATTERS: The order of keys here dictates token matching priority.
    // Rule of thumb: Comments > Strings > Keywords > Functions > Numbers > Operators.
    GRAMMAR: {
        json: {
            'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
            'property': /"(?:\\.|[^"\\])*"(?=\s*:)/,
            'string': /"(?:\\.|[^"\\])*"/,
            'number': /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
            'boolean': /\b(?:true|false|null)\b/,
            'operator': /:/,
            'punctuation': /[{}[\](),]/,
        },
        javascript: {
            'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
            // Supports single, double, and template literals
            'string': /(?:`(?:\\`|[^`])*`|'(?:\\'|[^'])*'|"(?:\\"|[^"])*")/,
            'regex': /\/(?:\\\/|[^\n\r/])+\/[gimyus]*/,
            'class-name': /\b[A-Z][A-Za-z0-9_]+\b/,
            'jbai-keyword': /\b(ChatApp|Config|State|Utils|Store|UI|Api|Controller)\b/,
            'keyword': /\b(?:const|let|var|if|else|for|while|do|async|await|function|return|new|import|export|from|class|extends|super|this|switch|case|default|break|continue|try|catch|finally|throw|delete|typeof|instanceof|void|yield)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][a-fA-F0-9]+\b/,
            'boolean': /\b(?:true|false|null|undefined)\b/,
            'operator': /=>|\.\.\.|[|&^!~*\/%<>=+-]=?|&&|\|\||\?|:/,
            'punctuation': /[{}[\]();,.]/,
        },
        python: {
            'comment': /#.*/,
            // Supports f-strings, raw strings, and triple quotes
            'string': /[fFbrR]*(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\'|[^'])*'|"(?:\\"|[^"])*")/,
            'keyword': /\b(?:def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|lambda|and|or|not|is|in|pass|break|continue|global|nonlocal|yield|async|await)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][a-fA-F0-9]+\b/,
            'boolean': /\b(?:True|False|None)\b/,
            'operator': /([*\/%+\-&|~^<>=!]=?|[*\/]=|\/\/|@)/,
            'punctuation': /[{}[\]();,.:]/,
        },
        lua: {
            'comment': /--\[\[[\s\S]*?\]\]|--.*/,
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
            'attr-value': /=(?:("|')(?:\\\1|.)*?\1|[^\s>]+)/,
            'attr-name': /\s+[a-zA-Z0-9:\-]+(?=\s*=\s*|\s*>|\s*\/>)/,
            'tag': /<\/?[\w:-]+\b/, 
            'punctuation': /\/?>|<|=/
        },
        css: {
            'comment': /\/\*[\s\S]*?\*\//,
            'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
            'function': /\b(?:rgb|rgba|hsl|hsla|url|calc|var|min|max|clamp)\b(?=\()/,
            'selector': /[^{}\s][^{}]*(?=\s*\{)/,
            'property': /[\w-]+(?=\s*:)/,
            'number': /\b-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh|deg|s|ms|pt)?\b/,
            'operator': /!important|:|;/,
            'punctuation': /[{}]/
        },
        bash: {
             'comment': /#.*/,
             'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
             'variable': /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}/,
             'keyword': /\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|return|exit|echo|printf|read|source|export|local|alias|set)\b/,
             'function': /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\(\))/,
             'operator': /&&|\|\||;;|\||&|>|<|!|=/,
             'number': /\b\d+\b/
        },
        sql: {
            'comment': /--.*|\/\*[\s\S]*?\*\//,
            'string': /'(?:''|[^'])*'|"(?:""|[^"])*"/,
            'keyword': /\b(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|JOIN|INNER|OUTER|LEFT|RIGHT|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|AS|DISTINCT|CASE|WHEN|THEN|ELSE|END|IS|NULL|AND|OR|NOT|IN|EXISTS|LIKE|ILIKE|VALUES|SET|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|AUTO_INCREMENT|SERIAL)\b/i,
            'function': /\b(?:COUNT|SUM|AVG|MIN|MAX|NOW|DATE|CONCAT|COALESCE|CAST)\b/i,
            'number': /\b-?\d+(?:\.\d+)?\b/,
            'operator': /[=<>!+\-*/]+/,
            'punctuation': /[();,.]/
        },
        cpp: {
             'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
             'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
             'keyword': /\b(?:int|float|double|char|void|if|else|for|while|do|switch|case|default|break|continue|return|struct|class|public|private|protected|static|const|virtual|override|new|delete|using|namespace|include|template|typename|bool|auto|inline)\b/,
             'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
             'number': /\b-?\d+(?:\.\d+)?(?:[fFdD])?\b|\b0[xX][a-fA-F0-9]+\b/,
             'boolean': /\b(?:true|false)\b/,
             'operator': /::|->|[+\-*\/%&|^!~=<>]=?|<<|>>|&&|\|\||\?|:/,
             'punctuation': /[{}[\]();,.]/
        },
        java: {
            'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
            'string': /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/,
            'keyword': /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:[fFdDlL])?\b|\b0[xX][a-fA-F0-9]+\b/,
            'boolean': /\b(?:true|false|null)\b/,
            'operator': /->|[+\-*\/%&|^!~=<>]=?|&&|\|\||\?|:/,
            'punctuation': /[{}[\]();,.]/
        },
        rust: {
            'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
            'string': /"(?:\\"|[^"])*"|r#"[^]*?"#/,
            'keyword': /\b(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while)\b/,
            'function': /\b[a-z_][A-Za-z0-9_]*(?=\s*\()|\b[a-z_][A-Za-z0-9_]*(?=!)/i,
            'number': /\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[ef]\d+)?(?:[iu](?:8|16|32|64|128|size)|f(?:32|64))?\b|\b0x[a-fA-F0-9_]+\b/,
            'boolean': /\b(?:true|false)\b/,
            'operator': /=>|->|::|[+\-*\/%&|^!~=<>]=?|&&|\|\||\?/,
            'punctuation': /[{}[\]();,.]/
        },
        go: {
            'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
            'string': /"(?:\\"|[^"])*"|`(?:[^`])*`|'(?:\\'|[^'])*'/,
            'keyword': /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
            'function': /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
            'number': /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][a-fA-F0-9]+\b/,
            'boolean': /\b(?:true|false|nil)\b/,
            'operator': /:=|<-|\.\.\.|[+\-*\/%&|^!~=<>]=?|&&|\|\|/,
            'punctuation': /[{}[\]();,.]/
        },
        markdown: {
            'comment': /<!--[\s\S]*?-->/,
            'keyword': /^#{1,6}.*$/m, // Headers
            'string': /(`{1,3})[\s\S]*?\1/, // Inline code & blocks
            'variable': /\[.*?\]\(.*?\)|!\[.*?\]\(.*?\)/, // Links/Images
            'function': /\*\*[^*]+\*\*|__[^\n]+__/, // Bold
            'operator': /\*[^*]+\*|_[^\n]+_/, // Italic
            'punctuation': /^[*\-+]\s|\d+\.\s/m // Lists
        }
    },

    /**
     * Highlights code with syntax highlighting
     * @param {string} code - Code to highlight
     * @param {string} lang - Language identifier
     * @returns {string} HTML with syntax highlighting
     */
    highlight(code, lang) {
        if (!code || typeof code !== 'string') {
            return this.escapeHtml(String(code || ''));
        }
        
        if (!lang || typeof lang !== 'string') {
            return this.escapeHtml(code);
        }
        
        // Expanded Alias Mapping
        const alias = { 
            'xml': 'html', 'svg': 'html', 'vue': 'html',
            'sh': 'bash', 'shell': 'bash', 'zsh': 'bash',
            'js': 'javascript', 'ts': 'javascript', 'typescript': 'javascript', 'jsx': 'javascript', 'tsx': 'javascript',
            'c': 'cpp', 'h': 'cpp', 'hpp': 'cpp', 'cc': 'cpp', 'c++': 'cpp', 
            'cs': 'java', 'csharp': 'java', 'kotlin': 'java', // Java is close enough for simple C#/Kotlin mapping
            'py': 'python', 'py3': 'python',
            'md': 'markdown', 
            'yml': 'json', 'yaml': 'json', // JSON is a decent fallback for simple YAML syntax
            'bat': 'bash', 'cmd': 'bash', 
            'rb': 'ruby',
            'rs': 'rust',
            'golang': 'go'
        };
        const effectiveLang = (alias[lang.toLowerCase()] || lang).toLowerCase();

        if (effectiveLang === 'html') {
            return this.highlightHtml(code);
        }

        return this._highlightBasic(code, effectiveLang);
    },

    highlightHtml(code) {
        // Safer multi-regex for embedded JS and CSS. Matches tags more carefully.
        const regex = /(<script[^>]*>)([\s\S]*?)(<\/script>)|(<style[^>]*>)([\s\S]*?)(<\/style>)/gi;
        
        let lastIndex = 0;
        let result = '';
        let match;

        while ((match = regex.exec(code)) !== null) {
            const htmlPart = code.slice(lastIndex, match.index);
            if (htmlPart) {
                result += this._highlightBasic(htmlPart, 'html');
            }

            if (match[1]) {
                result += this._highlightBasic(match[1], 'html');
                result += this._highlightBasic(match[2], 'javascript');
                result += this._highlightBasic(match[3], 'html');
            } else if (match[4]) {
                result += this._highlightBasic(match[4], 'html');
                result += this._highlightBasic(match[5], 'css');
                result += this._highlightBasic(match[6], 'html');
            }

            lastIndex = regex.lastIndex;
        }

        const tail = code.slice(lastIndex);
        if (tail) {
            result += this._highlightBasic(tail, 'html');
        }

        return result;
    },

    /**
     * Basic syntax highlighting using regex patterns
     * @param {string} code - Code to highlight
     * @param {string} lang - Language identifier
     * @returns {string} HTML with syntax highlighting
     * @private
     */
    _highlightBasic(code, lang) {
        if (!code || typeof code !== 'string') {
            return this.escapeHtml(String(code || ''));
        }
        
        const grammar = this.GRAMMAR[lang];
        if (!grammar) {
            return this.escapeHtml(code);
        }

        let tokenStream =[code];

        // Because JS guarantees insertion order for standard string keys in objects,
        // this cleanly applies Tokens in the correct order (Comments -> Strings -> Keywords).
        for (const tokenName in grammar) {
            if (!grammar.hasOwnProperty(tokenName)) continue;
            
            const pattern = grammar[tokenName];
            const newStream =[];

            tokenStream.forEach(token => {
                // If it's a string, it hasn't been tokenized yet. Parse it.
                if (typeof token === 'string') {
                    try {
                        const regex = new RegExp(pattern, 'g');
                        let lastIndex = 0;
                        let match;
                        
                        while ((match = regex.exec(token)) !== null) {
                            const prevText = token.slice(lastIndex, match.index);
                            if (prevText) newStream.push(prevText);
                            
                            newStream.push({ type: tokenName, content: match[0] });
                            lastIndex = regex.lastIndex;
                            
                            // Prevent infinite loops on zero-length matches
                            if (match[0].length === 0) {
                                regex.lastIndex++;
                            }
                        }
                        
                        const remainingText = token.slice(lastIndex);
                        if (remainingText) newStream.push(remainingText);
                    } catch (error) {
                        console.warn(`Syntax Highlighter - Regex error for token ${tokenName}:`, error);
                        newStream.push(token);
                    }
                } else {
                    // Already a matched token, leave it alone (protects against nested overlaps)
                    newStream.push(token);
                }
            });
            tokenStream = newStream;
        }

        return tokenStream.map(token => {
            if (typeof token === 'string') {
                return this.escapeHtml(token);
            }
            return `<span class="token ${this.escapeHtml(token.type)}">${this.escapeHtml(token.content)}</span>`;
        }).join('');
    },

    /**
     * Escapes HTML special characters securely
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (!str && str !== 0) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        // By escaping quotes as well, we protect against payload escapes
        return String(str).replace(/[&<>"']/g, m => map[m]);
    }
};
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: '1rem',
      fontSize: '0.875rem',
      lineHeight: '1.7',
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: 'transparent',
      fontFamily: 'var(--font-mono)',
    },
  };

  return (
    <div className="code-block rounded-lg overflow-hidden border border-obsidian-600 bg-obsidian-800">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-obsidian-700 border-b border-obsidian-600">
          <span className="text-sm font-mono text-obsidian-200">{filename}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-obsidian-300 hover:text-cyber-yellow transition-colors rounded hover:bg-obsidian-600"
          >
            {copied ? (
              <>
                <Check size={14} className="text-cyber-green" />
                <span className="text-cyber-green">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          showLineNumbers={showLineNumbers}
          wrapLines={true}
          lineProps={(lineNumber) => {
            const style: React.CSSProperties = { display: 'block' };
            if (highlightLines.includes(lineNumber)) {
              style.backgroundColor = 'rgba(240, 219, 79, 0.1)';
              style.borderLeft = '3px solid #f0db4f';
              style.marginLeft = '-3px';
              style.paddingLeft = '3px';
            }
            return { style };
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#5c5c73',
            userSelect: 'none',
          }}
        >
          {code.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}


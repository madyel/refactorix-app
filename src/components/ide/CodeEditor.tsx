import { X } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

interface OpenTab {
  name: string;
  path: string;
  content: string;
  language?: string;
}

interface CodeEditorProps {
  openTabs: OpenTab[];
  activeTab: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
  onContentChange?: (path: string, content: string) => void;
}

const highlightLine = (line: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  const patterns: [RegExp, string][] = [
    [/\/\/.*/g, "text-ide-comment"],
    [/"[^"]*"|'[^']*'|`[^`]*`/g, "text-ide-string"],
    [/\b(import|from|export|default|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|async|await|try|catch|throw)\b/g, "text-ide-keyword"],
    [/\b(true|false|null|undefined|void)\b/g, "text-ide-keyword"],
    [/\b\d+\.?\d*\b/g, "text-ide-number"],
    [/\b([A-Z][a-zA-Z0-9]*)\b/g, "text-ide-type"],
    [/\b([a-z][a-zA-Z0-9]*)\s*(?=\()/g, "text-ide-function"],
  ];

  let remaining = line;
  let key = 0;

  const commentIdx = remaining.indexOf("//");
  if (commentIdx !== -1) {
    const before = remaining.slice(0, commentIdx);
    const comment = remaining.slice(commentIdx);
    return [
      <span key={key++}>{highlightSegment(before, patterns)}</span>,
      <span key={key++} className="text-ide-comment">{comment}</span>,
    ];
  }

  return [<span key={0}>{highlightSegment(remaining, patterns)}</span>];
};

const highlightSegment = (text: string, patterns: [RegExp, string][]): React.ReactNode => {
  let parts: React.ReactNode[] = [text];

  for (const [pattern, className] of patterns) {
    const newParts: React.ReactNode[] = [];
    for (const part of parts) {
      if (typeof part !== "string") {
        newParts.push(part);
        continue;
      }
      const regex = new RegExp(pattern.source, "g");
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIdx) {
          newParts.push(part.slice(lastIdx, match.index));
        }
        newParts.push(
          <span key={`${match.index}-${className}`} className={className}>
            {match[0]}
          </span>
        );
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < part.length) {
        newParts.push(part.slice(lastIdx));
      }
    }
    parts = newParts;
  }

  return <>{parts}</>;
};

export const CodeEditor = ({ openTabs, activeTab, onTabSelect, onTabClose, onContentChange }: CodeEditorProps) => {
  const activeFile = openTabs.find((t) => t.path === activeTab);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeTab && onContentChange) {
      onContentChange(activeTab, e.target.value);
    }
  }, [activeTab, onContentChange]);

  const updateCursor = useCallback((el: HTMLTextAreaElement) => {
    const pos = el.selectionStart;
    const text = el.value.substring(0, pos);
    const lines = text.split("\n");
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      if (onContentChange && activeTab) {
        onContentChange(activeTab, newValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
    }
  }, [activeTab, onContentChange]);

  if (!activeFile) {
    return (
      <div className="flex h-full flex-col bg-ide-panel">
        <div className="h-9 bg-ide-header border-b border-border" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">Nessun file aperto</p>
            <p className="text-sm">Seleziona un file dall'explorer per iniziare</p>
          </div>
        </div>
      </div>
    );
  }

  const lines = activeFile.content.split("\n");

  return (
    <div className="flex h-full flex-col bg-ide-panel">
      {/* Tabs */}
      <div className="flex h-9 bg-ide-header border-b border-border overflow-x-auto">
        {openTabs.map((tab) => (
          <div
            key={tab.path}
            className={`flex items-center gap-1.5 px-3 text-sm cursor-pointer border-r border-border shrink-0 transition-colors ${
              tab.path === activeTab
                ? "bg-ide-tab-active text-foreground border-t-2 border-t-primary"
                : "bg-ide-tab-inactive text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabSelect(tab.path)}
          >
            <span className="truncate max-w-32">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.path);
              }}
              className="ml-1 rounded p-0.5 hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Code content - overlay approach */}
      <div className="flex-1 overflow-hidden relative font-mono text-sm">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 w-12 bg-ide-panel overflow-hidden" ref={(el) => {
            if (el && textareaRef.current) {
              const ta = textareaRef.current;
              const sync = () => { el.scrollTop = ta.scrollTop; };
              ta.addEventListener("scroll", sync);
            }
          }}>
            <div className="pt-0">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`text-right pr-4 pl-2 text-xs leading-6 select-none ${
                    cursorLine === i + 1 ? "text-foreground" : "text-ide-line-number"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Syntax highlight layer */}
            <div
              ref={highlightRef}
              className="absolute inset-0 overflow-hidden pointer-events-none whitespace-pre text-ide-variable leading-6"
              aria-hidden="true"
            >
              {lines.map((line, i) => (
                <div key={i} className={`px-2 leading-6 ${cursorLine === i + 1 ? "bg-ide-line-highlight" : ""}`}>
                  {highlightLine(line || " ")}
                </div>
              ))}
            </div>

            {/* Textarea layer */}
            <textarea
              ref={textareaRef}
              value={activeFile.content}
              onChange={handleChange}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              onKeyUp={(e) => updateCursor(e.currentTarget)}
              onClick={(e) => updateCursor(e.currentTarget)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-foreground leading-6 px-2 outline-none font-mono text-sm selection:bg-primary/30 z-10"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex h-6 items-center justify-between border-t border-border bg-ide-header px-3 text-xs text-muted-foreground">
        <div className="flex gap-3">
          <span>{activeFile.language || "plaintext"}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex gap-3">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};

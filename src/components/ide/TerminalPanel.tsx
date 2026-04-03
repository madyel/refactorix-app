import { useState, useRef, useCallback, useEffect } from "react";
import { Terminal as TerminalIcon, X, Minus, Plus } from "lucide-react";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  text: string;
}

const WELCOME = "SmartCode Terminal v1.0.0 — Digita 'help' per i comandi disponibili.";

const FAKE_FS: Record<string, string[]> = {
  "~": ["src", "package.json", "tsconfig.json", "node_modules"],
  "~/src": ["components", "hooks", "App.tsx", "index.css"],
  "~/src/components": ["Button.tsx", "Card.tsx"],
  "~/src/hooks": ["useAuth.ts"],
};

export const TerminalPanel = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "system", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("~");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    addLines([{ type: "input", text: `${cwd} $ ${trimmed}` }]);

    const [command, ...args] = trimmed.split(/\s+/);

    switch (command) {
      case "help":
        addLines([
          { type: "output", text: "Comandi disponibili:" },
          { type: "output", text: "  help          Mostra questo messaggio" },
          { type: "output", text: "  clear         Pulisce il terminale" },
          { type: "output", text: "  echo <text>   Stampa il testo" },
          { type: "output", text: "  ls            Lista file nella directory" },
          { type: "output", text: "  cd <dir>      Cambia directory" },
          { type: "output", text: "  pwd           Directory corrente" },
          { type: "output", text: "  date          Data e ora corrente" },
          { type: "output", text: "  whoami        Utente corrente" },
          { type: "output", text: "  node -v       Versione Node.js" },
          { type: "output", text: "  npm run dev   Avvia dev server" },
        ]);
        break;
      case "clear":
        setLines([]);
        return;
      case "echo":
        addLines([{ type: "output", text: args.join(" ") }]);
        break;
      case "ls":
        const entries = FAKE_FS[cwd];
        if (entries) {
          addLines([{ type: "output", text: entries.join("  ") }]);
        } else {
          addLines([{ type: "output", text: "" }]);
        }
        break;
      case "cd":
        if (!args[0] || args[0] === "~") {
          setCwd("~");
        } else if (args[0] === "..") {
          const parts = cwd.split("/");
          setCwd(parts.length > 1 ? parts.slice(0, -1).join("/") : "~");
        } else {
          const newPath = cwd === "~" ? `~/${args[0]}` : `${cwd}/${args[0]}`;
          if (FAKE_FS[newPath]) {
            setCwd(newPath);
          } else {
            addLines([{ type: "error", text: `cd: no such directory: ${args[0]}` }]);
          }
        }
        break;
      case "pwd":
        addLines([{ type: "output", text: `/home/user/${cwd.replace("~", "")}` || "/home/user" }]);
        break;
      case "date":
        addLines([{ type: "output", text: new Date().toString() }]);
        break;
      case "whoami":
        addLines([{ type: "output", text: "developer" }]);
        break;
      case "node":
        if (args[0] === "-v") {
          addLines([{ type: "output", text: "v20.11.0" }]);
        } else {
          addLines([{ type: "error", text: `node: unknown flag: ${args[0] || ""}` }]);
        }
        break;
      case "npm":
        if (args[0] === "run" && args[1] === "dev") {
          addLines([
            { type: "output", text: "> my-project@1.0.0 dev" },
            { type: "output", text: "> vite" },
            { type: "system", text: "" },
            { type: "output", text: "  VITE v5.4.19  ready in 320 ms" },
            { type: "system", text: "" },
            { type: "output", text: "  ➜  Local:   http://localhost:5173/" },
            { type: "output", text: "  ➜  Network: http://192.168.1.42:5173/" },
          ]);
        } else if (args[0] === "install" || args[0] === "i") {
          addLines([
            { type: "output", text: "added 234 packages in 3.2s" },
          ]);
        } else {
          addLines([{ type: "error", text: `npm: unknown command '${args.join(" ")}'` }]);
        }
        break;
      case "git":
        if (args[0] === "status") {
          addLines([
            { type: "output", text: "On branch main" },
            { type: "output", text: "nothing to commit, working tree clean" },
          ]);
        } else {
          addLines([{ type: "output", text: `git ${args.join(" ")}: simulated` }]);
        }
        break;
      default:
        addLines([{ type: "error", text: `command not found: ${command}` }]);
    }
  }, [cwd, addLines]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      processCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    }
  }, [input, history, historyIdx, processCommand]);

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return "text-ide-function";
      case "error": return "text-destructive";
      case "system": return "text-primary";
      default: return "text-foreground";
    }
  };

  if (isMinimized) {
    return (
      <div className="flex h-8 items-center justify-between border-t border-border bg-ide-header px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Terminal</span>
        </div>
        <button onClick={() => setIsMinimized(false)} className="p-0.5 hover:bg-muted rounded transition-colors">
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t border-border bg-ide-panel" style={{ height: 200 }}>
      {/* Terminal header */}
      <div className="flex h-8 items-center justify-between bg-ide-header px-3 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-0.5 hover:bg-muted rounded transition-colors">
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => setLines([])} className="p-0.5 hover:bg-muted rounded transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-3 py-2 font-mono text-xs cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={`leading-5 whitespace-pre-wrap ${lineColor(line.type)}`}>
            {line.text || "\u00A0"}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center leading-5">
          <span className="text-ide-function shrink-0">{cwd} $&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground font-mono text-xs caret-primary"
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

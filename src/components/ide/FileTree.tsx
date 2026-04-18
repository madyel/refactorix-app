import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode, path: string) => void;
  selectedPath?: string;
}

const FileTreeItem = ({
  node,
  depth,
  path,
  onFileSelect,
  selectedPath,
}: {
  node: FileNode;
  depth: number;
  path: string;
  onFileSelect: (file: FileNode, path: string) => void;
  selectedPath?: string;
}) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const currentPath = `${path}/${node.name}`;
  const isSelected = selectedPath === currentPath;

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop();
    const colorMap: Record<string, string> = {
      ts: "text-ide-type",
      tsx: "text-ide-type",
      js: "text-ide-function",
      jsx: "text-ide-function",
      css: "text-ide-keyword",
      html: "text-ide-warning",
      json: "text-ide-string",
      md: "text-muted-foreground",
    };
    return colorMap[ext || ""] || "text-muted-foreground";
  };

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-1 px-2 py-1 text-sm hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-ide-function shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-ide-function shrink-0" />
          )}
          <span className="truncate text-sidebar-foreground">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                path={currentPath}
                onFileSelect={onFileSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node, currentPath)}
      className={`flex w-full items-center gap-1 px-2 py-1 text-sm transition-colors ${
        isSelected ? "bg-muted text-foreground" : "hover:bg-muted/50 text-sidebar-foreground"
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      <File className={`h-4 w-4 shrink-0 ${getFileIcon(node.name)}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

export const FileTree = ({ files, onFileSelect, selectedPath }: FileTreeProps) => {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-3 py-2 bg-ide-header border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {files.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">Nessun file disponibile. Verifica project path o permessi API.</div>
        ) : (
          files.map((node) => (
            <FileTreeItem
              key={node.name}
              node={node}
              depth={0}
              path=""
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>
    </div>
  );
};

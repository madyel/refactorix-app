import type { AIDevResponse } from "@/api";

export type CopilotMode = "analyze" | "dry_run" | "apply_patch" | "commit";
export type RunState = "queued" | "running" | "ok" | "failed";
export type SessionRole = "guest" | "operator" | "reviewer" | "admin";

export interface CopilotStructuredOutput {
  executiveSummary: string;
  bulletPoints: string[];
  risks: string[];
  nextSteps: string[];
  raw: AIDevResponse | Record<string, unknown>;
}

export interface CopilotRunSummary {
  runId: string;
  state: RunState;
  mode: CopilotMode;
  startedAt: string;
  endedAt?: string;
  error?: string;
}

export interface ParsedHunk {
  id: string;
  header: string;
  body: string;
  accepted: boolean;
}

export interface AuditEvent {
  action: string;
  actor: SessionRole;
  scope: string;
  result: "ok" | "failed";
  timestamp: string;
  details?: string;
}

export interface EndpointHealth {
  ollama: "online" | "offline" | "unknown";
  qdrant: "online" | "offline" | "unknown";
  temporal: "online" | "offline" | "unknown";
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendClient } from "@/api";
import { getConfiguredApiBaseUrl } from "@/config/runtime-config";

export interface BuilderSystemStatus {
  label: "Ollama" | "Qdrant" | "Temporal";
  value: "Online" | "Offline";
  detail: string;
  tone: "emerald" | "rose";
}

interface BuilderRuntimeState {
  stackOptions: string[];
  templateOptions: string[];
  modelOptions: string[];
  providerInfo: string;
  capabilityInfo: string;
  systemStatus: BuilderSystemStatus[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const looksLikeHtml = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
};

const compact = (value: string, max = 100) => (value.length > max ? `${value.slice(0, max - 3)}...` : value);

export const humanizeServiceDetail = (payload: unknown): string => {
  if (looksLikeHtml(payload)) {
    return `Endpoint ha risposto HTML invece di JSON (probabile API Base URL errata: ${getConfiguredApiBaseUrl()}).`;
  }

  if (typeof payload === "string") {
    return compact(payload.replace(/\s+/g, " "));
  }

  if (isRecord(payload)) {
    const message = payload.message ?? payload.detail ?? payload.error ?? payload.status;
    if (typeof message === "string") return compact(message);
    return compact(JSON.stringify(payload));
  }

  return "n/a";
};

const collectStringArrays = (value: unknown, targetKeys: string[]): string[] => {
  const output = new Set<string>();

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === "string") {
          output.add(item);
        } else {
          walk(item);
        }
      }
      return;
    }

    if (!isRecord(node)) return;

    for (const [key, entry] of Object.entries(node)) {
      if (targetKeys.includes(key) && Array.isArray(entry)) {
        entry.forEach((item) => {
          if (typeof item === "string") output.add(item);
        });
      }
      walk(entry);
    }
  };

  walk(value);
  return [...output];
};

const collectModelOptions = (value: unknown): string[] => {
  const options = new Set<string>();

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === "string") {
          options.add(item);
        } else if (isRecord(item)) {
          const candidate = item.name ?? item.model ?? item.id;
          if (typeof candidate === "string") options.add(candidate);
          walk(item);
        }
      }
      return;
    }

    if (!isRecord(node)) return;

    const candidate = node.model ?? node.selected_model ?? node.current_model;
    if (typeof candidate === "string") options.add(candidate);

    Object.entries(node).forEach(([key, entry]) => {
      if (["models", "available_models", "local_models"].includes(key)) {
        walk(entry);
      }
    });
  };

  walk(value);
  return [...options];
};

const isOnlinePayload = (payload: unknown): boolean => {
  if (looksLikeHtml(payload)) return false;
  if (!isRecord(payload)) return false;

  return (
    payload.ok === true ||
    payload.status === "ok" ||
    payload.status === "online" ||
    payload.healthy === true
  );
};

const statusFromResult = (
  label: BuilderSystemStatus["label"],
  result: PromiseSettledResult<unknown>,
): BuilderSystemStatus => {
  if (result.status === "rejected") {
    const reason = result.reason instanceof Error ? result.reason.message : "request failed";
    return {
      label,
      value: "Offline",
      detail: `Request fallita: ${compact(reason)}`,
      tone: "rose",
    };
  }

  const payload = result.value;
  const online = isOnlinePayload(payload);

  return {
    label,
    value: online ? "Online" : "Offline",
    detail: humanizeServiceDetail(payload),
    tone: online ? "emerald" : "rose",
  };
};

const initialState: BuilderRuntimeState = {
  stackOptions: [],
  templateOptions: [],
  modelOptions: [],
  providerInfo: "Provider info non disponibile",
  capabilityInfo: "Nessuna capability caricata",
  systemStatus: [
    { label: "Ollama", value: "Offline", detail: "in attesa di refresh", tone: "rose" },
    { label: "Qdrant", value: "Offline", detail: "in attesa di refresh", tone: "rose" },
    { label: "Temporal", value: "Offline", detail: "in attesa di refresh", tone: "rose" },
  ],
};

export const useBuilderRuntime = () => {
  const [state, setState] = useState<BuilderRuntimeState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [ollama, qdrant, temporal, actions, workflow] = await Promise.allSettled([
      backendClient.call("ollama_status_v1_system_ollama_status_get"),
      backendClient.call("qdrant_status_v1_system_qdrant_status_get"),
      backendClient.call("temporal_status_v1_system_temporal_status_get"),
      backendClient.call("ide_actions_v1_ide_actions_get"),
      backendClient.call("workflow_golden_path_v1_system_workflow_golden_path_get"),
    ]);

    const modelOptions = ollama.status === "fulfilled" ? collectModelOptions(ollama.value) : [];

    const stackOptions = [
      ...(actions.status === "fulfilled" ? collectStringArrays(actions.value, ["stacks", "stack", "languages"]) : []),
      ...(workflow.status === "fulfilled" ? collectStringArrays(workflow.value, ["stacks", "stack", "languages"]) : []),
    ];

    const templateOptions = [
      ...(actions.status === "fulfilled" ? collectStringArrays(actions.value, ["templates", "template", "blueprints", "starters"]) : []),
      ...(workflow.status === "fulfilled" ? collectStringArrays(workflow.value, ["templates", "template", "blueprints", "starters"]) : []),
    ];

    const uniqueStack = [...new Set(stackOptions)];
    const uniqueTemplate = [...new Set(templateOptions)];

    const systemStatus = [
      statusFromResult("Ollama", ollama),
      statusFromResult("Qdrant", qdrant),
      statusFromResult("Temporal", temporal),
    ];

    setState({
      stackOptions: uniqueStack,
      templateOptions: uniqueTemplate,
      modelOptions,
      providerInfo:
        ollama.status === "fulfilled"
          ? humanizeServiceDetail(ollama.value)
          : "Provider unavailable",
      capabilityInfo:
        actions.status === "fulfilled"
          ? (() => {
              const payload = actions.value as Record<string, unknown>;
              const actionsList = payload.actions;
              return `${Array.isArray(actionsList) ? actionsList.length : 0} capabilities da /v1/ide/actions`;
            })()
          : "Capabilities unavailable",
      systemStatus,
    });

    if (systemStatus.every((item) => item.value === "Offline")) {
      setError(
        "Tutti i servizi risultano offline o non raggiungibili. Verifica API Base URL in /settings e che punti al backend Copilot (non al frontend).",
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyModel = useCallback(
    async (model: string) => {
      if (!model) return;
      try {
        setError(null);
        await backendClient.call("ollama_select_model_v1_system_ollama_select_model_post", {
          body: { model },
        });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Errore cambio modello";
        setError(`Cambio modello fallito: ${message}`);
      }
    },
    [refresh],
  );

  return useMemo(
    () => ({
      ...state,
      isLoading,
      error,
      refresh,
      applyModel,
    }),
    [state, isLoading, error, refresh, applyModel],
  );
};

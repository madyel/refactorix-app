import { useCallback, useEffect, useMemo, useState } from "react";
import { backendClient } from "@/api";
import { getConfiguredApiBaseUrl } from "@/config/runtime-config";
import { invokeCatalogEndpoint } from "@/features/copilot/catalog-client";

export interface BuilderSystemStatus {
  label: "Ollama" | "Qdrant" | "Temporal";
  value: "Online" | "Offline";
  detail: string;
  tone: "emerald" | "rose";
}

interface BuilderRuntimeState {
  stackOptions: string[];
  templateOptions: string[];
  templatesByStack: Record<string, string[]>;
  allowedCombinations: Array<{ stack: string; template: string }>;
  legacyAliases: Record<string, string>;
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
    const message = payload.message ?? payload.detail ?? payload.error;
    if (typeof message === "string") return compact(message);

    const connected = payload.connected;
    const state = payload.state;
    const selectedModel = payload.selected_model ?? payload.model;
    const endpoint = payload.base_url ?? payload.qdrant_url ?? payload.backend ?? payload.endpoint;

    const parts: string[] = [];
    if (typeof connected === "boolean") {
      parts.push(connected ? "Connesso" : "Disconnesso");
    }
    if (typeof state === "string") {
      parts.push(`state=${state}`);
    }
    if (typeof selectedModel === "string") {
      parts.push(`model=${selectedModel}`);
    }
    if (typeof endpoint === "string") {
      parts.push(`endpoint=${endpoint}`);
    }

    if (parts.length > 0) {
      return compact(parts.join(" · "));
    }

    if (typeof payload.status === "string") {
      return compact(`status=${payload.status}`);
    }

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

export const parseProjectsTemplatesResponse = (payload: unknown) => {
  const fallback = {
    stacks: [] as string[],
    templatesByStack: {} as Record<string, string[]>,
    legacyAliases: {} as Record<string, string>,
    allowedCombinations: [] as Array<{ stack: string; template: string }>,
  };

  if (!isRecord(payload)) return fallback;

  const stacks = Array.isArray(payload.stacks)
    ? payload.stacks.filter((item): item is string => typeof item === "string")
    : [];

  const templatesByStack = isRecord(payload.templates_by_stack)
    ? Object.fromEntries(
        Object.entries(payload.templates_by_stack).map(([stack, templates]) => [
          stack,
          Array.isArray(templates)
            ? templates.filter((item): item is string => typeof item === "string")
            : [],
        ]),
      )
    : {};

  const legacyAliases = isRecord(payload.legacy_aliases)
    ? Object.fromEntries(
        Object.entries(payload.legacy_aliases)
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => [key, value as string]),
      )
    : {};

  const allowedCombinations = Array.isArray(payload.allowed_combinations)
    ? payload.allowed_combinations.flatMap((entry) => {
        if (!isRecord(entry)) return [];
        const stack = entry.stack;
        const template = entry.template;
        if (typeof stack === "string" && typeof template === "string") {
          return [{ stack, template }];
        }
        return [];
      })
    : [];

  return {
    stacks,
    templatesByStack,
    legacyAliases,
    allowedCombinations,
  };
};

const isOnlinePayload = (payload: unknown): boolean => {
  if (looksLikeHtml(payload)) return false;
  if (!isRecord(payload)) return false;

  return (
    payload.ok === true ||
    payload.status === "ok" ||
    payload.status === "online" ||
    payload.healthy === true ||
    payload.connected === true ||
    payload.state === "healthy"
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
  templatesByStack: {},
  allowedCombinations: [],
  legacyAliases: {},
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

    const [ollama, qdrant, temporal, actions, workflow, projectTemplates] = await Promise.allSettled([
      backendClient.call("ollama_status_v1_system_ollama_status_get"),
      backendClient.call("qdrant_status_v1_system_qdrant_status_get"),
      backendClient.call("temporal_status_v1_system_temporal_status_get"),
      backendClient.call("ide_actions_v1_ide_actions_get"),
      backendClient.call("workflow_golden_path_v1_system_workflow_golden_path_get"),
      invokeCatalogEndpoint({ method: "GET", path: "/v1/projects/templates" }),
    ]);

    const parsedTemplates =
      projectTemplates.status === "fulfilled"
        ? parseProjectsTemplatesResponse(projectTemplates.value)
        : parseProjectsTemplatesResponse(undefined);

    const modelOptions = ollama.status === "fulfilled" ? collectModelOptions(ollama.value) : [];

    const inferredStackOptions = [
      ...(actions.status === "fulfilled" ? collectStringArrays(actions.value, ["stacks", "stack", "languages"]) : []),
      ...(workflow.status === "fulfilled" ? collectStringArrays(workflow.value, ["stacks", "stack", "languages"]) : []),
    ];

    const inferredTemplateOptions = [
      ...(actions.status === "fulfilled" ? collectStringArrays(actions.value, ["templates", "template", "blueprints", "starters"]) : []),
      ...(workflow.status === "fulfilled" ? collectStringArrays(workflow.value, ["templates", "template", "blueprints", "starters"]) : []),
    ];

    const stackOptions =
      parsedTemplates.stacks.length > 0
        ? parsedTemplates.stacks
        : [...new Set(inferredStackOptions)];

    const templatesFromMap = Object.values(parsedTemplates.templatesByStack).flat();

    const templateOptions =
      templatesFromMap.length > 0
        ? [...new Set(templatesFromMap)]
        : [...new Set(inferredTemplateOptions)];

    const systemStatus = [
      statusFromResult("Ollama", ollama),
      statusFromResult("Qdrant", qdrant),
      statusFromResult("Temporal", temporal),
    ];

    setState({
      stackOptions,
      templateOptions,
      templatesByStack: parsedTemplates.templatesByStack,
      allowedCombinations: parsedTemplates.allowedCombinations,
      legacyAliases: parsedTemplates.legacyAliases,
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

  const getTemplateOptionsForStack = useCallback(
    (stack: string) => {
      if (!stack) return state.templateOptions;

      const byStack = state.templatesByStack[stack] ?? [];
      if (byStack.length > 0) {
        return byStack;
      }

      const allowed = state.allowedCombinations
        .filter((item) => item.stack === stack)
        .map((item) => item.template);

      return allowed.length > 0 ? [...new Set(allowed)] : state.templateOptions;
    },
    [state.templateOptions, state.templatesByStack, state.allowedCombinations],
  );

  return useMemo(
    () => ({
      ...state,
      isLoading,
      error,
      refresh,
      applyModel,
      getTemplateOptionsForStack,
    }),
    [state, isLoading, error, refresh, applyModel, getTemplateOptionsForStack],
  );
};

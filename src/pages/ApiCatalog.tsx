import { useMemo, useState } from "react";
import { apiOperations } from "@/api/generated/operations";
import { invokeCatalogEndpoint, recommendedEndpoints, type CatalogHttpMethod } from "@/features/copilot/catalog-client";
import { getConfiguredApiBaseUrl } from "@/config/runtime-config";

interface EndpointOption {
  method: CatalogHttpMethod;
  path: string;
  source: "existing" | "recommended";
}

const ApiCatalog = () => {
  const options = useMemo<EndpointOption[]>(() => {
    const existing = Object.values(apiOperations)
      .map((op) => ({ method: op.method as CatalogHttpMethod, path: op.path, source: "existing" as const }))
      .filter((op) => op.path.startsWith("/v1/"));

    const recommended = recommendedEndpoints.map((op) => ({ ...op, source: "recommended" as const }));
    return [...existing, ...recommended];
  }, []);

  const [method, setMethod] = useState<CatalogHttpMethod>("GET");
  const [path, setPath] = useState("/v1/ai-dev");
  const [query, setQuery] = useState("{}");
  const [pathParams, setPathParams] = useState("{}");
  const [body, setBody] = useState("{}");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const configuredBaseUrl = getConfiguredApiBaseUrl();

  const callEndpoint = async () => {
    setError("");
    setResult("Loading...");
    try {
      const response = await invokeCatalogEndpoint({
        method,
        path,
        query: JSON.parse(query),
        pathParams: JSON.parse(pathParams),
        body: method === "GET" ? undefined : JSON.parse(body),
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const remediation = message.includes("NetworkError") || message.includes("Failed to fetch")
        ? `Network error. Verifica Settings > Copilot (Base URL/token/api-key). Base URL attuale: ${configuredBaseUrl || "(vuota)"}`
        : message;
      setError(remediation);
      setResult("");
    }
  };

  return (
    <main className="min-h-screen bg-[#1b1b1b] p-6 text-slate-100">
      <section className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-black/20 p-6">
        <h1 className="text-2xl font-semibold">Copilot REST API Catalog</h1>
        <p className="mt-2 text-sm text-slate-300">Invoca endpoint existing/recommended direttamente dallo Smart IDE.</p>
        <p className="mt-1 text-xs text-slate-400">Base URL attuale: {configuredBaseUrl || "(vuota)"}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <select value={`${method} ${path}`} onChange={(e) => {
            const [nextMethod, ...pathParts] = e.target.value.split(" ");
            setMethod(nextMethod as CatalogHttpMethod);
            setPath(pathParts.join(" "));
          }} className="rounded border border-white/15 bg-[#111] px-3 py-2 text-sm md:col-span-2">
            {options.map((option) => (
              <option key={`${option.source}-${option.method}-${option.path}`} value={`${option.method} ${option.path}`}>
                [{option.source}] {option.method} {option.path}
              </option>
            ))}
          </select>

          <textarea value={pathParams} onChange={(e) => setPathParams(e.target.value)} className="h-24 rounded border border-white/15 bg-[#111] p-2 text-xs" placeholder='{"run_id":"abc"}' />
          <textarea value={query} onChange={(e) => setQuery(e.target.value)} className="h-24 rounded border border-white/15 bg-[#111] p-2 text-xs" placeholder='{"limit":10}' />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="h-32 rounded border border-white/15 bg-[#111] p-2 text-xs md:col-span-2" placeholder='{"task":"..."}' />
        </div>

        <div className="mt-4">
          <button onClick={callEndpoint} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Invoca endpoint</button>
        </div>

        {error && <div className="mt-4 rounded border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
        {result && <pre className="mt-4 overflow-auto rounded border border-white/10 bg-[#090909] p-3 text-xs">{result}</pre>}
      </section>
    </main>
  );
};

export default ApiCatalog;

# Copilot Integration Guide

## Environment variables

- `VITE_API_BASE_URL`: base URL backend API (fallback default).
- Se l'app gira in `file://` (Electron) e non configuri URL, fallback automatico a `http://localhost:8000`.
- Runtime override da UI in pagina `/settings` (base URL + API token) salvato in `localStorage` con precedenza su env.
- `VITE_COPILOT_ENABLED`: enables Copilot panel globally.
- `VITE_COPILOT_APPLY_PATCH_ENABLED`: enables `apply_patch` mode in UI.
- `VITE_COPILOT_COMMIT_ENABLED`: enables `commit` mode in UI.

- Copilot API Token: configurabile da `/settings`, inviato come header `Authorization: Bearer <token>`.

## Settings UX

- Pagina `/settings` include pulsante **Test connessione Copilot**.
- Effettua probe su `/health` e `/v1/system/ollama/status` con gli header configurati (`Authorization`, `x-api-key`).

## Token lifecycle automatico

- `apiKey` usata solo per bootstrap iniziale sessione (`/v1/auth/session/token`).
- Bootstrap usa `POST /v1/auth/session/token?role=...&subject=...` con header `x-api-key`.
- In web UI è supportato fallback su `POST /v1/auth/session/login?...` con `credentials: include` (cookie-based session).
- `access token` usato per chiamate API.
- Refresh automatico proattivo vicino alla scadenza e retry al primo `401`.
- `refresh token` tentato su `POST /v1/auth/session/refresh` via header `Authorization: Bearer <refreshToken>` con rotation.
- Fallback refresh cookie-based su stesso endpoint con `credentials: include` (+ `x-csrf-token` se disponibile).


## Professional hardening (client)

- `backend-client` ora espone errori tipizzati (`ApiHttpError`) con `status`, `correlationId`, `details` e `remediation` per migliorare troubleshooting UX.
- Ogni request include `x-correlation-id` client-side e timeout controllato (default 15s).
- Retry su `401` mantiene refresh sessione automatico, poi ripete una sola volta la request originale.
- In `/settings` è disponibile un riepilogo di telemetria client-side (latenza media, error-rate, funnel analyze→patch→commit) utile per quality monitoring.



## Home Builder runtime (API reali)

- `System status` in home page ora usa endpoint reali:
  - `GET /v1/system/ollama/status`
  - `GET /v1/system/qdrant/status`
  - `GET /v1/system/temporal/status`
- `Combo Stack` e `Combo Template` ora usano prima `GET /v1/projects/templates` (`stacks`, `templates_by_stack`, `legacy_aliases`, `allowed_combinations`), con fallback su capability/workflow (`GET /v1/ide/actions` + `GET /v1/system/workflow/golden-path`).
- `Cambio modello` invoca `POST /v1/system/ollama/select-model` e ricarica lo stato provider.
- Workspace custom: da Home Builder puoi usare `Scegli cartella`; in Electron apre il picker nativo, in web fallback su inserimento path manuale.


## Project provisioning flow (API ufficiali)

- `Crea solo progetto` usa `POST /v1/projects/create` (stack/template/path/init_git/install_deps).
- `Crea framework software` esegue:
  1. `POST /v1/projects/create`
  2. `POST /v1/projects/generate` con `repo_path` + `request`
- La UI mostra output professionale (`summary`, `repoPath`, `nextSteps`) invece di payload grezzi.

## IDE Explorer now API-driven

- `ProjectViewer` non usa più dataset cablati (`sampleFiles`).
- I percorsi progetto vengono letti da `GET /v1/projects/discovery`.
- L'albero file viene caricato da `GET /v1/projects/tree?project_path=...&depth=...` e normalizzato lato client per supportare shape response diverse del backend.

## API Catalog UI

- Pagina `/api-catalog`: invoca endpoint Existing/Recommended (metodo/path/query/pathParams/body).
- Usa `src/features/copilot/catalog-client.ts` per routing dinamico su endpoint OpenAPI esistenti e fallback raw fetch per endpoint recommended/mancanti.

## Endpoint matrix

### Core run flow
- `POST /v1/ai-dev` (sync analyze execution)
- `POST /v1/ai-dev/async` (async execution)
- `GET /v1/runs?limit=...` (timeline)
- `GET /v1/runs/{run_id}` (status updates)
- `GET /v1/runs/{run_id}/result` (final structured payload)
- `GET /v1/runs/{run_id}/events` (SSE/event stream, optional)

### Feedback & KPI
- `POST /v1/ide/feedback` (entrypoint feedback)
- `GET /v1/ide/analytics` (aggregate KPI)

### Dependencies status / graceful degradation
- `GET /v1/system/ollama/status`
- `GET /v1/system/qdrant/status`
- `GET /v1/system/temporal/status`

## Troubleshooting runbook

1. **Run stuck in queued/running**
   - Verify Temporal status endpoint and worker queue health.
   - Use run polling (`GET /v1/runs/{run_id}`) until terminal state.
2. **403/CSRF mismatch**
   - Client retries once by refreshing session (`GET /v1/auth/session/me`).
   - If still failing, require relogin.
3. **External services offline**
   - Panel remains usable and marks dependencies as `offline`.
   - Continue with analyze mode and degraded retrieval/context quality.
4. **Apply/commit blocked**
   - Check feature flags and user role (`guest/operator/reviewer/admin`).
   - High-risk actions require explicit user confirmation.
5. **No KPI updates**
   - Ensure `POST /v1/ide/feedback` succeeds.
   - Refresh via `GET /v1/ide/analytics`.


## Troubleshooting rapido connessione

- Se `System status` mostra output tipo `<!doctype html>...` significa che le chiamate stanno colpendo il frontend e non il backend API: correggi `Copilot API Base URL` in `/settings` (es. `http://<host>:8000`).
- Se vedi `NetworkError when attempting to fetch resource` nel test connessione:
  - su pagina HTTPS con API HTTP: probable mixed-content block.
  - endpoint raggiungibile in `no-cors` ma fallisce in fetch normale: probabile CORS backend.
  - altrimenti: verifica rete/VPN/firewall e bind host/porta API.

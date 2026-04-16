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

- Se vedi `NetworkError when attempting to fetch resource` nel test connessione:
  - su pagina HTTPS con API HTTP: probable mixed-content block.
  - endpoint raggiungibile in `no-cors` ma fallisce in fetch normale: probabile CORS backend.
  - altrimenti: verifica rete/VPN/firewall e bind host/porta API.


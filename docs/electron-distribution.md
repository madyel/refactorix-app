# Smart IDE Desktop (Electron)

Questa integrazione consente di distribuire Smart IDE come applicazione desktop standalone.
L'utente finale installa direttamente il pacchetto (`.dmg`, `.exe`, `.AppImage`) senza installare Node.js o dipendenze npm.

## Comandi

- `npm run electron:dev`: avvia Vite + Electron in sviluppo locale.
- `npm run electron:pack`: genera output non installabile (cartella `release/`).
- `npm run electron:build`: build completa + installer per OS corrente.

## Architettura

- Main process: `electron/main.cjs`
- Preload script: `electron/preload.cjs`
- Renderer: build Vite (`dist/index.html`)

## Sicurezza

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Apertura link esterni tramite `shell.openExternal` con `setWindowOpenHandler` (popup bloccati nell'app).

## Packaging

Configurazione `electron-builder` in `package.json`:

- `appId`: `com.smartide.desktop`
- output: `release/`
- target:
  - macOS: `dmg`
  - Windows: `nsis`
  - Linux: `AppImage`

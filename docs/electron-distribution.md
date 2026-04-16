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
- Updater module: `electron/updater.cjs`
- Renderer: build Vite (`dist/index.html`)

## Branding (icone + publisher)

- In repository è versionato `assets/icons/icon-template.svg` (text-only).
- Le icone binarie (`.png/.ico/.icns`) vanno generate in CI/CD prima della fase di packaging.
- Publisher Windows (`publisherName`): `Smart IDE S.r.l.`
- Author npm package: `Smart IDE Team <devops@smartide.local>`

## Code signing

### Windows (Authenticode)

Configurare variabili ambiente in CI:

- `CSC_LINK` (certificato `.pfx` in path o base64 URI)
- `CSC_KEY_PASSWORD`

`electron-builder` userà il certificato per firmare l'installer NSIS.

### macOS (Developer ID + notarization)

Configurare in CI:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`
- `CSC_LINK`
- `CSC_KEY_PASSWORD`

Il progetto include `hardenedRuntime` ed entitlements (`electron/entitlements.mac.plist`).

## Auto-update

- Integrato con `electron-updater`.
- Provider configurato: `generic` URL `https://updates.smartide.local/downloads`.
- Eventi update esposti al renderer via `window.desktop.updater` (`check`, `download`, `quitAndInstall`, `onEvent`).

## Sicurezza

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Apertura link esterni tramite `shell.openExternal` con `setWindowOpenHandler` (popup bloccati nell'app).

## Packaging

Configurazione `electron-builder` in `package.json`:

- `appId`: `com.smartide.desktop`
- output: `release/`
- Nota: i file icona binari non sono versionati nel repository (vincolo patch stream).
- target:
  - macOS: `dmg`
  - Windows: `nsis`
  - Linux: `AppImage`

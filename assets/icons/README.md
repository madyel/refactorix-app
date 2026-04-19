# Icon assets (text-only repo-safe)

Questa repository non accetta file binari nel patch stream.
Per questo motivo sono versionati solo asset testuali.

## Cosa trovi qui

- `icon-template.svg`: template sorgente (modificabile) da cui generare le icone finali.

## Cosa fare in release CI/CD

Genera e pubblica questi file binari durante la pipeline (non nel commit):

- `icon.png` (>= 512x512)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

Poi passa i path a `electron-builder` tramite configurazione CI o file di build esterno.

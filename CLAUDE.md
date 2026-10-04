# Hanaki Barcelona — portfolio

## Pruebas en navegador (Playwright CLI)

- Usa `playwright-cli` siempre con `--browser chrome` (p. ej. `playwright-cli open <url> --browser chrome`). En este Mac (macOS 13) Playwright no puede instalar su propio Chromium, así que se usa el Google Chrome del sistema.
- Las capturas y snapshots se guardan en `.playwright-cli/`, que está en `.gitignore`.

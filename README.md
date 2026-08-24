# Glypt

**Every asset your team ships.** Icons, brand kits, mockups and generated marketing assets — one API, one CLI, one MCP server, everywhere your work happens.

- **200k+ icons** via Iconify-backed search with framework-ready snippets
- **Brand kits in seconds** — palette + logo extraction from any public domain
- **Visual selection grids (Atlas)** so humans AND agents can pick icons
- **Generated assets** — social cards, deck covers, device mockups
- **Own your auth** — email/password with bcrypt + hashed session cookies

## Architecture

```
glypt/
├─ apps/
│  ├─ web/        React 19 + Vite SPA (marketing + product UI)
│  └─ api/        Express 5 REST API (auth, quota, Postgres)
├─ packages/
│  └─ core/       Shared logic: search, snippets, zip, brand, generators
├─ services/
│  ├─ cli/        @glypt/cli — search/atlas/export from the terminal
│  └─ mcp/        @glypt/mcp — MCP server for AI agents
├─ sdks/
│  └─ python/     glypt pip package (sync client)
├─ integrations/
│  ├─ browser-extension/   Chrome MV3 popup + context menus
│  ├─ figma-plugin/        Search & insert vectors in Figma
│  └─ vscode-extension/    Alt+Shift+I icon picker for any file
└─ scripts/       dev.ps1 / dev.sh / smoke tests
```

## Quickstart

```bash
pnpm install

# 1. database (any postgres; or run one locally)
export DATABASE_URL="postgres://localhost:5432/glypt"

# 2. boot both processes
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:5173  (proxies /api -> :4000)
```

Or use the bootstrap script:

```powershell
pwsh scripts/dev.ps1      # windows
bash scripts/dev.sh       # mac/linux
```

## Environment

| Variable      | Used by | Default                  | Purpose                          |
| ------------- | ------- | ------------------------ | -------------------------------- |
| `DATABASE_URL`| api     | —                        | Postgres connection string       |
| `API_PORT`    | api/web | `4000`                   | API listen port (web proxies it) |
| `WEB_ORIGIN`  | api     | —                        | Comma-separated CORS allowlist   |
| `ADMIN_TOKEN` | api     | —                        | Enables `/api/v1` key auth       |
| `NODE_ENV`    | api     | `development`            | `production` → secure cookies    |

## Testing

```bash
pnpm test          # unit + integration (integration auto-skips without DATABASE_URL)
node tests/e2e/e2e.mjs   # boots api+preview, checks pages, endpoints, export flow
pwsh scripts/smoke.ps1   # quick endpoint sanity against a running api
cd sdks/python && pytest -q
```

## Packages

| Package | Command |
| --- | --- |
| Web app | `pnpm dev:web` |
| REST API | `pnpm dev:api` |
| CLI | `pnpm glypt -- search rocket` |
| MCP server | `pnpm mcp` |
| Python SDK | `pip install ./sdks/python` |

## Integrations

Each folder under `integrations/` is self-contained:

- **figma-plugin** — Figma desktop → Plugins → Development → Import from manifest
- **vscode-extension** — open folder in VS Code, F5 to launch Extension Dev Host
- **browser-extension** — chrome://extensions → Developer mode → Load unpacked

They talk to the local API by default (`http://localhost:4000`) and fall back to the Iconify CDN when offline.

## Security notes

- Passwords: bcrypt (cost 12); login always runs a hash comparison to equalize timing
- Sessions: opaque 32-byte tokens, stored **hashed** (SHA-256), httpOnly cookies, 30-day expiry
- Anonymous visitors get a signed-format device id cookie for favorites/quota — no PII required
- Cross-origin state-changing requests rejected unless origin is allowlisted
- Free tier: 100 searches/day/device; `/api/v1` metered per API key at 5,000/day

© Glypt Inc.

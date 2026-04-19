# Lazy Context Filtering MCP

Hybrid TypeScript + Python MCP server scaffold.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `sse` |
| `PORT` | `3000` | HTTP port (SSE mode only) |
| `PYTHON_ENGINE_URL` | `http://127.0.0.1:8100` | Python scoring engine base URL |
| `DATABASE_URL` | _(none)_ | PostgreSQL connection string (production) |
| `SUPABASE_URL` | _(none)_ | Supabase project URL |
| `SUPABASE_ANON_KEY` | _(none)_ | Supabase anonymous key |
| `API_KEY` | _(none)_ | API key for SSE route auth — omit to disable auth (dev only) |
| `LOG_LEVEL` | `info` | Pino log level: `silent`, `error`, `warn`, `info`, `debug`, `trace` |

## Authentication

Set `API_KEY` in your `.env` file or shell environment to protect SSE endpoints.

All requests to `/mcp`, `/messages`, and `/api/*` must include:
```
X-API-Key: <your-api-key>
```

The `/health` endpoint is always public.

When `API_KEY` is not set, auth is disabled (local dev mode).

## Logging

The server uses [Pino](https://getpino.io/) for structured JSON logging.

- **SSE mode:** Logs emit to stdout as JSON. Set `LOG_LEVEL=debug` for verbose output.
- **stdio mode:** Logging is silenced (`silent`) to prevent log lines corrupting the MCP wire protocol.

## Docker

```bash
# Build and run both services
cp .env.example .env  # Fill in values
docker compose up --build

# Run with API key auth
API_KEY=your-secret-key docker compose up --build

# View logs
docker compose logs -f server
docker compose logs -f engine
```

## MCP Capabilities

This server exposes:

### Tools (6)
- `register_context` — Register a context item
- `list_context` — List context items with pagination
- `get_context` — Fetch specific items by ID
- `filter_context` — Filter by relevance within a token budget
- `create_session` — Create a filtering session
- `end_session` — End a session and invalidate its cache

### Resources (2)
- `context://items` — All registered context items (JSON)
- `context://sessions` — Active sessions (JSON)

### Prompts (2)
- `filter_context_prompt` — Pre-filled filter_context invocation
- `summarize_and_filter_prompt` — Two-step summarize-then-filter workflow

# The Company - Backend API

This is the Python backend project for the AI multi-agent system "The Company".

## Tech Stack
- **FastAPI**: Modern, fast web framework for building APIs with Python.
- **Python 3.11+**
- **Poetry**: Dependency Management.
- **PostgreSQL**: Relational database (asyncpg + SQLAlchemy).
- **Redis**: In-memory data structure store.
- **Docker & Docker Compose**: Containerization and local orchestration.

## Getting Started

### Local Development (Without Docker)

1. **Install Poetry**:
   ```bash
   pip install poetry
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Environment Setup**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` as needed.*

4. **Run the API**:
   ```bash
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The API will be available at `http://localhost:8000`. You can access the automatic documentation at `http://localhost:8000/docs`.

### Local Development (With Docker)

To run the entire stack (API, Postgres, Redis) using Docker Compose:

1. **Start the services**:
   ```bash
   docker-compose up -d --build
   ```

2. **Stop the services**:
   ```bash
   docker-compose down
   ```

## MCP (Model Context Protocol) Integrations

The backend tools can connect to real external MCP servers instead of returning mock data.

### Configuration

All MCP integrations are disabled by default (`MCP_FALLBACK_MODE=true`).  Set the environment variables for the services you want to use, then set `MCP_FALLBACK_MODE=false` to enable real calls.

| Service | Environment Variable | Credential |
|---------|---------------------|------------|
| Supabase Ledger | `SUPABASE_MCP_URL` | `SUPABASE_MCP_KEY` |
| Stripe | `STRIPE_API_KEY` | Official Stripe SDK (`STRIPE_MCP_URL` still works as fallback) |
| Google Workspace | `GOOGLE_MCP_URL` | `GOOGLE_MCP_CREDENTIALS` |
| Notion | `NOTION_MCP_URL` | `NOTION_MCP_TOKEN` |
| Brave Search | `BRAVE_MCP_URL` | `BRAVE_MCP_API_KEY` |
| Slack/WhatsApp | `SLACK_MCP_URL` | `SLACK_MCP_BOT_TOKEN` |
| Browser (Playwright) | `BROWSER_MCP_URL` | `BROWSER_MCP_API_KEY` |
| Email | `EMAIL_MCP_URL` | `EMAIL_MCP_API_KEY` |
| Calendar | `CALENDAR_MCP_URL` | `CALENDAR_MCP_API_KEY` |
| Context7 | `CONTEXT7_MCP_URL` | `CONTEXT7_MCP_API_KEY` |
| Collaboration | `COLLABORATION_MCP_URL` | `COLLABORATION_MCP_API_KEY` |

### Direct API Integrations

Some tools call the official provider SDK directly instead of going through an MCP bridge:

- **Stripe**: Set `STRIPE_API_KEY` to use the official `stripe` Python SDK.  Read-only actions (`read_charges`, `read_invoices`) call Stripe directly.  Write actions (`issue_refund`, `transfer_funds`) are staged for founder approval by default.  If `STRIPE_API_KEY` is not set, the tool falls back to the MCP/mock path.

### Health Check

Check the configured MCP servers:

```bash
curl http://localhost:8000/api/v1/health/mcp
```

### Fallback Mode

When `MCP_FALLBACK_MODE=true` (default), every tool returns the original mock response so the app works without any external credentials.

### Inter-Agent Collaboration

Workers can request help from another department using the `request_department_collaboration` tool.  When no collaboration MCP server is configured, the request is written to shared memory with a `pending_delegation` tag so the coordinator can dispatch it to the right specialist.

## Project Structure

- `app/main.py`: Application entry point and router definitions.
- `app/api/`: API routes and dependencies.
- `app/core/`: Configuration, logging, and security.
- `app/models/`: Database models (SQLAlchemy).
- `app/services/`: Business logic and MCP client.
- `app/agents/`: AI multi-agent logic.
- `tests/`: Test suite.

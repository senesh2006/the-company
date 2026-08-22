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

## MCP (Model Context Protocol) & App Integrations

The system supports two complementary integration models:
1. **Per-User Composio Connectors (Multi-Tenant, User-Scoped)**: Each authenticated user connects their own workspace accounts (Gmail, Slack, Notion, GitHub, Google Calendar, Google Sheets) via OAuth. Agents automatically execute MCP tool calls scoped to the active user's credentials.
2. **Static Shared MCP Servers (Single-Tenant, Founder-Level)**: Global MCP endpoints configured via environment variables for fleet-wide infrastructure and fallback operations.

---

### 1. Per-User Composio Connectors

Users connect their accounts directly in the Web UI at `/integrations`. The FastAPI backend coordinates OAuth via Composio and generates dynamic, short-lived user MCP sessions.

#### Setup:
- Set `COMPOSIO_API_KEY` in your `.env` or deployment variables.
- When an AI agent executes a tool call for an authenticated user, `get_mcp_client(name, user_id=user_id)` resolves the user's active Composio session.

| Toolkit | Scoped Specialist Agents | Key Actions Enabled |
|---------|--------------------------|---------------------|
| **Gmail** (`gmail`) | Marketing Manager, Personal Assistant | Search inbox, draft emails, triage unread threads |
| **Slack** (`slack`) | Marketing Manager, Finance Manager, PA | Post channel updates, cross-department notifications |
| **Notion** (`notion`) | Marketing Manager, Research Specialist | Read/update content calendar, documentation export |
| **GitHub** (`github`) | Engineering Worker, Coder | Repository inspection, pull request drafting |
| **Google Calendar** (`googlecalendar`) | Personal Assistant | Availability checks, scheduling operational syncs |
| **Google Sheets** (`googlesheets`) | Finance Manager, Bookkeeper | Real-time trial balance sync, ledger queries |

---

### 2. Static / Shared MCP Server Configuration

When a tool is not connected via per-user Composio or when running fleet-wide tasks without a user context, the system falls back to static MCP servers or local simulated responses (`MCP_FALLBACK_MODE=true` by default).

| Service | Environment Variable | Credential |
|---------|---------------------|------------|
| Supabase Ledger | `SUPABASE_MCP_URL` | `SUPABASE_MCP_KEY` |
| Stripe | `STRIPE_API_KEY` | Official Stripe SDK (`STRIPE_MCP_URL` as fallback) |
| Google Workspace | `GOOGLE_MCP_URL` | `GOOGLE_MCP_CREDENTIALS` |
| Notion | `NOTION_MCP_URL` | `NOTION_MCP_TOKEN` |
| Brave Search | *(none required)* | Free web search by default; `BRAVE_MCP_URL` optional fallback |
| Slack/WhatsApp | `SLACK_MCP_URL` | `SLACK_MCP_BOT_TOKEN` |
| Browser (Playwright) | `BROWSER_MCP_URL` | `BROWSER_MCP_API_KEY` |
| Email | `EMAIL_MCP_URL` | `EMAIL_MCP_API_KEY` |
| Calendar | `CALENDAR_MCP_URL` | `CALENDAR_MCP_API_KEY` |
| Context7 | `CONTEXT7_MCP_URL` | `CONTEXT7_MCP_API_KEY` |
| Collaboration | `COLLABORATION_MCP_URL` | `COLLABORATION_MCP_API_KEY` |

### Direct API Integrations

Some tools call official provider SDKs directly:
- **Stripe**: Set `STRIPE_API_KEY` to use the official `stripe` Python SDK. Read-only actions (`read_charges`, `read_invoices`) call Stripe directly. Write actions (`issue_refund`, `transfer_funds`) require founder approval.
- **Composio**: Set `COMPOSIO_API_KEY` for user-level OAuth connector lifecycles and MCP sessions.

### Health Check

Check the configured MCP servers and fallback mode status:

```bash
curl http://localhost:8000/api/v1/health/mcp
```

### Fallback Mode

When `MCP_FALLBACK_MODE=true` (default), every tool returns realistic simulated responses, allowing local development and testing without live external credentials.

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

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

## Project Structure

- `app/main.py`: Application entry point and router definitions.
- `app/api/`: API routes and dependencies.
- `app/core/`: Configuration, logging, and security.
- `app/models/`: Database models (SQLAlchemy).
- `app/services/`: Business logic.
- `app/agents/`: AI multi-agent logic (to be added).
- `tests/`: Test suite.

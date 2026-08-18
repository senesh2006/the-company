# Stage 1: Build Next.js frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python backend and serve frontend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies using pinned requirements.txt
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Copy frontend static build from builder stage to FastAPI static directory
COPY --from=frontend-builder /app/frontend/out ./app/static

# Expose ports for cloud routing
EXPOSE 8080 8000

# Start the application with automated multi-port bridging
CMD ["python", "-m", "app.server"]

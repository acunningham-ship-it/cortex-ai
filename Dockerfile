FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
COPY backend/ ./backend/
COPY cli/ ./cli/

RUN pip install --no-cache-dir -e ".[prod]" 2>/dev/null || pip install --no-cache-dir \
    fastapi>=0.109.0 \
    "uvicorn[standard]>=0.27.0" \
    httpx>=0.26.0 \
    sqlalchemy>=2.0.0 \
    aiosqlite>=0.20.0 \
    pydantic>=2.5.0 \
    pyyaml>=6.0.1 \
    typer>=0.9.0 \
    rich>=13.7.0 \
    python-multipart>=0.0.6

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 7337

ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7337"]

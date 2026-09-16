FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    zstd \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://ollama.com/install.sh | sh

RUN ollama --version

COPY requirements-docker.txt .

RUN pip install --no-cache-dir numpy==2.1.3 && \
    pip install --no-cache-dir torch==2.11.0 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements-docker.txt && \
    pip install --no-cache-dir OllamaModelTester

COPY . .

EXPOSE 3001

ENV PYTHONBUFFERED=1
ENV START_OLLAMA=true
ENV OLLAMA_HOST=127.0.0.1
ENV OLLAMA_PORT=11434

CMD ["python", "app.py"]
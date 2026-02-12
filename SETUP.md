# Installation and Setup Guide

This document explains how to install, configure, and run the Second Brain project.

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **Docker** and **Docker Compose**
- **npm** (comes with Node.js)
- An **DeepSeek** or **OpenAI** API key

## Configuration

### 1. Clone the project

```bash
git clone <project-url>
cd second_brain
```

### 2. Configure environment variables

Copy the example file and configure your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file with your information:

```env
# DeepSeek (recommended)
DEEPSEEK_API_KEY=sk-your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
DEEPSEEK_EMBEDDING_MODEL=text-embedding-ada-002

# Or OpenAI (alternative)
# OPENAI_API_KEY=sk-your-api-key
# OPENAI_CHAT_MODEL=gpt-4o-mini

# ChromaDB (do not modify when using Docker)
CHROMA_HOST=chromadb
CHROMA_PORT=8000

# Application
PORT=3000
NODE_ENV=development
```

## Running with Docker (Recommended)

This is the easiest and most complete method that includes ChromaDB.

### Development Mode (with hot reload)

```bash
docker-compose up app-dev
```

The application is accessible at `http://localhost:3000`

### Production Mode

```bash
docker-compose up app
```

### Stop the services

```bash
# In another terminal
docker-compose down

# To also remove volumes (data)
docker-compose down -v
```

## Running Locally (without Docker)

### 1. Start ChromaDB

```bash
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chroma_data:/chroma/chroma \
  -e IS_PERSISTENT=TRUE \
  chromadb/chroma:latest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development

```bash
npm run dev
```

The server starts at `http://localhost:3000` with hot reload.

### 4. Run in production

```bash
npm run build
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode with hot reload |
| `npm run build` | Compile TypeScript for production |
| `npm start` | Run the compiled version |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:ui` | Run tests with UI interface |

## Verify Installation

Once running, test the endpoints:

```bash
# General health check
curl http://localhost:3000/health

# Home page with available endpoints
curl http://localhost:3000/

# LLM service health check
curl http://localhost:3000/api/chat/health
```

## Using the API

### Upload a document

```bash
curl -X POST \
  http://localhost:3000/api/documents \
  -F "file=@my-document.pdf"
```

### Send a message to chat

```bash
curl -X POST \
  http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does my document contain?"}'
```

### Semantic search

```bash
curl -X POST \
  http://localhost:3000/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "limit": 5}'
```

## Troubleshooting

### ChromaDB connection error

Check that the ChromaDB container is running:

```bash
docker ps | grep chromadb
```

### API key error

Make sure your `.env` file exists and contains a valid API key:

```bash
cat .env | grep API_KEY
```

### Port issues

If port 3000 is already in use, modify the `PORT` variable in your `.env`.

### Reset everything

```bash
# Stop all containers
docker-compose down -v

# Remove and rebuild images
docker-compose build --no-cache

# Restart
docker-compose up app-dev
```

## Resources

- [Fastify Documentation](https://www.fastify.io/docs/)
- [LangChain Documentation](https://js.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [DeepSeek API](https://platform.deepseek.com/)

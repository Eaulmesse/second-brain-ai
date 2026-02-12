# Second Brain

An intelligent API that transforms your documents into a contextual conversational assistant using RAG (Retrieval Augmented Generation).

## Overview

Second Brain is an application that allows you to:
- **Upload and index** your documents (PDF, DOCX, TXT, MD)
- **Chat with your documents** via an intelligent LLM-powered chat
- **Perform semantic search** across your knowledge base
- **Get contextual answers** based on your own documents

## Technologies

### Backend
- **Fastify** - Fast and lightweight web framework for Node.js
- **TypeScript** - Typed language for robust and maintainable code

### Artificial Intelligence
- **LangChain** - Framework for building LLM applications
- **DeepSeek/OpenAI** - Language models for chat and embeddings
- **ChromaDB** - Vector database for semantic search

### Document Processing
- **pdf-parse** - Text extraction from PDFs
- **mammoth** - DOCX document conversion

### Infrastructure
- **Docker** - Application containerization
- **Docker Compose** - Multi-service orchestration (API + ChromaDB)

### Testing
- **Vitest** - Fast testing framework for TypeScript
- **@testing-library/react** - Testing utilities for React components

## Features

- **Document upload** with automatic parsing
- **Document vectorization** for semantic search
- **Contextual chat** with streaming responses
- **RAG (Retrieval Augmented Generation)** - Chat based on your documents
- **Semantic search** across the document database
- **Health checks** for monitoring
- **Hot reload** in development

## Quick Start

See [SETUP.md](./SETUP.md) for detailed installation and configuration instructions.

## API Endpoints

### Chat with RAG (Streaming)
- `POST /api/chat` - Send a message and receive a streaming response (SSE)
  - Add `"useRag": true` to search your documents before answering
  - Add `"ragLimit": 5` to control how many documents to retrieve (default: 3)
- `GET /api/chat/health` - Check LLM service status

### Documents
- `POST /api/documents` - Upload a new document
- `GET /api/documents` - List all indexed documents
- `GET /api/documents/:id` - Retrieve a specific document
- `DELETE /api/documents/:id` - Delete a document
- `POST /api/documents/search` - Semantic search

### Health
- `GET /health` - General application health check

## RAG Usage

Enable RAG to get context-aware answers based on your uploaded documents:

```json
POST /api/chat
{
  "messages": [{"role": "user", "content": "What are the key points in my documents?"}],
  "useRag": true,
  "ragLimit": 3
}
```

When `useRag` is enabled:
1. The system searches your documents for relevant context
2. Retrieved documents are injected into the prompt
3. The LLM answers based on the document context
4. If no relevant documents are found, it responds: "I don't have enough information in your documents to answer this question."

## Architecture

```
second_brain/
├── src/
│   ├── agents/         # LangChain agents for RAG
│   ├── middleware/     # Fastify middleware (errors, async)
│   ├── routes/         # API routes (chat, documents)
│   ├── services/       # Business services (LLM, ChromaDB)
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── docker-compose.yml  # Docker configuration
├── Dockerfile          # Production image
├── Dockerfile.dev      # Development image
└── package.json        # Dependencies
```

## License

ISC

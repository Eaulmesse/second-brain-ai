import { FastifyInstance } from 'fastify';
import { ChromaService } from '../services/chroma-service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { Errors } from '../utils/errors.js';
import {
  DocumentSchema,
  DocumentUpdateSchema,
  DocumentSearchSchema,
  DocumentResponseSchema,
  DocumentSearchResponseSchema,
  DocumentListResponseSchema,
  CollectionStatsSchema,
  ErrorResponseSchema,
  type Document,
  type DocumentUpdate,
  type DocumentSearch,
} from '../types/document.js';

export async function documentRoutes(fastify: FastifyInstance) {
  const chromaService = new ChromaService();

  // Helper function to map document to response
  const mapToResponse = (document: any) => ({
    id: document.id,
    content: document.content,
    metadata: document.metadata,
    created: document.metadata['timestamp'],
    updated: document.metadata['updated'],
  });

  // POST /api/documents - Create a document
  fastify.post('/api/documents', {
    schema: {
      body: DocumentSchema,
      response: {
        201: DocumentResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const document = request.body as Document;
    
    const id = await chromaService.addDocument(
      document.content,
      document.metadata || {}
    );
    
    const createdDocument = await chromaService.getDocument(id);
    
    if (!createdDocument) {
      throw Errors.service('Failed to retrieve created document', 'DOCUMENT_RETRIEVAL_ERROR');
    }
    
    return reply.code(201).send(mapToResponse(createdDocument));
  }));

  // POST /api/documents/batch - Create multiple documents
  fastify.post('/api/documents/batch', {
    schema: {
      body: Type.Array(DocumentSchema),
      response: {
        201: Type.Object({
          ids: Type.Array(Type.String()),
          count: Type.Number(),
        }),
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const documents = request.body as Document[];
    
    const vectorDocuments = documents.map(doc => ({
      id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: doc.content,
      metadata: {
        ...(doc.metadata || {}),
        timestamp: new Date().toISOString(),
      },
    }));
    
    const ids = await chromaService.addDocuments(vectorDocuments);
    
    return reply.code(201).send({
      ids,
      count: ids.length,
    });
  }));

  // GET /api/documents/:id - Get a document by ID
  fastify.get('/api/documents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: DocumentResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const document = await chromaService.getDocument(id);
    
    if (!document) {
      throw Errors.documentNotFound(id);
    }
    
    return reply.code(200).send(mapToResponse(document));
  }));

  // PUT /api/documents/:id - Update a document
  fastify.put('/api/documents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      body: DocumentUpdateSchema,
      response: {
        200: DocumentResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    const update = request.body as DocumentUpdate;
    
    const existingDocument = await chromaService.getDocument(id);
    
    if (!existingDocument) {
      throw Errors.documentNotFound(id);
    }
    
    const content = update.content || existingDocument.content;
    const metadata = {
      ...existingDocument.metadata,
      ...(update.metadata || {}),
      updated: new Date().toISOString(),
    };
    
    await chromaService.updateDocument(id, content, metadata);
    
    const updatedDocument = await chromaService.getDocument(id);
    
    if (!updatedDocument) {
      throw Errors.service('Failed to retrieve updated document', 'DOCUMENT_RETRIEVAL_ERROR');
    }
    
    return reply.code(200).send(mapToResponse(updatedDocument));
  }));

  // DELETE /api/documents/:id - Delete a document
  fastify.delete('/api/documents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        204: Type.Null(),
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const existingDocument = await chromaService.getDocument(id);
    
    if (!existingDocument) {
      throw Errors.documentNotFound(id);
    }
    
    await chromaService.deleteDocument(id);
    
    return reply.code(204).send();
  }));

  // POST /api/documents/search - Search documents
  fastify.post('/api/documents/search', {
    schema: {
      body: DocumentSearchSchema,
      response: {
        200: DocumentSearchResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const search = request.body as DocumentSearch;
    
    const results = await chromaService.search(
      search.query,
      search.limit || 5,
      search.filter
    );
    
    return reply.code(200).send({
      results: results.map(result => ({
        document: mapToResponse(result.document),
        score: result.score,
      })),
      query: search.query,
      total: results.length,
    });
  }));

  // GET /api/documents - List documents with pagination
  fastify.get('/api/documents', {
    schema: {
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 1000, default: 100 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: DocumentListResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (request, reply) => {
    const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };
    
    const documents = await chromaService.listDocuments(limit, offset);
    const stats = await chromaService.getCollectionStats();
    
    return reply.code(200).send({
      documents: documents.map(mapToResponse),
      total: stats.count,
      limit,
      offset,
    });
  }));

  // GET /api/documents/stats - Get collection statistics
  fastify.get('/api/documents/stats', {
    schema: {
      response: {
        200: CollectionStatsSchema,
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (_request, reply) => {
    const stats = await chromaService.getCollectionStats();
    
    return reply.code(200).send(stats);
  }));

  // DELETE /api/documents - Clear collection
  fastify.delete('/api/documents', {
    schema: {
      response: {
        204: Type.Null(),
        500: ErrorResponseSchema,
      },
    },
  }, asyncHandler(async (_request, reply) => {
    await chromaService.clearCollection();
    
    return reply.code(204).send();
  }));

  // GET /api/documents/health - Health check
  fastify.get('/api/documents/health', asyncHandler(async (_request, reply) => {
    const isHealthy = await chromaService.healthCheck();
    
    if (isHealthy) {
      return reply.code(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'chromadb',
      });
    } else {
      throw Errors.service('ChromaDB health check failed', 'CHROMADB_HEALTH_CHECK_ERROR');
    }
  }));
}

import { Type } from '@fastify/type-provider-typebox';
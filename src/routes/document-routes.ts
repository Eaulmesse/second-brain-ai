import { FastifyInstance } from 'fastify';
import { ChromaService } from '../services/chroma-service.js';
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

  fastify.post('/api/documents', {
    schema: {
      body: DocumentSchema,
      response: {
        201: DocumentResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const document = request.body as Document;
      
      const id = await chromaService.addDocument(
        document.content,
        document.metadata || {}
      );
      
      const createdDocument = await chromaService.getDocument(id);
      
      if (!createdDocument) {
        throw new Error('Failed to retrieve created document');
      }
      
      return reply.code(201).send({
        id: createdDocument.id,
        content: createdDocument.content,
        metadata: createdDocument.metadata,
        created: createdDocument.metadata['timestamp'],
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Create document error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_CREATE_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

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
  }, async (request, reply) => {
    try {
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
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Batch create documents error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'BATCH_CREATE_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

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
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const document = await chromaService.getDocument(id);
      
      if (!document) {
        return reply.code(404).send({
          error: {
            message: `Document with id ${id} not found`,
            code: 'DOCUMENT_NOT_FOUND',
          },
        });
      }
      
      return reply.code(200).send({
        id: document.id,
        content: document.content,
        metadata: document.metadata,
        created: document.metadata['timestamp'],
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Get document error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_GET_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

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
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const update = request.body as DocumentUpdate;
      
      const existingDocument = await chromaService.getDocument(id);
      
      if (!existingDocument) {
        return reply.code(404).send({
          error: {
            message: `Document with id ${id} not found`,
            code: 'DOCUMENT_NOT_FOUND',
          },
        });
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
        throw new Error('Failed to retrieve updated document');
      }
      
      return reply.code(200).send({
        id: updatedDocument.id,
        content: updatedDocument.content,
        metadata: updatedDocument.metadata,
        created: updatedDocument.metadata['timestamp'],
        updated: updatedDocument.metadata['updated'],
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Update document error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_UPDATE_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

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
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const existingDocument = await chromaService.getDocument(id);
      
      if (!existingDocument) {
        return reply.code(404).send({
          error: {
            message: `Document with id ${id} not found`,
            code: 'DOCUMENT_NOT_FOUND',
          },
        });
      }
      
      await chromaService.deleteDocument(id);
      
      return reply.code(204).send();
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Delete document error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_DELETE_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

  fastify.post('/api/documents/search', {
    schema: {
      body: DocumentSearchSchema,
      response: {
        200: DocumentSearchResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const search = request.body as DocumentSearch;
      
      const results = await chromaService.search(
        search.query,
        search.limit || 5,
        search.filter
      );
      
      return reply.code(200).send({
        results: results.map(result => ({
          document: {
            id: result.document.id,
            content: result.document.content,
            metadata: result.document.metadata,
            created: result.document.metadata['timestamp'],
          },
          score: result.score,
        })),
        query: search.query,
        total: results.length,
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Search documents error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_SEARCH_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

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
  }, async (request, reply) => {
    try {
      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      const documents = await chromaService.listDocuments(limit, offset);
      const stats = await chromaService.getCollectionStats();
      
      return reply.code(200).send({
        documents: documents.map(doc => ({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          created: doc.metadata['timestamp'],
        })),
        total: stats.count,
        limit,
        offset,
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'List documents error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'DOCUMENT_LIST_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

  fastify.get('/api/documents/stats', {
    schema: {
      response: {
        200: CollectionStatsSchema,
        500: ErrorResponseSchema,
      },
    },
  }, async (_request, reply) => {
    try {
      const stats = await chromaService.getCollectionStats();
      
      return reply.code(200).send(stats);
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Get collection stats error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'STATS_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

  fastify.delete('/api/documents', {
    schema: {
      response: {
        204: Type.Null(),
        500: ErrorResponseSchema,
      },
    },
  }, async (_request, reply) => {
    try {
      await chromaService.clearCollection();
      
      return reply.code(204).send();
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'Clear collection error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'CLEAR_COLLECTION_ERROR',
          details: process.env['NODE_ENV'] === 'development' ? errorObj.stack : undefined,
        },
      });
    }
  });

  fastify.get('/api/documents/health', async (_request, reply) => {
    try {
      const isHealthy = await chromaService.healthCheck();
      
      if (isHealthy) {
        return reply.code(200).send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'chromadb',
        });
      } else {
        return reply.code(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'chromadb',
          error: 'ChromaDB health check failed',
        });
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error({
        msg: 'ChromaDB health check error',
        error: errorObj.message,
        stack: errorObj.stack,
        timestamp: new Date().toISOString(),
      });
      
      return reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'chromadb',
        error: errorObj.message,
      });
    }
  });
}

import { Type } from '@fastify/type-provider-typebox';
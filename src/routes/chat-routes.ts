import { FastifyInstance } from 'fastify';
import { LLMService } from '../services/llm-service.js';
import { ChatRequestSchema, ChatResponseSchema, ErrorResponseSchema } from '../types/chat.js';

export async function chatRoutes(fastify: FastifyInstance) {
  const llmService = new LLMService(process.env['DEEPSEEK_API_KEY'] || '');

  fastify.post('/api/chat', {
    schema: {
      body: ChatRequestSchema,
      response: {
        200: ChatResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const chatRequest = request.body as any;
      
      const response = await llmService.chat(chatRequest);
      
      return reply.code(200).send(response);
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error('Chat endpoint error: %o', errorObj);
      
      return reply.code(500).send({
        error: {
          message: errorObj.message,
          code: 'INTERNAL_ERROR',
        },
      });
    }
  });

  fastify.post('/api/chat/stream', {
    schema: {
      body: ChatRequestSchema,
    },
  }, async (request, reply) => {
    try {
      const chatRequest = request.body as any;
      
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const stream = llmService.streamChat(chatRequest);
      
      for await (const chunk of stream) {
        reply.raw.write(`data: ${chunk}\n\n`);
      }

      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error('Chat stream endpoint error: %o', errorObj);
      
      reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
      reply.raw.end(JSON.stringify({
        error: {
          message: errorObj.message,
          code: 'INTERNAL_ERROR',
        },
      }));
    }
  });

  fastify.get('/api/chat/health', async (_request, reply) => {
    try {
      const isHealthy = await llmService.healthCheck();
      
      if (isHealthy) {
        return reply.code(200).send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'llm',
        });
      } else {
        return reply.code(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'llm',
          error: 'LLM service health check failed',
        });
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      fastify.log.error('Health check error: %o', errorObj);
      
      return reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'llm',
        error: errorObj.message,
      });
    }
  });
}
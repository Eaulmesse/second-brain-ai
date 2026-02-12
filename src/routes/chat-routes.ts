import { FastifyInstance } from 'fastify';
import { LLMService } from '../services/llm-service.js';
import { ChromaService } from '../services/chroma-service.js';
import { ChatRequestSchema, ChatRequest } from '../types/chat.js';
import { asyncHandler } from '../middleware/async-handler.js';

export async function chatRoutes(fastify: FastifyInstance) {
  const chromaService = new ChromaService();
  const llmService = new LLMService(process.env['DEEPSEEK_API_KEY'] || '', chromaService);

  fastify.post('/api/chat', {
    schema: {
      body: ChatRequestSchema,
    },
  }, asyncHandler(async (request, reply) => {
    const chatRequest = request.body as ChatRequest;
    
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
  }));

  fastify.get('/api/chat/health', asyncHandler(async (_request, reply) => {
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
  }));
}
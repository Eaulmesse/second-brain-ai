import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './async-handler.js';

export function setupErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: AppError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    
    fastify.log.error({
      msg: 'Request error',
      error: error.message,
      stack: error.stack,
      code,
      statusCode,
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    });

    reply.status(statusCode).send({
      error: {
        message: error.message,
        code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
    });
  });

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.warn({
      msg: 'Route not found',
      method: request.method,
      url: request.url,
    });

    reply.status(404).send({
      error: {
        message: `Route ${request.method} ${request.url} not found`,
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      },
    });
  });
}
import { FastifyRequest, FastifyReply, RouteHandler } from 'fastify';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function asyncHandler<T = any>(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>
): RouteHandler {
  return async (request, reply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      const appError = error as AppError;
      
      request.log.error({
        msg: 'Request handler error',
        error: appError.message,
        stack: appError.stack,
        code: appError.code,
        statusCode: appError.statusCode,
        path: request.url,
        method: request.method,
      });

      throw error;
    }
  };
}
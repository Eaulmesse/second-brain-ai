import { AppError } from '../middleware/async-handler.js';

export class DocumentNotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'DOCUMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Document with id ${id} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ServiceError extends Error implements AppError {
  statusCode = 500;
  code: string;

  constructor(message: string, code: string = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

export class ChromaDBError extends ServiceError {
  constructor(message: string, operation: string) {
    super(`ChromaDB ${operation} failed: ${message}`, `CHROMADB_${operation.toUpperCase()}_ERROR`);
    this.name = 'ChromaDBError';
  }
}

export class LLMServiceError extends ServiceError {
  constructor(message: string, operation: string) {
    super(`LLM service ${operation} failed: ${message}`, `LLM_${operation.toUpperCase()}_ERROR`);
    this.name = 'LLMServiceError';
  }
}

// Factory functions for common errors
export const Errors = {
  documentNotFound: (id: string) => new DocumentNotFoundError(id),
  validation: (message: string, details?: any) => new ValidationError(message, details),
  chromaDB: (message: string, operation: string) => new ChromaDBError(message, operation),
  llmService: (message: string, operation: string) => new LLMServiceError(message, operation),
  service: (message: string, code?: string) => new ServiceError(message, code),
};
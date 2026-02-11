import { describe, it, expect } from 'vitest';
import {
  DocumentNotFoundError,
  ValidationError,
  ServiceError,
  ChromaDBError,
  LLMServiceError,
  Errors,
} from './errors.js';

describe('Error Classes', () => {
  describe('DocumentNotFoundError', () => {
    it('should create error with correct properties', () => {
      const error = new DocumentNotFoundError('test-id');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DocumentNotFoundError);
      expect(error.message).toBe('Document with id test-id not found');
      expect(error.name).toBe('DocumentNotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should implement AppError interface', () => {
      const error = new DocumentNotFoundError('test-id');
      
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('code');
    });
  });

  describe('ValidationError', () => {
    it('should create error with message only', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });

    it('should create error with message and details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid input', details);

      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual(details);
    });
  });

  describe('ServiceError', () => {
    it('should create error with default code', () => {
      const error = new ServiceError('Service failed');

      expect(error.message).toBe('Service failed');
      expect(error.name).toBe('ServiceError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('SERVICE_ERROR');
    });

    it('should create error with custom code', () => {
      const error = new ServiceError('Service failed', 'CUSTOM_ERROR');

      expect(error.code).toBe('CUSTOM_ERROR');
    });
  });

  describe('ChromaDBError', () => {
    it('should create error with operation context', () => {
      const error = new ChromaDBError('Connection timeout', 'initialize');

      expect(error.message).toBe('ChromaDB initialize failed: Connection timeout');
      expect(error.name).toBe('ChromaDBError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CHROMADB_INITIALIZE_ERROR');
    });

    it('should inherit from ServiceError', () => {
      const error = new ChromaDBError('Test', 'operation');

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(ChromaDBError);
    });
  });

  describe('LLMServiceError', () => {
    it('should create error with operation context', () => {
      const error = new LLMServiceError('API rate limit', 'chat');

      expect(error.message).toBe('LLM service chat failed: API rate limit');
      expect(error.name).toBe('LLMServiceError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('LLM_CHAT_ERROR');
    });

    it('should inherit from ServiceError', () => {
      const error = new LLMServiceError('Test', 'operation');

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(LLMServiceError);
    });
  });

  describe('Errors factory', () => {
    it('should create DocumentNotFoundError via factory', () => {
      const error = Errors.documentNotFound('doc-123');

      expect(error).toBeInstanceOf(DocumentNotFoundError);
      expect(error.message).toBe('Document with id doc-123 not found');
    });

    it('should create ValidationError via factory', () => {
      const details = { min: 1 };
      const error = Errors.validation('Too short', details);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Too short');
      expect(error.details).toEqual(details);
    });

    it('should create ChromaDBError via factory', () => {
      const error = Errors.chromaDB('Network error', 'search');

      expect(error).toBeInstanceOf(ChromaDBError);
      expect(error.message).toBe('ChromaDB search failed: Network error');
    });

    it('should create LLMServiceError via factory', () => {
      const error = Errors.llmService('Model not found', 'generate');

      expect(error).toBeInstanceOf(LLMServiceError);
      expect(error.message).toBe('LLM service generate failed: Model not found');
    });

    it('should create ServiceError via factory', () => {
      const error = Errors.service('Unknown error', 'UNKNOWN');

      expect(error).toBeInstanceOf(ServiceError);
      expect(error.message).toBe('Unknown error');
      expect(error.code).toBe('UNKNOWN');
    });

    it('should create ServiceError with default code via factory', () => {
      const error = Errors.service('Generic error');

      expect(error.code).toBe('SERVICE_ERROR');
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance', () => {
      const docError = new DocumentNotFoundError('test');
      const validationError = new ValidationError('test');
      const serviceError = new ServiceError('test');
      const chromaError = new ChromaDBError('test', 'op');
      const llmError = new LLMServiceError('test', 'op');

      expect(docError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
      expect(serviceError).toBeInstanceOf(Error);
      expect(chromaError).toBeInstanceOf(Error);
      expect(chromaError).toBeInstanceOf(ServiceError);
      expect(llmError).toBeInstanceOf(Error);
      expect(llmError).toBeInstanceOf(ServiceError);
    });
  });
});
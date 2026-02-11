import { describe, it, expect, vi, beforeEach } from 'vitest';
import { asyncHandler, type AppError } from './async-handler.js';

describe('asyncHandler', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockHandler: any;

  beforeEach(() => {
    mockRequest = {
      url: '/api/test',
      method: 'POST',
      log: {
        error: vi.fn(),
      },
    } as any;

    mockReply = {} as any;

    mockHandler = vi.fn();
  });

  it('should execute handler successfully', async () => {
    const expectedResult = { success: true, data: 'test' };
    mockHandler.mockResolvedValue(expectedResult);

    const wrappedHandler = asyncHandler(mockHandler);
    const result = await wrappedHandler(mockRequest, mockReply);

    expect(result).toEqual(expectedResult);
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockReply);
    expect(mockRequest.log.error).not.toHaveBeenCalled();
  });

  it('should catch and log AppError with statusCode', async () => {
    const appError: AppError = new Error('Test AppError');
    appError.statusCode = 404;
    appError.code = 'NOT_FOUND';
    appError.details = { id: '123' };

    mockHandler.mockRejectedValue(appError);

    const wrappedHandler = asyncHandler(mockHandler);

    await expect(wrappedHandler(mockRequest, mockReply)).rejects.toThrow(appError);

      expect((mockRequest.log as any).error).toHaveBeenCalledWith({
      msg: 'Request handler error',
      error: 'Test AppError',
      stack: appError.stack,
      code: 'NOT_FOUND',
      statusCode: 404,
      path: '/api/test',
      method: 'POST',
    });
  });

  it('should catch and log regular Error', async () => {
    const regularError = new Error('Regular error');
    mockHandler.mockRejectedValue(regularError);

    const wrappedHandler = asyncHandler(mockHandler);

    await expect(wrappedHandler(mockRequest, mockReply)).rejects.toThrow(regularError);

      expect((mockRequest.log as any).error).toHaveBeenCalledWith({
      msg: 'Request handler error',
      error: 'Regular error',
      stack: regularError.stack,
      code: undefined,
      statusCode: undefined,
      path: '/api/test',
      method: 'POST',
    });
  });

  it('should catch and log non-Error objects', async () => {
    const nonError = { message: 'String error' };
    mockHandler.mockRejectedValue(nonError);

    const wrappedHandler = asyncHandler(mockHandler);

    await expect(wrappedHandler(mockRequest, mockReply)).rejects.toThrow();

      expect((mockRequest.log as any).error).toHaveBeenCalledWith({
      msg: 'Request handler error',
      error: 'String error',
      stack: undefined,
      code: undefined,
      statusCode: undefined,
      path: '/api/test',
      method: 'POST',
    });
  });

  it('should handle synchronous errors in handler', async () => {
    const syncError = new Error('Sync error');
    mockHandler.mockImplementation(() => {
      throw syncError;
    });

    const wrappedHandler = asyncHandler(mockHandler);

    await expect(wrappedHandler(mockRequest, mockReply)).rejects.toThrow(syncError);

      expect((mockRequest.log as any).error).toHaveBeenCalledWith({
      msg: 'Request handler error',
      error: 'Sync error',
      stack: syncError.stack,
      code: undefined,
      statusCode: undefined,
      path: '/api/test',
      method: 'POST',
    });
  });

  it('should preserve error properties when re-throwing', async () => {
    const customError = new Error('Custom error') as AppError;
    customError.statusCode = 400;
    customError.code = 'CUSTOM_CODE';
    customError.details = { custom: 'detail' };

    mockHandler.mockRejectedValue(customError);

    const wrappedHandler = asyncHandler(mockHandler);

    try {
      await wrappedHandler(mockRequest, mockReply);
      expect.fail('Should have thrown');
    } catch (error) {
      const caughtError = error as AppError;
      expect(caughtError.message).toBe('Custom error');
      expect(caughtError.statusCode).toBe(400);
      expect(caughtError.code).toBe('CUSTOM_CODE');
      expect(caughtError.details).toEqual({ custom: 'detail' });
    }
  });

  it('should work with different HTTP methods and paths', async () => {
    const error = new Error('Test error');
    mockHandler.mockRejectedValue(error);

    const testRequest = {
      url: '/api/users/123',
      method: 'GET',
      log: {
        error: vi.fn(),
      },
    };

    const wrappedHandler = asyncHandler(mockHandler);

    await expect(wrappedHandler(testRequest, mockReply)).rejects.toThrow(error);

    expect(testRequest.log.error).toHaveBeenCalledWith({
      msg: 'Request handler error',
      error: 'Test error',
      stack: error.stack,
      code: undefined,
      statusCode: undefined,
      path: '/api/users/123',
      method: 'GET',
    });
  });

  describe('TypeScript interface', () => {
    it('should satisfy AppError interface', () => {
      const error: AppError = new Error('Test');
      error.statusCode = 500;
      error.code = 'TEST_CODE';
      error.details = { test: true };

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ test: true });
    });

    it('should allow partial AppError implementation', () => {
      const error: AppError = new Error('Partial');

      expect(error.statusCode).toBeUndefined();
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });
});
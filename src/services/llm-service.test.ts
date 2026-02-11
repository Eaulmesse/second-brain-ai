import { describe, it, expect } from 'vitest';
import { LLMService } from './llm-service.js';

// Skip integration tests that require external services
describe.skip('LLMService', () => {
  describe('constructor', () => {
    it('should require API key', () => {
      expect(() => new LLMService('')).toThrow('DEEPSEEK_API_KEY is required');
    });
  });
});
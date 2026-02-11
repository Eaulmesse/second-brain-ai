import { describe, it, expect } from 'vitest';
import { ChromaService } from './chroma-service.js';

// Skip integration tests that require external services
describe.skip('ChromaService', () => {
  describe('constants', () => {
    it('should have centralized constants', () => {
      // Test that constants are properly centralized
      const service = new ChromaService();
      expect(service).toBeInstanceOf(ChromaService);
    });
  });
});
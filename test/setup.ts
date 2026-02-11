import { vi, afterEach } from 'vitest';

// Mock environment variables for tests
process.env['NODE_ENV'] = 'test';
process.env['CHROMA_HOST'] = 'localhost';
process.env['CHROMA_PORT'] = '8000';
process.env['CHROMA_COLLECTION_NAME'] = 'test_documents';
process.env['DEEPSEEK_API_KEY'] = 'test-api-key';

// Global mocks
vi.mock('chromadb', () => ({
  ChromaClient: vi.fn(),
  IncludeEnum: {
    Documents: 'documents',
    Metadatas: 'metadatas',
    Distances: 'distances',
  },
}));

vi.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
import { ChromaClient, IncludeEnum } from 'chromadb';
import { LocalEmbeddings } from './local-embeddings.js';

const DEFAULT_CONFIG = {
  CHROMA_HOST: 'localhost',
  CHROMA_PORT: '8000',
  CHROMA_COLLECTION_NAME: 'documents',
  EMBEDDING_DIMENSION: 384,
} as const;

const ERROR_MESSAGES = {
  INITIALIZATION_FAILED: 'ChromaDB initialization failed',
  ADD_DOCUMENTS_FAILED: 'Failed to add documents',
  SEARCH_FAILED: 'Search failed',
  GET_DOCUMENT_FAILED: 'Failed to get document',
  UPDATE_DOCUMENT_FAILED: 'Failed to update document',
  DELETE_DOCUMENT_FAILED: 'Failed to delete document',
  DELETE_DOCUMENTS_FAILED: 'Failed to delete documents',
  LIST_DOCUMENTS_FAILED: 'Failed to list documents',
  GET_STATS_FAILED: 'Failed to get collection stats',
  CLEAR_COLLECTION_FAILED: 'Failed to clear collection',
} as const;

const COLLECTION_METADATA = {
  description: 'Document embeddings for second-brain',
} as const;

const LOG_MESSAGES = {
  CONNECTION_SUCCESSFUL: 'ChromaDB connection successful',
  COLLECTION_CREATED: (name: string) => `Created collection: ${name}`,
  COLLECTION_EXISTS: (name: string) => `Using existing collection: ${name}`,
  DOCUMENTS_ADDED: (count: number) => `Added ${count} documents to collection`,
  DOCUMENT_UPDATED: (id: string) => `Updated document: ${id}`,
  DOCUMENT_DELETED: (id: string) => `Deleted document: ${id}`,
  DOCUMENTS_DELETED: (count: number) => `Deleted ${count} documents`,
  COLLECTION_CLEARED: (name: string) => `Cleared collection: ${name}`,
} as const;

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export interface CollectionStats {
  name: string;
  count: number;
  metadata: Record<string, any>;
}

export class ChromaService {
  private client: ChromaClient;
  private embeddings: LocalEmbeddings;
  private collectionName: string;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    const host = process.env['CHROMA_HOST'] || DEFAULT_CONFIG.CHROMA_HOST;
    const port = process.env['CHROMA_PORT'] || DEFAULT_CONFIG.CHROMA_PORT;
    this.collectionName = process.env['CHROMA_COLLECTION_NAME'] || DEFAULT_CONFIG.CHROMA_COLLECTION_NAME;

    this.client = new ChromaClient({
      path: `http://${host}:${port}`,
    });

    this.embeddings = new LocalEmbeddings(DEFAULT_CONFIG.EMBEDDING_DIMENSION);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initialize();
    try {
      await this.initializationPromise;
      this.initialized = true;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.client.heartbeat();
      console.log(LOG_MESSAGES.CONNECTION_SUCCESSFUL);

      const collections = await this.client.listCollections();
      const collectionExists = collections.some(c => c === this.collectionName);

      if (!collectionExists) {
        await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            ...COLLECTION_METADATA,
            created: new Date().toISOString(),
          },
        });
        console.log(LOG_MESSAGES.COLLECTION_CREATED(this.collectionName));
      } else {
        console.log(LOG_MESSAGES.COLLECTION_EXISTS(this.collectionName));
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
      throw new Error(`${ERROR_MESSAGES.INITIALIZATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addDocuments(documents: VectorDocument[]): Promise<string[]> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      
      const contents = documents.map(doc => doc.content);
      const embeddings = await this.embeddings.embedDocuments(contents);
      
      const ids = documents.map(doc => doc.id);
      const metadatas = documents.map(doc => doc.metadata);

      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents: contents,
      });

      console.log(LOG_MESSAGES.DOCUMENTS_ADDED(documents.length));
      return ids;
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw new Error(`${ERROR_MESSAGES.ADD_DOCUMENTS_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addDocument(content: string, metadata: Record<string, any> = {}): Promise<string> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const document: VectorDocument = {
      id,
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };

    await this.addDocuments([document]);
    return id;
  }

  async search(query: string, limit: number = 5, filter?: Record<string, any>): Promise<SearchResult[]> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      const queryParams: any = {
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
      };

      if (filter && Object.keys(filter).length > 0) {
        queryParams.where = filter;
      }

      const results = await collection.query(queryParams);

      if (!results.documents || !results.metadatas || !results.distances) {
        return [];
      }

      const documents = results.documents[0] || [];
      const metadatas = results.metadatas[0] || [];
      const distances = results.distances[0] || [];
      const ids = results.ids[0] || [];

      return documents.map((content: string | null, index: number) => {
        if (!content) return null;
        
        return {
          document: {
            id: ids[index] || `unknown_${index}`,
            content,
            metadata: metadatas[index] || {},
          },
          score: 1 - (distances[index] || 0),
        };
      }).filter((result): result is SearchResult => result !== null);
    } catch (error) {
      console.error('Failed to search documents:', error);
      throw new Error(`${ERROR_MESSAGES.SEARCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDocument(id: string): Promise<VectorDocument | null> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      
      const result = await collection.get({
        ids: [id],
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas],
      });

      if (!result.documents || result.documents.length === 0) {
        return null;
      }

      const content = result.documents[0];
      if (!content) return null;

      return {
        id,
        content,
        metadata: result.metadatas?.[0] || {},
      };
    } catch (error) {
      console.error('Failed to get document:', error);
      throw new Error(`${ERROR_MESSAGES.GET_DOCUMENT_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDocument(id: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      
      const embedding = await this.embeddings.embedDocuments([content]);
      
      await collection.update({
        ids: [id],
        embeddings: embedding,
        metadatas: [metadata],
        documents: [content],
      });

      console.log(LOG_MESSAGES.DOCUMENT_UPDATED(id));
    } catch (error) {
      console.error('Failed to update document:', error);
      throw new Error(`${ERROR_MESSAGES.UPDATE_DOCUMENT_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      await collection.delete({ ids: [id] });
      console.log(LOG_MESSAGES.DOCUMENT_DELETED(id));
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error(`${ERROR_MESSAGES.DELETE_DOCUMENT_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
       await collection.delete({ ids });
      console.log(LOG_MESSAGES.DOCUMENTS_DELETED(ids.length));
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw new Error(`${ERROR_MESSAGES.DELETE_DOCUMENTS_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listDocuments(limit: number = 100, offset: number = 0): Promise<VectorDocument[]> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      
      const result = await collection.get({
        limit,
        offset,
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas],
      });

      if (!result.documents) {
        return [];
      }

      return result.documents
        .map((content: string | null, index: number) => {
          if (!content) return null;
          
          return {
            id: result.ids[index] || `unknown_${index}`,
            content,
            metadata: result.metadatas?.[index] || {},
          };
        })
        .filter((doc): doc is VectorDocument => doc !== null);
    } catch (error) {
      console.error('Failed to list documents:', error);
      throw new Error(`${ERROR_MESSAGES.LIST_DOCUMENTS_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCollectionStats(): Promise<CollectionStats> {
    try {
      await this.ensureInitialized();
      
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return await this.embeddings.embedDocuments(texts);
          },
        },
      });
      const count = await collection.count();
      
      return {
        name: this.collectionName,
        count,
        metadata: collection.metadata || {},
      };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw new Error(`${ERROR_MESSAGES.GET_STATS_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearCollection(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      await this.client.deleteCollection({ name: this.collectionName });
      console.log(LOG_MESSAGES.COLLECTION_CLEARED(this.collectionName));
      
      await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          ...COLLECTION_METADATA,
          created: new Date().toISOString(),
          cleared: new Date().toISOString(),
        },
      });
      
      this.initialized = false;
      this.initializationPromise = null;
    } catch (error) {
      console.error('Failed to clear collection:', error);
      throw new Error(`${ERROR_MESSAGES.CLEAR_COLLECTION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch (error) {
      console.error('ChromaDB health check failed:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
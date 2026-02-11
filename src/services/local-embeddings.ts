import { Embeddings } from '@langchain/core/embeddings';

export class LocalEmbeddings extends Embeddings {
  private dimensions: number;

  constructor(dimensions: number = 384) {
    super({});
    this.dimensions = dimensions;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(text => this.generateEmbedding(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.generateEmbedding(text);
  }

  private generateEmbedding(text: string): number[] {
    const embedding = new Array(this.dimensions).fill(0);
    
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < this.dimensions; i++) {
      let value = 0;
      
      for (const word of words) {
        const hash = this.hashString(word);
        const position = (hash + i) % this.dimensions;
        
        const charCode = word.charCodeAt(i % word.length) || 0;
        value += Math.sin(charCode * position) * 0.1;
      }
      
      embedding[i] = Math.tanh(value / words.length);
    }
    
    return embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
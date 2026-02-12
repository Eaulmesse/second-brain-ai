import { DeepSeekAgent, type DeepSeekAgentConfig } from '../agents/deepseek-agent.js';
import type { ChatRequest, ChatResponse } from '../types/chat.js';
import { ChromaService } from './chroma-service.js';

export class LLMService {
  private agent: DeepSeekAgent;
  private chromaService: ChromaService;

  constructor(apiKey: string, chromaService?: ChromaService) {
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }

    const baseConfig: DeepSeekAgentConfig = {
      apiKey,
      temperature: 0.7,
      maxTokens: 1000,
    };

    this.agent = new DeepSeekAgent(baseConfig);
    this.chromaService = chromaService ?? new ChromaService();
  }

  private async retrieveContext(query: string, limit: number = 3): Promise<string> {
    try {
      const results = await this.chromaService.search(query, limit);
      
      if (results.length === 0) {
        return '';
      }

      const contextParts = results.map((result, index) => {
        return `[Document ${index + 1}]\n${result.document.content}`;
      });

      return contextParts.join('\n\n---\n\n');
    } catch (error) {
      console.error('Failed to retrieve context from ChromaDB:', error);
      return '';
    }
  }

  private buildRagPrompt(userMessage: string, context: string): string {
    if (!context) {
      return userMessage;
    }

    return `Context information from documents:\n${context}\n\n---\n\nBased on the context above, please answer the following question. If the context doesn't contain relevant information, say "I don't have enough information in your documents to answer this question."\n\nQuestion: ${userMessage}`;
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<string> {
    try {
      let userMessage = request.messages[request.messages.length - 1]!.content;

      if (request.useRag) {
        const context = await this.retrieveContext(userMessage, request.ragLimit || 3);
        userMessage = this.buildRagPrompt(userMessage, context);
      }

      let fullResponse = '';
      
      await this.agent.stream(
        userMessage,
        (token: string) => {
          fullResponse += token;
        }
      );

      const response: ChatResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model || 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: fullResponse,
            },
            finishReason: 'stop',
          },
        ],
      };

      yield JSON.stringify(response);
    } catch (error) {
      console.error('LLM Service streaming error:', error);
      throw new Error(`LLM streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.agent.generate('Hello');
      return true;
    } catch (error) {
      console.error('LLM health check failed:', error);
      return false;
    }
  }
}
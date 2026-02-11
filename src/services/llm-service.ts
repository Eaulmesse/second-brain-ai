import { DeepSeekAgent, DeepSeekR1Agent, type DeepSeekAgentConfig } from '../agents/deepseek-agent.js';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';
import type { ChatRequest, ChatResponse } from '../types/chat.js';

export class LLMService {
  private agent: DeepSeekAgent;
  private r1Agent: DeepSeekR1Agent;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }

    const baseConfig: DeepSeekAgentConfig = {
      apiKey,
      temperature: 0.7,
      maxTokens: 1000,
    };

    this.agent = new DeepSeekAgent(baseConfig);
    this.r1Agent = new DeepSeekR1Agent(baseConfig);
  }

  private mapToLangChainMessages(messages: Array<{ role: string; content: string }>): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const langChainMessages = this.mapToLangChainMessages(request.messages);
      
      const agent = request.model?.includes('reasoner') ? this.r1Agent : this.agent;
      
      if (!agent) {
        throw new Error('Agent not found');
      }

      if (request.model && request.model !== 'deepseek-chat' && request.model !== 'deepseek-reasoner') {
        agent.updateSystemPrompt(`You are using model: ${request.model}. ${agent.getSystemPrompt()}`);
      }

      const response = await agent.chat(langChainMessages);

      return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model || 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.content,
            },
            finishReason: 'stop',
          },
        ],
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      throw new Error(`LLM service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamChat(request: ChatRequest): AsyncGenerator<string> {
    try {
      const agent = request.model?.includes('reasoner') ? this.r1Agent : this.agent;

      if (!agent) {
        throw new Error('Agent not found');
      }

      let fullResponse = '';
      
      await agent.stream(
        request.messages[request.messages.length - 1]!.content,
        (token) => {
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
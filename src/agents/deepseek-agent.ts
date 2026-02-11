import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';

export interface DeepSeekAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AgentResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class DeepSeekAgent {
  private model: BaseChatModel;
  private systemPrompt: string;

  constructor(config: DeepSeekAgentConfig) {
    this.systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';
    
    this.model = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model || 'deepseek-chat',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      configuration: {
        baseURL: 'https://api.deepseek.com/v1',
      },
    });
  }

  async chat(messages: BaseMessage[]): Promise<AgentResponse> {
    try {
      const response = await this.model.invoke([
        new SystemMessage(this.systemPrompt),
        ...messages,
      ]);

      return {
        content: response.content as string,
      };
    } catch (error) {
      console.error('Error in DeepSeek agent chat:', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generate(prompt: string): Promise<AgentResponse> {
    return this.chat([new HumanMessage(prompt)]);
  }

  async stream(prompt: string, onToken: (token: string) => void): Promise<void> {
    try {
      const stream = await this.model.stream([
        new SystemMessage(this.systemPrompt),
        new HumanMessage(prompt),
      ]);

      for await (const chunk of stream) {
        if (chunk.content) {
          onToken(chunk.content as string);
        }
      }
    } catch (error) {
      console.error('Error in DeepSeek agent stream:', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }
}

export class DeepSeekR1Agent extends DeepSeekAgent {
  constructor(config: DeepSeekAgentConfig) {
    super({
      ...config,
      model: config.model || 'deepseek-reasoner',
      systemPrompt: config.systemPrompt || 'You are DeepSeek-R1, a reasoning-focused AI assistant. Think step by step and provide detailed reasoning before giving your final answer.',
    });
  }

  async reason(prompt: string, steps: number = 3): Promise<AgentResponse> {
    const reasoningPrompt = `Please reason through this problem in ${steps} steps before giving your final answer:\n\n${prompt}`;
    
    return this.generate(reasoningPrompt);
  }

  async chainOfThought(prompt: string): Promise<AgentResponse> {
    const cotPrompt = `Let's think step by step. ${prompt}`;
    
    return this.generate(cotPrompt);
  }
}
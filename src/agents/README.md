# DeepSeek Agents with LangChain

This module provides DeepSeek AI agents built with LangChain and TypeScript.

## Features

- **DeepSeekAgent**: Standard DeepSeek chat model integration
- **DeepSeekR1Agent**: Specialized reasoning agent with chain-of-thought capabilities
- **Streaming support**: Real-time token streaming
- **TypeScript**: Fully typed with proper interfaces
- **LangChain integration**: Built on top of LangChain framework

## Installation

Add to your `.env` file:
```bash
DEEPSEEK_API_KEY=your_api_key_here
```

## Usage

### Basic Agent

```typescript
import { DeepSeekAgent } from './agents/deepseek-agent.js';

const agent = new DeepSeekAgent({
  apiKey: process.env['DEEPSEEK_API_KEY']!,
  temperature: 0.7,
  maxTokens: 1000,
});

const response = await agent.generate('What is the capital of France?');
console.log(response.content);
```

### R1 Reasoning Agent

```typescript
import { DeepSeekR1Agent } from './agents/deepseek-agent.js';

const r1Agent = new DeepSeekR1Agent({
  apiKey: process.env['DEEPSEEK_API_KEY']!,
  temperature: 0.3,
  maxTokens: 1500,
});

// Chain of thought reasoning
const response = await r1Agent.chainOfThought(
  'A farmer has 17 sheep. All but 9 die. How many are left?'
);

// Multi-step reasoning
const reasonedResponse = await r1Agent.reason(
  'If a train travels at 60 km/h for 2 hours, then at 80 km/h for 1.5 hours, what is the total distance traveled?',
  3 // Number of reasoning steps
);
```

### Streaming

```typescript
await agent.stream(
  'Explain quantum computing in simple terms',
  (token) => {
    process.stdout.write(token);
  }
);
```

### Chat with History

```typescript
import { HumanMessage, AIMessage } from '@langchain/core/messages';

const messages = [
  new HumanMessage('What is the capital of France?'),
  new AIMessage('The capital of France is Paris.'),
  new HumanMessage('What is its population?'),
];

const response = await agent.chat(messages);
```

## API Reference

### DeepSeekAgent

```typescript
interface DeepSeekAgentConfig {
  apiKey: string;
  model?: string; // Default: 'deepseek-chat'
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 1000
  systemPrompt?: string; // Default: 'You are a helpful AI assistant.'
}

class DeepSeekAgent {
  constructor(config: DeepSeekAgentConfig);
  
  async generate(prompt: string): Promise<AgentResponse>;
  async chat(messages: BaseMessage[]): Promise<AgentResponse>;
  async stream(prompt: string, onToken: (token: string) => void): Promise<void>;
  updateSystemPrompt(newPrompt: string): void;
  getSystemPrompt(): string;
}
```

### DeepSeekR1Agent

Extends `DeepSeekAgent` with:
- Default model: `deepseek-reasoner`
- Specialized system prompt for reasoning
- Additional methods: `reason()` and `chainOfThought()`

## Examples

Run the examples:
```bash
# Basic usage
npx tsx src/agents/examples/basic-usage.ts

# Streaming
npx tsx src/agents/examples/streaming-example.ts
```

## Configuration

### Environment Variables
- `DEEPSEEK_API_KEY`: Your DeepSeek API key

### Model Options
- `deepseek-chat`: Standard chat model
- `deepseek-reasoner`: R1 reasoning model
- Other DeepSeek models as available

## Notes

- The agent uses the DeepSeek API endpoint: `https://api.deepseek.com/v1`
- Ensure you have sufficient API credits
- Rate limiting and usage policies apply per DeepSeek's terms
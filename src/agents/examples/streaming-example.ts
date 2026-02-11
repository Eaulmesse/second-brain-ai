import { DeepSeekAgent } from '../deepseek-agent.js';
import 'dotenv/config';

async function main() {
  const apiKey = process.env['DEEPSEEK_API_KEY'];
  
  if (!apiKey) {
    console.error('Please set DEEPSEEK_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('=== Streaming Example ===\n');

  const agent = new DeepSeekAgent({
    apiKey,
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: 'You are a helpful assistant that explains concepts clearly.',
  });

  console.log('Streaming response for: "Explain quantum computing in simple terms"\n');
  console.log('Response: ');

  await agent.stream(
    'Explain quantum computing in simple terms',
    (token) => {
      process.stdout.write(token);
    }
  );

  console.log('\n\nStreaming complete!');
}

main().catch(console.error);
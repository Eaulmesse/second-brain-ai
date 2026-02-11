import { DeepSeekAgent, DeepSeekR1Agent } from '../deepseek-agent.js';
import 'dotenv/config';

async function main() {
  const apiKey = process.env['DEEPSEEK_API_KEY'];
  
  if (!apiKey) {
    console.error('Please set DEEPSEEK_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('=== Basic DeepSeek Agent Example ===\n');

  const basicAgent = new DeepSeekAgent({
    apiKey,
    temperature: 0.7,
    maxTokens: 500,
  });

  const response = await basicAgent.generate(
    'What is the capital of France?'
  );

  console.log('Basic Agent Response:');
  console.log(response.content);
  console.log('\n' + '='.repeat(50) + '\n');

  console.log('=== DeepSeek R1 Agent Example ===\n');

  const r1Agent = new DeepSeekR1Agent({
    apiKey,
    temperature: 0.3,
    maxTokens: 1000,
  });

  const r1Response = await r1Agent.reason(
    'If a train travels at 60 km/h for 2 hours, then at 80 km/h for 1.5 hours, what is the total distance traveled?'
  );

  console.log('R1 Agent Response:');
  console.log(r1Response.content);
  console.log('\n' + '='.repeat(50) + '\n');

  console.log('=== Chain of Thought Example ===\n');

  const cotResponse = await r1Agent.chainOfThought(
    'A farmer has 17 sheep. All but 9 die. How many are left?'
  );

  console.log('Chain of Thought Response:');
  console.log(cotResponse.content);
}

main().catch(console.error);
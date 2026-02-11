import fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { chatRoutes } from './routes/chat-routes.js'
import { documentRoutes } from './routes/document-routes.js'
import { setupErrorHandler } from './middleware/error-handler.js'
import 'dotenv/config'

const server = fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

setupErrorHandler(server)
server.register(chatRoutes)
server.register(documentRoutes)

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

server.get('/', async () => {
  return { 
    message: 'Fastify TypeScript API with DeepSeek LLM',
    endpoints: {
      chat: 'POST /api/chat',
      chatStream: 'POST /api/chat/stream',
      chatHealth: 'GET /api/chat/health',
      health: 'GET /health'
    }
  }
})

const start = async () => {
  try {
    const port = parseInt(process.env['PORT'] || '3000')
    const host = process.env['HOST'] || '0.0.0.0'
    
    await server.listen({ port, host })
    console.log(`Server running at http://${host}:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
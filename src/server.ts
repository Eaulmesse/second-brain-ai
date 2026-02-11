import fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const server = fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

server.get('/', async () => {
  return { message: 'Fastify TypeScript API' }
})

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' })
    console.log(`Server running at http://localhost:3000`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
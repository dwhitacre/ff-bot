import 'dotenv/config'
import Hapi from '@hapi/hapi'
import { resolve } from 'path'

import routes from './routes'
import { commands, groupme, log, openapi, sheets } from './plugins'

async function start(): Promise<void> {
  const server = new Hapi.Server({
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 3001,
    routes: {
      files: {
        relativeTo: resolve(__dirname, '../public'),
      },
    },
  })

  await log(server)
  await openapi(server)
  await groupme(server)
  await sheets(server)
  await commands(server)

  routes(server)

  process.on('SIGTERM', async function () {
    server.logger.warn('SIGTERM received, shutting down.')
    await server.stop()
    server.logger.warn('Server shutdown. Exiting..')
    process.exit(0)
  })

  await server.start()
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})

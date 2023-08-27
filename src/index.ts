import 'dotenv/config'
import Hapi, { ServerRegisterPluginObject } from '@hapi/hapi'
import { resolve } from 'path'

import routes from './routes'
import GroupMe from './clients/groupme'
import Sheets from './clients/sheets'

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

  await server.register({
    plugin: await import('hapi-pino'),
    options: {
      redact: ['*.headers', '*.request', '*.response'],
      level: process.env.LOG_LEVEL ?? 'info',
      logPayload: !!process.env.LOG_PAYLOAD,
      logRouteTags: true,
      mergeHapiLogData: true,
      ignorePaths: ['/health'],
    },
  } as ServerRegisterPluginObject<unknown>)

  await server.register(await import('@hapi/inert'))
  await server.register(await import('@hapi/vision'))

  await server.register({
    plugin: await import('hapi-swagger'),
    options: {
      info: {
        title: 'Fantasy Football Bot',
      },
      documentationPage: false,
    },
  })

  new GroupMe(server)
  new Sheets(server)
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

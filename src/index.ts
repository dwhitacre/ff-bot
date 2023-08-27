import 'dotenv/config'
import Hapi, { ServerRegisterPluginObject } from '@hapi/hapi'
import { resolve } from 'path'
import config from 'config'

import routes from './routes'
import GroupMe from './clients/groupme'

async function start(): Promise<void> {
  const server = new Hapi.Server({
    host: config.get('host') || 'localhost',
    port: config.get('port') || 3001,
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
      level: config.get('log.level') ?? 'info',
      logPayload: !!config.get('log.payload'),
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

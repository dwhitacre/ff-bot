import { Server, ServerRegisterPluginObject } from '@hapi/hapi'

export default async function register(server: Server) {
  await server.register({
    plugin: await import('hapi-pino'),
    options: {
      redact: ['*.headers', '*.request', '*.response'],
      level: process.env.LOG_LEVEL ?? 'info',
      logPayload: !!process.env.LOG_PAYLOAD,
      logRouteTags: true,
      mergeHapiLogData: true,
    },
  } as ServerRegisterPluginObject<unknown>)
}

export const dependencies = []
export const name = 'log'

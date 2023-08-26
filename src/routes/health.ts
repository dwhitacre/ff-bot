import { Server } from '@hapi/hapi'

export default function register(server: Server): void {
  server.route({
    method: 'GET',
    path: '/health',
    options: {
      handler: async (): Promise<{
        status: string
      }> => {
        await server.db().ping()
        return { status: 'ok' }
      },
      description: 'The health of the server.',
      notes: 'GET the health of the server.',
      tags: ['api', 'health'],
    },
  })
}

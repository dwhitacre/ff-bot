import { Server } from '@hapi/hapi'

export default function register(server: Server): void {
  server.route({
    method: 'GET',
    path: '/health',
    options: {
      handler: (): {
        status: string
      } => {
        return { status: 'ok' }
      },
      description: 'The health of the server.',
      notes: 'GET the health of the server.',
      tags: ['api', 'health'],
    },
  })
}

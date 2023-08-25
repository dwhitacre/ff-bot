import { Server } from '@hapi/hapi'

export default function register(server: Server): void {
  server.route({
    method: '*',
    path: '/{param*}',
    options: {
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true,
        },
      },
      description: 'The home page',
      notes: 'GET the home page',
      tags: ['home'],
    },
  })
}

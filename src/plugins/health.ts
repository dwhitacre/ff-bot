import { Request, ResponseToolkit, Server } from '@hapi/hapi'
import { handler } from '../routes/command'

export default async function register(server: Server) {
  server.route({
    method: 'GET',
    path: '/health',
    options: {
      handler: async function (request: Request, h: ResponseToolkit) {
        request.params.commandId = 'health'
        request.query.apikey = process.env.APIKEY
        request.query.sheetId = 'defaults'
        return handler(request, h)
      },
      description: 'Runs a command by commandId',
      notes: 'Only posts to groupme if botId and token are provided as query params.',
      tags: ['api', 'command'],
    },
  })
}

import Boom from '@hapi/boom'
import { Server } from '@hapi/hapi'

export default async function register(server: Server) {
  server.auth.scheme('apikey', function (_, __) {
    return {
      authenticate: async function (request, h) {
        const apikey = request.query.apikey
        const hasApikey = apikey === process.env.APIKEY
        if (!hasApikey) throw Boom.forbidden(undefined, 'apikey')
        return h.authenticated({ credentials: {} })
      },
    }
  })
  server.auth.strategy('apikey', 'apikey')
}

export const dependencies = []
export const name = 'auth'

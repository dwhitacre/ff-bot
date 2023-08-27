import { Server, Request, ResponseToolkit } from '@hapi/hapi'
import { handler } from './command'

export interface GroupMeWebhook {
  text?: string
  system?: boolean
  sender_type?: 'bot' | string
  [_: string]: unknown
}

export default function register(server: Server): void {
  server.route({
    method: 'POST',
    path: '/webhook/groupme',
    options: {
      handler: async function (request: Request, h: ResponseToolkit) {
        const hasApikey = request.query.apikey === process.env.APIKEY
        if (!hasApikey) return h.response({ hasApikey }).code(403)

        if (typeof request.payload !== 'object') return h.response({ message: 'payload is not json' })
        const payload = request.payload as GroupMeWebhook

        if (!payload.text) return h.response({ message: 'payload is missing text field', payload })
        if (payload.system) return h.response({ message: 'payload is a system message', payload })
        if (payload.sender_type === 'bot') return h.response({ message: 'payload is from a bot', payload })

        const commandId = request.server.commands().getCommandId(payload.text ?? '')
        if (!commandId) return h.response({ message: 'payload text has no command', payload })

        request.params.commandId = commandId
        return handler(request, h)
      },
      description: 'A webhook from GroupMe',
      tags: ['api', 'webhook'],
    },
  })
}

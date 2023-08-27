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
        if (typeof request.payload !== 'object') return h.response({ message: 'payload is not json' })
        const payload = request.payload as GroupMeWebhook

        if (!payload.text) return h.response({ message: 'payload is missing text field', payload })
        if (payload.system) return h.response({ message: 'payload is a system message', payload })
        if (payload.sender_type === 'bot') return h.response({ message: 'payload is from a bot', payload })
        if (!payload.text.includes('!')) return h.response({ message: 'no commands', payload })

        const commandId = request.server.commands().getCommandId(payload.text)
        request.server.logger.debug({ payload, commandId }, '! match')
        if (!commandId) return h.response({ message: 'no commandId found', payload })

        request.params.commandId = commandId
        return handler(request, h)
      },
      description: 'A webhook from GroupMe',
      tags: ['api', 'webhook'],
    },
  })
}

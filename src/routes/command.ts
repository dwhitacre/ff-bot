import { Server, Request, ResponseToolkit } from '@hapi/hapi'

export default function register(server: Server): void {
  server.route({
    method: 'GET',
    path: '/command/{commandId}',
    options: {
      handler: async function (request: Request, h: ResponseToolkit) {
        const command = await request.server.commands().get(request.params.commandId)

        if (!command) return h.response({ message: 'no matching command', commandId: request.params.commandId })
        request.server.logger.debug({ command }, 'command found')

        if (!command.enabled) return h.response({ message: 'command not enabled', commandId: request.params.commandId })
        request.server.logger.debug({ command }, 'command enabled, running..')

        if (command.message?.includes('!fn:')) {
          request.server.logger.debug({ command }, 'command includes !fn:')

          const match = command.message?.match(/.*(\w|^)!fn:(?<fnName>.*)(\w|$)?/)
          const { fnName } = match?.groups || {}
          request.server.logger.debug({ command, match, fnName }, '!fn: match')

          if (fnName) command.message = await request.server.commands().call(fnName)
        }

        const botId = request.query.botId
        const hasToken = request.query.token === process.env.APIKEY

        if (botId && hasToken) {
          request.server.logger.debug({ command }, 'has bot id and token, posting to groupme')
          await request.server.groupme().botPost(botId, command.message, command.pictureurl)
        }

        return h.response({ botId, hasToken, command, commandId: request.params.commandId })
      },
      description: 'Runs a command by commandId',
      notes: 'Only posts to groupme if botId and token are provided as query params.',
      tags: ['api', 'command'],
    },
  })
}

import { Server, Request, ResponseToolkit } from '@hapi/hapi'

export async function handler(request: Request, h: ResponseToolkit) {
  const { botId, apikey, sheetId } = request.query
  const hasApikey = apikey === process.env.APIKEY

  if (!hasApikey) return h.response({ hasApikey }).code(403)

  const command = await request.server.commands().get(`!${request.params.commandId}`, sheetId)
  request.server.logger.debug({ botId, hasApikey, sheetId, command }, 'command request info')

  if (!command?.id) return h.response({ message: 'no matching command', commandId: request.params.commandId })
  request.server.logger.debug({ command }, 'command found')

  if (!command.enabled) return h.response({ message: 'command not enabled', commandId: request.params.commandId })
  request.server.logger.debug({ command }, 'command enabled, running..')

  if (botId) {
    request.server.logger.debug({ command }, 'has botId, posting to groupme')

    try {
      await request.server.groupme().botPost(botId, command.message, command.pictureurl)
    } catch (err) {
      request.server.logger.error(err, 'failed to botPost')
    }
  }

  return h.response({ botId, hasApikey, sheetId, command, commandId: request.params.commandId })
}

export default function register(server: Server): void {
  server.route({
    method: 'GET',
    path: '/command/{commandId}',
    options: {
      handler,
      description: 'Runs a command by commandId',
      notes: 'Only posts to groupme if botId is provided as query params.',
      tags: ['api', 'command'],
    },
  })

  server.route({
    method: 'GET',
    path: '/command',
    options: {
      handler: async function (request: Request, h: ResponseToolkit) {
        const { sheetId } = request.query
        const commands = await request.server.commands().getAll(sheetId)
        return h.response({ commands, sheetId })
      },
      description: 'Lists all commands',
      notes: 'Just returns all the commands and their metadata',
      tags: ['api', 'command'],
    },
  })
}

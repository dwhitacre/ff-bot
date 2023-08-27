import { Server, Request, ResponseToolkit } from '@hapi/hapi'

export interface Command {
  id: string
  message?: string
  pictureurl?: string
  desc?: string
  enabled: boolean
  hidden: boolean
}

export const defaultCommands: Array<Command> = [
  {
    id: 'health',
    message: 'I am running!',
    desc: 'Just a health check for the bot.',
    enabled: true,
    hidden: true,
  },
]

export async function get(request: Request, commandId?: string) {
  const commands = defaultCommands.concat(await request.server.sheets().commands())

  if (commandId) return commands.find((command) => command.id === commandId)
  return commands
}

export default function register(server: Server): void {
  server.route({
    method: 'GET',
    path: '/command/{commandId}',
    options: {
      handler: async function (request: Request, h: ResponseToolkit) {
        const commands = defaultCommands.concat(await request.server.sheets().commands())
        const command = commands.find((command) => command.id === request.params.commandId)

        if (!command) return h.response({ message: 'no matching command', commandId: request.params.commandId })
        request.server.logger.debug({ command }, 'command found')

        if (!command.enabled) return h.response({ message: 'command not enabled', commandId: request.params.commandId })
        request.server.logger.debug({ command }, 'command enabled, running..')

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

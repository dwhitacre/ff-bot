import { Server } from '@hapi/hapi'

import packageJson from '../../package.json'

export interface Command {
  id: string
  message?: string
  pictureurl?: string
  desc?: string
  enabled: boolean
  hidden: boolean
}

export const defaults = [
  {
    id: 'health',
    message: 'I am running!',
    desc: 'Just a health check for the bot.',
    enabled: true,
    hidden: true,
  },
  {
    id: 'version',
    message: `Current Version: ${packageJson.version}`,
    desc: "The bot's version.",
    enabled: true,
    hidden: true,
  },
  {
    id: 'whatsnew',
    message: 'The bot is back! Again! This time sponsored by the Cleveland Browns.',
    desc: 'What is new in the latest update.',
    enabled: true,
    hidden: false,
  },
  {
    id: 'help',
    message: 'Type !list to see the available commands. Use the commands anywhere in your message, and I will respond!',
    desc: 'Helpful information on using commands.',
    enabled: true,
    hidden: false,
  },
]

export default class Commands {
  readonly server: Server
  readonly defaults: Array<Command> = defaults

  constructor(server: Server) {
    this.server = server

    server.decorate('server', 'commands', (): Commands => {
      return this
    })
  }

  async get(commandId: string) {
    const commands = await this.getAll()
    return commands.find((command) => command.id === commandId)
  }

  async getAll() {
    return this.defaults.concat(await this.server.sheets().commands())
  }
}

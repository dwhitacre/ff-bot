import { Server } from '@hapi/hapi'

import Commands from './commands'
import routes from './routes'

export { default as Commands, Command } from './commands'
export { handler } from './routes'

export default async function register(server: Server) {
  const commands = new Commands(server)
  server.decorate('server', 'commands', (): Commands => {
    return commands
  })
  routes(server)
}

export const dependencies = ['log', 'auth', 'groupme', 'sheets', 'functions']
export const name = 'commands'

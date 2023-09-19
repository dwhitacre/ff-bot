import { Server } from '@hapi/hapi'
import Commands from './commands'

export { default as Commands, Command } from './commands'
export { default as Fns, Fn } from './fns'

export default async function register(server: Server) {
  const commands = new Commands(server)
  server.decorate('server', 'commands', (): Commands => {
    return commands
  })
}

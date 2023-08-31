import { Server } from '@hapi/hapi'
import Commands from '../clients/commands'

export default async function register(server: Server) {
  const commands = new Commands(server)
  server.decorate('server', 'commands', (): Commands => {
    return commands
  })
}

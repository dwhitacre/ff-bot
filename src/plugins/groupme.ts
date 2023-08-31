import { Server } from '@hapi/hapi'
import GroupMe from '../clients/groupme'

export default async function register(server: Server) {
  const groupme = new GroupMe(server)
  server.decorate('server', 'groupme', (): GroupMe => {
    return groupme
  })
}

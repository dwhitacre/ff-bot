import { Server } from '@hapi/hapi'

import GroupMe from './groupme'
import routes from './routes'

export { default as GroupMe } from './groupme'

export default async function register(server: Server) {
  const groupme = new GroupMe(server)
  server.decorate('server', 'groupme', (): GroupMe => {
    return groupme
  })
  routes(server)
}

export const dependencies = ['log', 'auth', 'commands']
export const name = 'groupme'

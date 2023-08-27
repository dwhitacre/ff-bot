import { Server } from '@hapi/hapi'

import command from './command'
import health from './health'
import home from './home'
import webhook from './webhook'

export default function register(server: Server): void {
  command(server)
  health(server)
  home(server)
  webhook(server)
}

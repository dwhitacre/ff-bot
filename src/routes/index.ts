import { Server } from '@hapi/hapi'

import command from './command'
import webhook from './webhook'

export default function register(server: Server): void {
  command(server)
  webhook(server)
}

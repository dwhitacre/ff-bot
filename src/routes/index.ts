import { Server } from '@hapi/hapi'

import command from './command'
import home from './home'

export default function register(server: Server): void {
  command(server)
  home(server)
}

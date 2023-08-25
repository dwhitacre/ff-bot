import { Server } from '@hapi/hapi'

import health from './health'
import home from './home'

export default function register(server: Server): void {
  health(server)
  home(server)
}

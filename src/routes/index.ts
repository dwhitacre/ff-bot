import { Server } from '@hapi/hapi'

import webhook from './webhook'

export default function register(server: Server): void {
  webhook(server)
}

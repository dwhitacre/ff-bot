import { Server } from '@hapi/hapi'
import Wreck from '@hapi/wreck'
import pack from '../../package.json'

export default class GroupMe {
  readonly server: Server
  readonly baseUrl: string
  readonly client: typeof Wreck

  constructor(server: Server, { baseUrl }: { baseUrl: string }) {
    this.server = server
    this.baseUrl = baseUrl

    this.client = Wreck.defaults({
      baseUrl: this.baseUrl,
      headers: {
        'User-Agent': `${pack.name}:${pack.version}`,
      },
    })
  }

  async call(method: string, url: string, options: { [_: string]: unknown }) {
    try {
      return this.client.request(method.toUpperCase(), url, options)
    } catch (err) {
      this.server.logger.error(err)
      return false
    }
  }
}

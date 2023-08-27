import { Server } from '@hapi/hapi'
import Wreck from '@hapi/wreck'
import pack from '../../package.json'

export default class GroupMe {
  readonly server: Server
  readonly baseUrl: string = process.env.GROUPME_BASEURL ?? 'https://api.groupme.com/v3/'
  readonly client: typeof Wreck

  constructor(server: Server) {
    this.server = server

    this.client = Wreck.defaults({
      baseUrl: this.baseUrl,
      headers: {
        'User-Agent': `${pack.name}:${pack.version}`,
      },
    })

    server.decorate('server', 'groupme', (): GroupMe => {
      return this
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

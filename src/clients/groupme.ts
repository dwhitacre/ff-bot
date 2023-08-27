import { Server } from '@hapi/hapi'
import Wreck from '@hapi/wreck'
import pack from '../../package.json'

export default class GroupMe {
  readonly server: Server
  readonly baseUrl: string = process.env.GROUPME_BASEURL ?? 'https://api.groupme.com/v3/'
  readonly client: typeof Wreck

  constructor(server: Server) {
    this.server = server

    if (!process.env.GROUPME_TOKEN) throw new Error('missing GROUPME_TOKEN')

    this.client = Wreck.defaults({
      baseUrl: this.baseUrl,
      headers: {
        'User-Agent': `${pack.name}:${pack.version}`,
        'X-Access-Token': process.env.GROUPME_TOKEN,
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

  async botPost(botId: string, text: string, url: string, options = {}) {
    try {
      const response = await this.call('post', 'bots/post', {
        payload: {
          bot_id: botId,
          text,
          picture_url: url,
        },
        ...options,
      })
      if (!response) throw new Error('groupme no response')

      this.server.logger.debug({ status: response.statusCode, statusText: response.statusMessage }, 'groupme bots/post')
      return { response }
    } catch (err) {
      this.server.logger.error(err, 'groupme failed to botPost')
      return false
    }
  }
}

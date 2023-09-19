import { Request, Server } from '@hapi/hapi'

import type { Command } from '../commands/commands'
import * as info from './info'
import * as list from './list'
import * as unknown from './unknown'

export const fns = [list, info, unknown]

export interface Fn {
  name: string
  fn: (request: Request) => string
}

export default class Fns {
  readonly server: Server
  readonly prefix = '!fn:'
  readonly regex = /(\s|^)!fn:(?<fnName>\w+)(\s|$)/

  constructor(server: Server) {
    this.server = server
  }

  findName(message = '') {
    const match = message.match(this.regex)
    const { fnName } = match?.groups || { fnName: '' }
    return fnName
  }

  fromCommand(command: Command) {
    const name = this.findName(command.message)
    return fns.find((fn) => name == fn.name) ?? unknown
  }

  async getMessage(command: Command, request: Request) {
    if (!command.message) return ''

    const fn = this.fromCommand(command)
    return command.message.replace(`!fn:${fn.name}`, await fn.fn.call(this, request))
  }
}

import { Server } from '@hapi/hapi'

import packageJson from '../../../package.json'
import type { Command } from './commands'

export interface Fn {
  name: string
  fn: (sheetId: string) => string
}

export default class Fns {
  readonly server: Server
  readonly prefix = '!fn:'
  readonly regex = /(\s|^)!fn:(?<fnName>\w+)(\s|$)/

  readonly unknownFn = {
    name: 'unknown',
    fn: this.unknown,
  }
  readonly fns = [
    {
      name: 'list',
      fn: this.list,
    },
    {
      name: 'info',
      fn: this.info,
    },
    this.unknownFn,
  ]

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
    return this.fns.find((fn) => name == fn.name) ?? this.unknownFn
  }

  async getMessage(command: Command, sheetId?: string) {
    if (!command.message) return ''

    const fn = this.fromCommand(command)
    return command.message.replace(`!fn:${fn.name}`, await fn.fn.call(this, sheetId))
  }

  async list(sheetId?: string) {
    const commands = Array.from(await this.server.commands().getAll(sheetId))
    commands.sort((a, b) => a.id.localeCompare(b.id))
    return commands
      .filter((command) => !command.hidden && command.enabled)
      .reduce((message, command) => (message += `,!${command.id}`), '')
      .slice(1)
  }

  async info(sheetId?: string) {
    return `Version: ${packageJson.version}
SheetId: ${sheetId ?? 'defaults'}
    `
  }

  async unknown(_?: string) {
    return '__unknown_fn__'
  }
}

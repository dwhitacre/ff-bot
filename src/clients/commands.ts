import { Server } from '@hapi/hapi'

import packageJson from '../../package.json'
import { SheetsRow } from './sheets'

export interface Fn {
  name: string
  fn: (sheetId: string) => string
}

export interface Command {
  id: string
  message?: string
  pictureurl?: string
  desc?: string
  enabled: boolean
  hidden: boolean
}

export class Fns {
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

export default class Commands {
  readonly server: Server
  readonly prefix = '!'
  readonly regex = /(\s|^)!(?<commandId>\w+)(\s|$)/
  readonly fns: Fns

  constructor(server: Server) {
    this.server = server
    this.fns = new Fns(this.server)
  }

  fromSheetsRow(row: SheetsRow): Command | null {
    if (!row?.command) return null
    if (!row?.message && !row?.pictureurl) return null

    return {
      id: row.command,
      message: row.message ?? '',
      pictureurl: row.pictureurl ?? '',
      desc: row.desc ?? '',
      enabled: row.disabled !== 'x',
      hidden: row.hidden === 'x',
    }
  }

  getCommandId(text = '') {
    const match = text.match(this.regex)
    const { commandId } = match?.groups || { commandId: '' }
    return commandId
  }

  async getAll(sheetId?: string) {
    const rows = await this.server.sheets().get(sheetId)
    return rows.map((row) => this.fromSheetsRow(row)).filter((row) => row != null) as Array<Command>
  }

  async getRaw(commandId: string, sheetId?: string) {
    const commands = await this.getAll(sheetId)
    return Object.assign(
      {},
      commands.find((command) => command.id === commandId),
    )
  }

  async get(text?: string, sheetId?: string) {
    const command = await this.getRaw(this.getCommandId(text), sheetId)
    if (!command) return null
    if (!command.message) return command
    if (!command.enabled) return command

    command.message = await this.fns.getMessage(command, sheetId)
    return command
  }
}

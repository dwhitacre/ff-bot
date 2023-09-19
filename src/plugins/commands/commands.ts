import { Server, Request } from '@hapi/hapi'

import { SheetsRow } from '../sheets'

export interface Command {
  id: string
  message?: string
  pictureurl?: string
  desc?: string
  enabled: boolean
  hidden: boolean
}

export default class Commands {
  readonly server: Server
  readonly prefix = '!'
  readonly regex = /(\s|^)!(?<commandId>\w+)(\s|$)/

  constructor(server: Server) {
    this.server = server
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

  async get(request: Request, text?: string, sheetId?: string) {
    const command = await this.getRaw(this.getCommandId(text), sheetId)
    if (!command) return null
    if (!command.message) return command
    if (!command.enabled) return command

    command.message = await this.server.fns().getMessage(command, request)
    return command
  }
}

import { Server } from '@hapi/hapi'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { existsSync } from 'fs'

export interface SheetsRow {
  command?: string
  message?: string
  pictureurl?: string
  desc?: string
  disabled?: string
  hidden?: string
}

export default class Sheets {
  readonly server: Server
  readonly jwt: JWT
  readonly dir = resolve(__dirname, '../sheets')
  readonly expiry: number = parseInt(process.env.GOOGLE_SHEETS_CACHE_EXPIRY ?? '60000')
  readonly scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']

  commandsCache: { [_: string]: { cache: Array<SheetsRow>; time: number } } = {}

  constructor(server: Server) {
    this.server = server

    if (!process.env.GOOGLE_SHEETS_EMAIL) throw new Error('missing GOOGLE_SHEETS_EMAIL')
    if (!process.env.GOOGLE_SHEETS_KEY) throw new Error('missing GOOGLE_SHEETS_KEY')

    this.jwt = new JWT({
      email: process.env.GOOGLE_SHEETS_EMAIL,
      key: process.env.GOOGLE_SHEETS_KEY,
      scopes: this.scopes,
    })

    server.decorate('server', 'sheets', (): Sheets => {
      return this
    })
  }

  async loadFromFile(sheetId: string) {
    const filePath = resolve(this.dir, `${sheetId}.json`)
    this.server.logger.debug({ sheetId, filePath }, 'Sheets loading commands from file')

    try {
      if (!existsSync(filePath)) throw new Error('file does not exist')
      const fileContent = await readFile(filePath, { encoding: 'utf-8' })
      this.commandsCache[sheetId] = { cache: JSON.parse(fileContent).rows ?? [], time: Date.now() }
    } catch (err) {
      this.server.logger.warn(err, 'Sheets failed to load commands from file')
      this.commandsCache[sheetId] = { cache: [], time: Date.now() }
    }
  }

  async loadFromSheets(sheetId: string) {
    this.server.logger.debug({ sheetId }, 'Sheets loading commands from sheets')

    try {
      const doc = new GoogleSpreadsheet(sheetId, this.jwt)
      await doc.loadInfo()
      const rows = (await doc.sheetsByTitle['Commands']?.getRows()) ?? []
      this.commandsCache[sheetId] = { cache: rows.map((row) => row.toObject()), time: Date.now() }
    } catch (err) {
      this.server.logger.warn(err, 'Sheets failed to load commands from sheets')
      this.commandsCache[sheetId] = { cache: [], time: Date.now() }
    }
  }

  async load(sheetId: string) {
    const filePath = resolve(this.dir, `${sheetId}.json`)
    existsSync(filePath) ? await this.loadFromFile(sheetId) : await this.loadFromSheets(sheetId)
    this.server.logger.debug({ commandsCache: this.commandsCache }, 'Sheets loaded')
  }

  hasExpired(sheetId: string) {
    const time = this.commandsCache[sheetId]?.time ?? 0
    const now = Date.now()
    const expired = this.expiry < now - time
    this.server.logger.debug({ expiry: this.expiry, now, time })
    return expired
  }

  has(sheetId: string) {
    return !!this.commandsCache[sheetId] && !this.hasExpired(sheetId)
  }

  async get(sheetId = 'defaults'): Promise<Array<SheetsRow>> {
    if (!this.has(sheetId)) await this.load(sheetId)
    return this.commandsCache[sheetId].cache
  }
}

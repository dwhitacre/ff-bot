import { Server } from '@hapi/hapi'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet'

const scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']

export interface Command {
  id: string
  text: string
  url: string
  desc: string
  enabled: boolean
  hidden: boolean
}

export default class Sheets {
  readonly server: Server
  readonly doc: GoogleSpreadsheet
  readonly expiry: number = parseInt(process.env.GOOGLE_SHEETS_CACHE_EXPIRY ?? '60000')
  cache: Array<GoogleSpreadsheetRow> = []
  time?: number = undefined

  constructor(server: Server) {
    this.server = server

    if (!process.env.GOOGLE_SHEETS_ID) throw new Error('missing GOOGLE_SHEETS_ID')
    if (!process.env.GOOGLE_SHEETS_EMAIL) throw new Error('missing GOOGLE_SHEETS_EMAIL')
    if (!process.env.GOOGLE_SHEETS_KEY) throw new Error('missing GOOGLE_SHEETS_KEY')

    this.doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      new JWT({
        email: process.env.GOOGLE_SHEETS_EMAIL,
        key: process.env.GOOGLE_SHEETS_KEY,
        scopes,
      }),
    )

    server.decorate('server', 'sheets', (): Sheets => {
      return this
    })
  }

  async getRows() {
    await this.doc.loadInfo()
    return this.doc.sheetsByTitle['Commands']?.getRows() ?? []
  }

  async getRowsWithCache() {
    if (!this.time || (this.time && this.expiry < Date.now() - this.time)) {
      this.time = Date.now()
      try {
        await this.doc.loadInfo()
        return (this.cache = await this.getRows())
      } catch (err) {
        this.server.logger.error(err, 'error: sheets rows')
      }
    }

    this.server.logger.debug({ cache: this.cache }, 'using sheets cache')
    return this.cache
  }

  async commands() {
    const rows = await this.getRowsWithCache()
    return rows.map((row) => this.parseCommand(row.toObject())).filter((row) => row == null)
  }

  parseCommand(row: { [_: string]: string }): Command | null {
    if (!row?.message && !row?.pictureurl) return null
    return {
      id: row.command,
      text: row.message,
      url: row.pictureurl,
      desc: row.desc,
      enabled: row.disabled !== 'x',
      hidden: row.hidden === 'x',
    }
  }
}

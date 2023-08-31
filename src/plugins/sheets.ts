import { Server } from '@hapi/hapi'
import Sheets from '../clients/sheets'

export default async function register(server: Server) {
  const sheets = new Sheets(server)
  server.decorate('server', 'sheets', (): Sheets => {
    return sheets
  })
}

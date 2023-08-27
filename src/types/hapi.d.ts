import Sheets from '../clients/sheets'
import GroupMe from '../clients/groupme'
import Commands from '../clients/commands'

declare module '@hapi/hapi' {
  interface Server {
    groupme(): GroupMe
    sheets(): Sheets
    commands(): Commands
  }
}

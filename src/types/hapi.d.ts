import Sheets from '../clients/sheets'
import GroupMe from '../clients/groupme'

declare module '@hapi/hapi' {
  interface Server {
    groupme(): GroupMe
    sheets(): Sheets
  }
}

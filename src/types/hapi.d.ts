import { Sheets } from '../plugins/sheets'
import { GroupMe } from '../plugins/groupme'
import { Commands } from '../plugins/commands'

declare module '@hapi/hapi' {
  interface Server {
    groupme(): GroupMe
    sheets(): Sheets
    commands(): Commands
  }
}

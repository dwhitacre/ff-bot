import Db from '../clients/db'
import GroupMe from '../clients/groupme'

declare module '@hapi/hapi' {
  interface Server {
    groupme(): GroupMe
    db(): Db
  }
}

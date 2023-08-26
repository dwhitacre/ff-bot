import { Server } from '@hapi/hapi'
import sql, { ConnectionPool, config } from 'mssql'

export default class Db {
  readonly server: Server
  readonly config: config
  pool?: ConnectionPool

  constructor(server: Server, config: config) {
    this.server = server
    this.config = config
  }

  async connect() {
    if (this.pool) return this.pool
    return (this.pool = await sql.connect(this.config))
  }

  ping() {
    return this.pool?.request().query('SELECT 1')
  }
}

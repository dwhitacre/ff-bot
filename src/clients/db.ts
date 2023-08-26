import { Server } from '@hapi/hapi'
import sql, { ConnectionPool, config } from 'mssql'

export default class Db {
  readonly server: Server
  readonly config: config = {
    user: 'sa',
    password: process.env.MSSQL_SA_PASSWORD,
    server: process.env.MSSQL_SERVER ?? 'localhost',
    database: process.env.MSSQL_DATABASE ?? 'ffbot',
    pool: {
      max: parseInt(process.env.MSSQL_POOL_MAX ?? '10'),
      min: parseInt(process.env.MSSQL_POOL_MIN ?? '0'),
      idleTimeoutMillis: parseInt(process.env.MSSQL_POOL_TIMEOUT ?? '30000'),
    },
    options: {
      encrypt: !!process.env.MSSQL_ENCRYPT,
      trustServerCertificate: !!process.env.MSSQL_TRUST_SERVER_CERTIFICATE,
    },
  }
  pool?: ConnectionPool

  constructor(server: Server) {
    this.server = server
    server.decorate('server', 'db', (): Db => {
      return this
    })
  }

  async connect() {
    if (this.pool) return this.pool
    return (this.pool = await sql.connect(this.config))
  }

  ping() {
    return this.pool?.request().query('SELECT 1')
  }
}

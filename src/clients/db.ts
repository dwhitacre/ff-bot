import { Server } from '@hapi/hapi'
import sql, { ConnectionPool, IResult, ISqlType, config } from 'mssql'

export interface Version {
  name: string
  dateApplied: Date
}

export interface Parameter {
  name: string
  type: ISqlType
  value: unknown
}

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

  query<T>(query: string, parameters: Array<Parameter> = []): Promise<IResult<T>> {
    const request = this.pool?.request()
    if (!request) throw new Error('failed to query')

    parameters.forEach((parameter) => request.input(parameter.name, parameter.type, parameter.value))
    return request.query(query)
  }

  async getOne<T>(query: string): Promise<T> {
    const result = await this.query<T>(query)
    if (!result.recordset[0]) throw new Error('failed to getOne')
    return result.recordset[0]
  }

  async version(): Promise<Version> {
    try {
      const version = await this.getOne<Version>('SELECT * FROM Versions WHERE dateApplied=(SELECT MAX(dateApplied) FROM Versions)')
      return version
    } catch (err) {
      return {
        name: '0.0.0',
        dateApplied: new Date(),
      }
    }
  }
}

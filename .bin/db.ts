import 'dotenv/config'

import Db from '../src/clients/db'
import { Server } from '@hapi/hapi'

function noop() {}

async function runDb(direction: string) {

}

async function run(): Promise<void> {
  if (!process.env.MSSQL_SA_PASSWORD) {
    throw new Error('Missing MSSQL_SA_PASSWORD env var')
  }
  const db = new Db({ decorate: noop } as unknown as Server)
  await db.connect()

  const direction = process.argv.at(2) as string 
  if (!['up', 'down'].includes(direction)) {
    throw new Error('db.ts <up/down>')
  }

  await runDb(direction)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

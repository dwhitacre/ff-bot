import 'dotenv/config'
import { readFile, readdir } from 'fs/promises'
import semverSort from 'semver-sort'
import { Server } from '@hapi/hapi'
import { resolve } from 'path'
import sql from 'mssql'

import Db from '../src/clients/db'

function noop() {}

const dbVersionsDir = resolve(__dirname, '../db/versions')

async function getVersions() {
  return (await readdir(dbVersionsDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

async function runDb(db: Db, direction: string) {
  const currentVersion = await db.version()
  const allVersions = await getVersions()
  semverSort.asc(allVersions)

  const cvIndex = allVersions.findIndex((version: string) => version == currentVersion.name)
  const nextVersion = allVersions.at(cvIndex + 1) ?? ''
  const prevVersion = allVersions[cvIndex - 1] ?? ''

  console.log(`
Current Version: ${currentVersion.name}
Next Version: ${nextVersion}
Previous Version: ${prevVersion}
  `)

  let results: Array<unknown> = []
  if ((direction === 'up' && nextVersion) || (direction === 'down' && prevVersion) || (direction === 'down' && currentVersion.name === '1.0.0')) {
    results.push(await db.query(await readFile(resolve(dbVersionsDir, direction === 'up' ? nextVersion : currentVersion.name, `${direction}.sql`), { encoding: 'utf-8'})))
    results.push(await db.query("INSERT INTO Versions (name) VALUES (@name)", [{name: 'name', type: sql.VarChar(), value: direction === 'up' ? nextVersion : prevVersion }]))
  } else {
    results = ['nothing to do']
  }
  console.log('Results:')
  console.log(results)
}

async function run(): Promise<void> {
  if (!process.env.MSSQL_SA_PASSWORD) {
    throw new Error('Missing MSSQL_SA_PASSWORD env var')
  }
  const db = new Db({ decorate: noop } as unknown as Server)
  await db.connect()

  const direction = process.argv.at(2) ?? 'version'
  if (!['up', 'down', 'version'].includes(direction)) {
    throw new Error('db.ts <up/down>')
  }

  await runDb(db, direction)
  await db.pool?.close()
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

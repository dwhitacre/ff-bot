import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { SheetsRow } from '../src/clients/sheets'

const url = `http://${process.env.HOST}:${process.env.PORT}`

function loadJson(sheetId: string) {
  return JSON.parse(readFileSync(resolve(__dirname, '../sheets', `${sheetId}.json`), { encoding: 'utf-8' }))
}

const defaults = loadJson('defaults').rows.map((r) => {
  const row = Object.assign({ pictureurl: '', desc: '', message: '' }, r)
  switch (row.command) {
    case 'list':
      return { ...row, result: '!help,!list,!whatsnew' }
    case 'info':
      return {
        ...row,
        result: `
Version: 3.0.0
SheetId: defaults
    `,
      }
    default:
      return { ...row, result: row.message }
  }
}) as Array<SheetsRow & { result: string }>

describe('api', function () {
  describe('/command defaults', () => {
    it.each(defaults)('/command/$id: should respond with command', async function (command) {
      const response = await fetch(`${url}/command/${command.command}?apikey=${process.env.APIKEY}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command).toEqual(
        expect.objectContaining({
          id: command.command,
          message: command.result,
          pictureurl: command.pictureurl,
          desc: command.desc,
          enabled: command.disabled !== 'x',
          hidden: command.hidden === 'x',
        }),
      )
      expect(data.commandId).toBe(command.command)
      expect(data.botId).toBeUndefined()
      expect(data.hasApikey).toBe(true)
    })
  })

  // describe.skip('/webhook/groupme', () => {
  //   it('can find no command', async () => {
  //     const response = await fetch(`${url}/webhook/groupme`, {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text: 'nothing here folks' }),
  //     })
  //     const data = await response.json()

  //     expect(response.status).toBe(200)
  //     expect(data.message).toEqual('no commands')
  //   })

  //   it('can find a command', async () => {
  //     const command = { ...defaults.find((command) => command.id === 'health') }
  //     const response = await fetch(`${url}/webhook/groupme`, {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text: 'nothing !health folks' }),
  //     })
  //     const data = await response.json()

  //     expect(response.status).toBe(200)
  //     expect(data.command).toEqual(command)
  //     expect(data.commandId).toBe(command.id)
  //     expect(data.botId).toBeUndefined()
  //     expect(data.hasToken).toBe(false)
  //   })

  //   it('can find the first command', async () => {
  //     const command = { ...defaults.find((command) => command.id === 'health') }
  //     const response = await fetch(`${url}/webhook/groupme`, {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text: 'nothing !health !list folks' }),
  //     })
  //     const data = await response.json()

  //     expect(response.status).toBe(200)
  //     expect(data.command).toEqual(command)
  //     expect(data.commandId).toBe(command.id)
  //     expect(data.botId).toBeUndefined()
  //     expect(data.hasToken).toBe(false)
  //   })
  // })

  describe('/*', function () {
    it('should return the home page', async function () {
      const response = await fetch(`${url}`)
      const data = await response.text()
      expect(response.status).toBe(200)
      expect(data).toContain('<!DOCTYPE html>')
    })
  })

  describe('/health', function () {
    it('should return the home page', async function () {
      const response = await fetch(`${url}/health`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.command).toEqual(
        expect.objectContaining({
          id: 'health',
        }),
      )
    })
  })
})

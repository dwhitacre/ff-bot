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
        result: `Version: 3.0.0
SheetId: defaults
    `,
      }
    default:
      return { ...row, result: row.message }
  }
}) as Array<SheetsRow & { result: string }>

describe('api', function () {
  describe('/command', () => {
    it.each(defaults)('/command/$command: should respond with command', async function (command) {
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
    })

    it('should reject if no apikey', async function () {
      const response = await fetch(`${url}/command/health`)
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should reject if bad apikey', async function () {
      const response = await fetch(`${url}/command/health?apikey=bad`)
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should do nothing on no matching command', async function () {
      const response = await fetch(`${url}/command/nomatchingcommand?apikey=${process.env.APIKEY}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.commandId).toBe('nomatchingcommand')
      expect(data.message).toBe('no matching command')
    })

    it('should do nothing on disabled command', async function () {
      const response = await fetch(`${url}/command/disabled?apikey=${process.env.APIKEY}&sheetId=test`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.commandId).toBe('disabled')
      expect(data.message).toBe('command not enabled')
    })

    it.todo('should botPost if botId')

    it('should not find command if sheet id fails to load', async function () {
      const response = await fetch(`${url}/command/health?apikey=${process.env.APIKEY}&sheetId=bad`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.commandId).toBe('health')
      expect(data.message).toBe('no matching command')
    })

    it.each([
      { command: 'nomatchingfn1', message: '!fn:nomatchingfn' },
      { command: 'nomatchingfn2', message: '!fn:listabc' },
      { command: 'notafunction1', message: 'fn:unknown' },
      { command: 'fn1', message: '__unknown_fn__ words' },
      { command: 'fn2', message: 'words __unknown_fn__ words' },
      { command: 'fn3', message: 'words __unknown_fn__' },
      { command: 'nofn1', message: 'w!fn:info' },
      { command: 'minimum', message: 'message' },
      { command: 'duplicate', message: 'dupe1' },
    ])('should handle these commands: $command', async function ({ command, message }) {
      const response = await fetch(`${url}/command/${command}?apikey=${process.env.APIKEY}&sheetId=test`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command.message).toBe(message)
    })

    it('should do nothing on when command missing message and picture', async function () {
      const response = await fetch(`${url}/command/missingmessageandpicture?apikey=${process.env.APIKEY}&sheetId=test`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.commandId).toBe('missingmessageandpicture')
      expect(data.message).toBe('no matching command')
    })

    it('should return the picture when no message', async function () {
      const response = await fetch(`${url}/command/justpicture?apikey=${process.env.APIKEY}&sheetId=test`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command.message).toBe('')
      expect(data.command.pictureurl).toBe('pic')
    })
  })

  describe('/webhook/groupme', () => {
    it('should reject if no apikey', async function () {
      const response = await fetch(`${url}/webhook/groupme`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing here folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should reject if bad apikey', async function () {
      const response = await fetch(`${url}/webhook/groupme`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing here folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
    })

    it('should do nothing if payload not json', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: 'nothing here folks',
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('payload is not json')
    })
    it('should do nothing is payload missing text', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notext: 'nothing here folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('payload is missing text field')
    })
    it('should do nothing if payload is system message', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing here folks', system: true }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('payload is a system message')
    })
    it('should do nothing if payload sender is bot', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing here folks', sender_type: 'bot' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('payload is from a bot')
    })

    it.each([{ text: 'nothing here folks' }, { text: 'health' }])('should not delegate to command handler when no command in $text', async function ({ text }) {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, sender_type: 'notabot' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('payload text has no command')
    })

    it.each([{ text: '!health' }, { text: 'nothing !health folks' }, { text: 'nothing !health' }, { text: '!health folks' }])(
      'should delegate to command handler when 1 command and $text',
      async function ({ text }) {
        const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, sender_type: 'notabot' }),
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(
          expect.objectContaining({
            command: expect.objectContaining({
              id: 'health',
            }),
          }),
        )
      },
    )

    it('should delegate to command handler when command found and its not really a command', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: '!notacommand', sender_type: 'notabot' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('no matching command')
    })

    it('should delegate to command handler when many commands in text', async function () {
      const response = await fetch(`${url}/webhook/groupme?apikey=${process.env.APIKEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'some !health !list !info text', sender_type: 'notabot' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(
        expect.objectContaining({
          command: expect.objectContaining({
            id: 'health',
          }),
        }),
      )
    })
  })

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

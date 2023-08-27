import 'dotenv/config'
import { defaults } from '../src/clients/commands'

const url = `http://${process.env.HOST}:${process.env.PORT}`

describe('api', function () {
  describe('/command', () => {
    it.each(defaults.filter((command) => !['list'].includes(command.id)))('/command/$id: should respond with command', async function (command) {
      const response = await fetch(`${url}/command/${command.id}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command).toEqual(command)
      expect(data.commandId).toBe(command.id)
      expect(data.botId).toBeUndefined()
      expect(data.hasToken).toBe(false)
    })

    it('/command/list: should respond with command', async function () {
      const command = { ...defaults.find((command) => command.id === 'list'), message: '!help,!list,!whatsnew' }
      const response = await fetch(`${url}/command/list`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command).toEqual(command)
      expect(data.commandId).toBe(command.id)
      expect(data.botId).toBeUndefined()
      expect(data.hasToken).toBe(false)
    })
  })

  describe('/webhook/groupme', () => {
    it('can find no command', async () => {
      const response = await fetch(`${url}/webhook/groupme`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing here folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toEqual('no commands')
    })

    it('can find a command', async () => {
      const command = { ...defaults.find((command) => command.id === 'health') }
      const response = await fetch(`${url}/webhook/groupme`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing !health folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command).toEqual(command)
      expect(data.commandId).toBe(command.id)
      expect(data.botId).toBeUndefined()
      expect(data.hasToken).toBe(false)
    })

    it('can find the first command', async () => {
      const command = { ...defaults.find((command) => command.id === 'health') }
      const response = await fetch(`${url}/webhook/groupme`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'nothing !health !list folks' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.command).toEqual(command)
      expect(data.commandId).toBe(command.id)
      expect(data.botId).toBeUndefined()
      expect(data.hasToken).toBe(false)
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
})

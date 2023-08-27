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

  describe('/*', function () {
    it('should return the home page', async function () {
      const response = await fetch(`${url}`)
      const data = await response.text()
      expect(response.status).toBe(200)
      expect(data).toContain('<!DOCTYPE html>')
    })
  })
})

import 'dotenv/config'
import { defaultCommands } from '../src/routes/command'

const url = `http://${process.env.HOST}:${process.env.PORT}`

describe('api', function () {
  it.each(defaultCommands)('/command/$id: should respond with command', async function (command) {
    const response = await fetch(`${url}/command/${command.id}`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.command).toEqual(command)
    expect(data.commandId).toBe(command.id)
    expect(data.botId).toBeUndefined()
    expect(data.hasToken).toBe(false)
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

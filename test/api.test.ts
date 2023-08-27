import 'dotenv/config'
import { defaultCommands } from '../src/routes/command'

const url = `http://${process.env.HOST}:${process.env.PORT}`

describe('api', function () {
  it.each([{ commandId: 'health' }])('/command/$commandId: should respond with command', async function ({ commandId }) {
    const expected = defaultCommands.find((command) => command.id === commandId)
    if (!expected) throw new Error('should have expected command')

    const response = await fetch(`${url}/command/${commandId}`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.command).toEqual(expected)
    expect(data.commandId).toBe(expected.id)
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

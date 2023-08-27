import 'dotenv/config'
import config from 'config'

const url = `http://${config.get('host')}:${config.get('port')}`

describe('api', function () {
  describe('/health', function () {
    it('should respond status ok', async function () {
      const response = await fetch(`${url}/health`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
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

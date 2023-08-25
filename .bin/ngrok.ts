import 'dotenv/config'
import ngrok from 'ngrok'

async function run(): Promise<void> {
  const url = await ngrok.connect({
    proto: 'http',
    port: parseInt(process.env.PORT || '3001'),
    authtoken: process.env.NGROK_TOKEN,
  })
  console.log(`ngrok running at ${url}`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

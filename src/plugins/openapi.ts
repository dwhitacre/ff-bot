import { Server } from '@hapi/hapi'

export default async function register(server: Server) {
  await server.register(await import('@hapi/inert'))
  await server.register(await import('@hapi/vision'))

  await server.register({
    plugin: await import('hapi-swagger'),
    options: {
      info: {
        title: 'Fantasy Football Bot',
      },
      documentationPage: false,
    },
  })
}

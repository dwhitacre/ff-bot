import { Server } from '@hapi/hapi'

import Fns from './fns'

export { default as Fns, Fn, fns } from './fns'

export default async function register(server: Server) {
  const fns = new Fns(server)
  server.decorate('server', 'fns', (): Fns => {
    return fns
  })
}

export const dependencies = ['log', 'commands']
export const name = 'functions'

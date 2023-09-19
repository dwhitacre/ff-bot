import { Request } from '@hapi/hapi'

export async function fn(_: Request) {
  return '__unknown_fn__'
}

export const name = 'unknown'

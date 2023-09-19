import { Request } from '@hapi/hapi'

import packageJson from '../../../package.json'

export async function fn(request: Request) {
  return `Version: ${packageJson.version}
SheetId: ${request.query?.sheetId ?? 'defaults'}
    `
}

export const name = 'info'

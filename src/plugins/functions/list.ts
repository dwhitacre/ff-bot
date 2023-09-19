import { Request } from '@hapi/hapi'

export async function fn(request: Request) {
  const commands = Array.from(await request.server.commands().getAll(request.query?.sheetId))
  commands.sort((a, b) => a.id.localeCompare(b.id))
  return commands
    .filter((command) => !command.hidden && command.enabled)
    .reduce((message, command) => (message += `,!${command.id}`), '')
    .slice(1)
}

export const name = 'list'

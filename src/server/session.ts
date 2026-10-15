import { createServerFn } from '@tanstack/react-start'
import { getCurrentUser } from './auth.server.js'
import type { SessionUser } from './auth.server.js'

/**
 * RecipeBox — session server function.
 *
 * The `_protected` route guard and the auth pages call this to read the current
 * user. The server-only helpers live in `auth.server.ts`.
 */
export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => getCurrentUser(),
)

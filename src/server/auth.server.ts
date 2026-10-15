import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/**
 * RecipeBox — server-only session helpers.
 *
 * This module is named `*.server.ts` so TanStack Start's import-protection
 * plugin keeps it out of the client bundle. It is only imported by other
 * server-only modules (`recipes.ts`) and by the `getSessionUser` server
 * function in `session.ts`.
 */

export type SessionUser = {
  id: string
  name: string
  email: string
  image: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  const user = session?.user
  if (!user) {
    return null
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be signed in to do that.')
  }
  return user
}

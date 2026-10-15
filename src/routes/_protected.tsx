import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionUser } from '#/server/session'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return { user }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return (
    <main className="page-wrap app-page">
      <Outlet />
    </main>
  )
}

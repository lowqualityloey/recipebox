import { Link, useRouter } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'

export default function UserMenu() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) {
    return (
      <div
        className="h-8 w-20 animate-pulse rounded-full bg-[var(--chip-bg)]"
        aria-hidden="true"
      />
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link to="/login" className="btn btn-secondary px-3 py-1.5 text-sm">
          Log in
        </Link>
        <Link to="/signup" className="btn px-3 py-1.5 text-sm">
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-semibold text-[var(--sea-ink-soft)] sm:inline">
        {session.user.name}
      </span>
      <button
        type="button"
        className="btn btn-secondary px-3 py-1.5 text-sm"
        onClick={async () => {
          await authClient.signOut()
          await router.invalidate()
        }}
      >
        Log out
      </button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { getSessionUser } from '#/server/session'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  pendingComponent: AuthLoading,
  component: SignupPage,
})

function AuthLoading() {
  return (
    <main className="app-page app-center">
      <div className="panel rise-in w-full max-w-md text-center">
        <div
          className="mx-auto h-8 w-24 animate-pulse rounded-full bg-[var(--chip-bg)]"
          aria-hidden="true"
        />
        <p className="muted mt-4 text-sm">Checking session…</p>
      </div>
    </main>
  )
}

function SignupPage() {
  const router = useRouter()
  const navigate = Route.useNavigate()
  const { data: session, isPending } = authClient.useSession()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isPending && session?.user) {
      void navigate({ to: '/dashboard' })
    }
  }, [isPending, session, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account. Please try again.')
        setIsSubmitting(false)
        return
      }

      await router.invalidate()
      await navigate({ to: '/dashboard' })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-page app-center">
      <div className="panel rise-in w-full max-w-md">
        <header className="mb-6">
          <p className="island-kicker mb-1">Get started</p>
          <h1 className="page-title text-2xl font-bold sm:text-3xl">
            Create your RecipeBox account
          </h1>
          <p className="muted mt-1 text-sm">
            Save your favorite dishes and organize your kitchen.
          </p>
        </header>

        {error && (
          <div role="alert" className="alert alert-danger mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]"
            >
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Julia Child"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]"
            >
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn w-full"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <footer className="mt-6 border-t border-[var(--line)] pt-4 text-center">
          <p className="muted text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--lagoon-deep)] hover:underline"
            >
              Log in
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}

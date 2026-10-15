import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import EmptyState from '#/components/EmptyState'
import RecipeCard from '#/components/RecipeCard'
import type { RecipeListItemDTO } from '#/lib/recipes.types'
import { deleteRecipe, getMyRecipes } from '#/server/recipes'

export const Route = createFileRoute('/_protected/dashboard')({
  loader: () => getMyRecipes(),
  component: DashboardPage,
  pendingComponent: DashboardPending,
  errorComponent: DashboardError,
})

function DashboardPending() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Your recipes</h1>
          <p className="muted mt-1 text-sm">Manage and organize the recipes you have created.</p>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-[0.85rem] bg-[var(--chip-bg)]" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="card flex h-48 animate-pulse flex-col justify-between rounded-2xl bg-[var(--surface)]"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}

function DashboardError({ error }: { error: unknown }) {
  const router = useRouter()
  const message = error instanceof Error ? error.message : 'Could not load your recipes.'

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="alert alert-danger max-w-lg" role="alert">
        <h2 className="section-title mb-1 text-base">Failed to load recipes</h2>
        <p className="m-0 text-sm">{message}</p>
      </div>
      <button
        type="button"
        className="btn btn-secondary text-sm"
        onClick={() => router.invalidate()}
      >
        Try again
      </button>
    </div>
  )
}

function DashboardPage() {
  const recipes = Route.useLoaderData()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleDelete(recipe: RecipeListItemDTO) {
    const confirmed = window.confirm(`Are you sure you want to delete "${recipe.title}"?`)
    if (!confirmed) {
      return
    }

    setErrorMessage(null)
    setDeletingId(recipe.id)
    try {
      await deleteRecipe({ data: { id: recipe.id } })
      await router.invalidate()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete the recipe. Please try again.'
      setErrorMessage(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Your recipes</h1>
          <p className="muted mt-1 text-sm">Manage and organize the recipes you have created.</p>
        </div>
        <Link to="/recipes/new" className="btn no-underline">
          + New recipe
        </Link>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          <p className="m-0 text-sm">{errorMessage}</p>
        </div>
      )}

      {recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          description="You have not created any recipes yet. Share your culinary creations with the community!"
          action={
            <Link to="/recipes/new" className="btn mt-2 no-underline">
              Create your first recipe
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const isDeleting = deletingId === recipe.id
            return (
              <div key={recipe.id} className="flex flex-col gap-2">
                <RecipeCard recipe={recipe} />
                <div className="flex items-center justify-end gap-2 px-1">
                  <Link
                    to="/recipes/$recipeId/edit"
                    params={{ recipeId: recipe.id }}
                    className="btn btn-secondary px-3 py-1.5 text-xs no-underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger px-3 py-1.5 text-xs"
                    disabled={isDeleting}
                    onClick={() => handleDelete(recipe)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

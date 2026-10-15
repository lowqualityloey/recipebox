import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import EmptyState from '#/components/EmptyState'
import Pagination from '#/components/Pagination'
import RecipeCard from '#/components/RecipeCard'
import { recipeListSearchSchema } from '#/lib/recipes.schemas'
import type { RecipeListItemDTO } from '#/lib/recipes.types'
import { getRecipes } from '#/server/recipes'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) =>
    recipeListSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    q: search.q ?? '',
    ingredient: search.ingredient ?? '',
  }),
  loader: async ({ deps }) => {
    return getRecipes({
      data: {
        page: deps.page,
        q: deps.q || undefined,
        ingredient: deps.ingredient || undefined,
      },
    })
  },
  component: RecipeFeedPage,
  pendingComponent: RecipeFeedPending,
  errorComponent: RecipeFeedError,
})

function RecipeFeedPage() {
  const { items, page, total, totalPages } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [qInput, setQInput] = useState(search.q ?? '')
  const [ingredientInput, setIngredientInput] = useState(
    search.ingredient ?? '',
  )

  const isFiltered = Boolean(search.q || search.ingredient)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate({
      to: '/',
      search: {
        page: 1,
        q: qInput.trim() || undefined,
        ingredient: ingredientInput.trim() || undefined,
      },
    })
  }

  const handleClear = () => {
    setQInput('')
    setIngredientInput('')
    navigate({
      to: '/',
      search: {},
    })
  }

  return (
    <main className="page-wrap px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:mb-12">
        <h1 className="display-title page-title text-[var(--sea-ink)]">
          RecipeBox
        </h1>
        <p className="muted mt-2 text-base sm:text-lg">
          Discover, cook, and share everyday recipes with ingredients you have.
        </p>
      </header>

      <section className="panel rise-in mb-8" aria-label="Search and filter recipes">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="recipe-search-title"
              className="section-title mb-1.5 block text-xs tracking-wider uppercase"
            >
              Search by title
            </label>
            <input
              id="recipe-search-title"
              type="search"
              className="input"
              placeholder="e.g. Sourdough bread, Tomato pasta..."
              maxLength={120}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label
              htmlFor="recipe-filter-ingredient"
              className="section-title mb-1.5 block text-xs tracking-wider uppercase"
            >
              Filter by ingredient
            </label>
            <input
              id="recipe-filter-ingredient"
              type="search"
              className="input"
              placeholder="e.g. Garlic, Basil, Olive oil..."
              maxLength={100}
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button type="submit" className="btn flex-1 sm:flex-initial">
              Search
            </button>
            {isFiltered || qInput || ingredientInput ? (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-secondary flex-1 sm:flex-initial"
              >
                Clear
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section aria-label="Recipe results">
        <div className="mb-4 flex items-center justify-between">
          <p className="muted m-0 text-sm">
            {total} {total === 1 ? 'recipe' : 'recipes'}
            {isFiltered ? ' found' : ''}
          </p>
          {isFiltered ? (
            <Link
              to="/"
              search={{}}
              className="text-xs font-semibold text-[var(--lagoon-deep)] hover:underline"
            >
              Reset all filters
            </Link>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={
              isFiltered
                ? 'No recipes match your search'
                : 'No recipes published yet'
            }
            description={
              isFiltered
                ? 'Try adjusting your title search or ingredient filter to find what you are craving.'
                : 'Be the first to share a favorite dish with the RecipeBox community.'
            }
            action={
              isFiltered ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-secondary mt-2"
                >
                  Clear filters
                </button>
              ) : (
                <Link to="/recipes/new" className="btn mt-2 no-underline">
                  Add a recipe
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((recipe: RecipeListItemDTO) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          query={search.q ?? ''}
          ingredient={search.ingredient ?? ''}
        />
      </section>
    </main>
  )
}

function RecipeFeedPending() {
  return (
    <main className="page-wrap px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:mb-12">
        <h1 className="display-title page-title text-[var(--sea-ink)]">
          RecipeBox
        </h1>
        <p className="muted mt-2 text-base sm:text-lg">
          Discover, cook, and share everyday recipes with ingredients you have.
        </p>
      </header>

      <div className="panel mb-8 animate-pulse">
        <div className="h-10 rounded-lg bg-[var(--line)]" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="card flex h-48 animate-pulse flex-col justify-between"
          >
            <div className="h-6 w-3/4 rounded bg-[var(--line)]" />
            <div className="h-4 w-full rounded bg-[var(--line)]" />
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-[var(--line)]" />
              <div className="h-4 w-16 rounded bg-[var(--line)]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function RecipeFeedError({ error }: { error: unknown }) {
  const errorMessage =
    error instanceof Error ? error.message : 'Failed to load recipes.'

  return (
    <main className="page-wrap px-4 py-8 sm:py-12">
      <div className="alert alert-danger mx-auto max-w-xl text-center">
        <h2 className="section-title mb-2 text-lg">Unable to load recipes</h2>
        <p className="muted m-0 text-sm">{errorMessage}</p>
        <div className="mt-4">
          <Link to="/" search={{}} className="btn btn-secondary">
            Reload recipes
          </Link>
        </div>
      </div>
    </main>
  )
}

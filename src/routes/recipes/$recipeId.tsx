import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { formatIngredientAmount, formatRecipeDate } from '#/lib/format'
import type { RecipeIngredientDTO } from '#/lib/recipes.types'
import { getRecipeById } from '#/server/recipes'

export const Route = createFileRoute('/recipes/$recipeId')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.recipeId } })
    if (!recipe) {
      throw notFound()
    }
    return recipe
  },
  notFoundComponent: RecipeNotFound,
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const recipe = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 py-8 sm:py-12">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
        >
          ← Back to recipes
        </Link>
      </nav>

      <article className="rise-in flex flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <h1 className="page-title text-[var(--sea-ink)]">{recipe.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
            <span className="pill">by {recipe.authorName}</span>
            {recipe.createdAt ? (
              <time className="muted text-xs" dateTime={recipe.createdAt}>
                Created on {formatRecipeDate(recipe.createdAt)}
              </time>
            ) : null}
          </div>

          {recipe.description ? (
            <p className="muted mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
              {recipe.description}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Ingredients sidebar */}
          <aside
            className="panel lg:col-span-4 lg:sticky lg:top-24"
            aria-labelledby="ingredients-heading"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <h2
                id="ingredients-heading"
                className="section-title text-lg text-[var(--sea-ink)]"
              >
                Ingredients
              </h2>
              <span className="pill">
                {recipe.ingredients.length}{' '}
                {recipe.ingredients.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <ul className="mt-4 m-0 flex list-none flex-col gap-2.5 p-0">
              {recipe.ingredients.map((item: RecipeIngredientDTO) => (
                <li
                  key={item.id}
                  className="list-item flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-[var(--sea-ink)]">
                    {formatIngredientAmount(item.amount, item.name)}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Instructions main */}
          <section
            className="panel flex flex-col gap-6 lg:col-span-8"
            aria-labelledby="instructions-heading"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <h2
                id="instructions-heading"
                className="section-title text-lg text-[var(--sea-ink)]"
              >
                Instructions
              </h2>
              <span className="pill">
                {recipe.steps.length}{' '}
                {recipe.steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>

            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {recipe.steps.map((step: string, index: number) => (
                <li
                  key={index}
                  className="card flex items-start gap-4 p-4 text-[var(--sea-ink)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--lagoon)_22%,var(--surface-strong))] text-xs font-bold text-[var(--sea-ink)]">
                    {index + 1}
                  </span>
                  <p className="m-0 flex-1 pt-0.5 text-base leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="mt-4 border-t border-[var(--line)] pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
          >
            ← Back to all recipes
          </Link>
        </footer>
      </article>
    </main>
  )
}

function RecipeNotFound() {
  return (
    <main className="page-wrap px-4 py-12 text-center">
      <div className="card mx-auto max-w-md p-8">
        <h2 className="section-title mb-2 text-xl text-[var(--sea-ink)]">
          Recipe not found
        </h2>
        <p className="muted mb-6 text-sm">
          The recipe you are looking for does not exist or may have been removed.
        </p>
        <Link to="/" className="btn no-underline">
          ← Back to recipes
        </Link>
      </div>
    </main>
  )
}

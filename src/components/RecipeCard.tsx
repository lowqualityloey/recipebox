import { Link } from '@tanstack/react-router'
import { formatRecipeDate, truncate } from '#/lib/format'
import type { RecipeListItemDTO } from '#/lib/recipes.types'

export default function RecipeCard({ recipe }: { recipe: RecipeListItemDTO }) {
  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: recipe.id }}
      className="card feature-card rise-in flex flex-col gap-3 no-underline"
    >
      <h3 className="section-title text-xl text-[var(--sea-ink)]">
        {recipe.title}
      </h3>
      <p className="muted m-0 text-sm">{truncate(recipe.description)}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
        <span className="pill">by {recipe.authorName}</span>
        <span className="pill">
          {recipe.ingredientCount}{' '}
          {recipe.ingredientCount === 1 ? 'ingredient' : 'ingredients'}
        </span>
      </div>
      <time className="muted text-xs" dateTime={recipe.createdAt}>
        {formatRecipeDate(recipe.createdAt)}
      </time>
    </Link>
  )
}

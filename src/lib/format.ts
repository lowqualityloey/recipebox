/**
 * RecipeBox — small pure formatting/parsing helpers.
 *
 * Kept dependency-free and side-effect-free so they are trivial to unit test.
 */

/** Collapse an array of steps into the single string we persist. */
export function stepsToText(steps: ReadonlyArray<string>): string {
  return steps
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .join('\n')
}

/** Split the persisted steps string back into a display list. */
export function textToSteps(text: string): string[] {
  return text
    .split('\n')
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
}

/** Render an ingredient row the way it is shown in the UI, e.g. "2 cups flour". */
export function formatIngredientAmount(amount: string, name: string): string {
  const trimmedAmount = amount.trim()
  const trimmedName = name.trim()
  return trimmedAmount ? `${trimmedAmount} ${trimmedName}` : trimmedName
}

/** Human-friendly date for recipe cards/details. */
export function formatRecipeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Short, single-line summary of a longer description. */
export function truncate(text: string, maxLength = 140): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

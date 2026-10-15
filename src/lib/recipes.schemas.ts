import { z } from 'zod'

/**
 * RecipeBox — input validation schemas.
 *
 * Every server function validates its input with one of these Zod schemas via
 * `createServerFn().validator(...)`, and routes reuse the search schema for
 * type-safe URL search params.
 */

export const recipeIngredientInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingredient name is required')
    .max(100, 'Ingredient name must be 100 characters or fewer'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .max(60, 'Amount must be 60 characters or fewer'),
})

export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>

const recipeFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or fewer'),
  steps: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'A step cannot be empty')
        .max(500, 'A step must be 500 characters or fewer'),
    )
    .min(1, 'Add at least one step')
    .max(50, 'A recipe can have at most 50 steps'),
  ingredients: z
    .array(recipeIngredientInputSchema)
    .min(1, 'Add at least one ingredient')
    .max(50, 'A recipe can have at most 50 ingredients'),
})

/** Rejects two ingredient rows that differ only by case/whitespace. */
function rejectDuplicateIngredients(
  value: z.infer<typeof recipeFieldsSchema>,
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>()
  value.ingredients.forEach((ingredient, index) => {
    const key = ingredient.name.toLowerCase()
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate ingredient "${ingredient.name}"`,
        path: ['ingredients', index, 'name'],
      })
    }
    seen.add(key)
  })
}

export const recipeInputSchema = recipeFieldsSchema.superRefine(
  rejectDuplicateIngredients,
)

export const recipeUpdateInputSchema = recipeFieldsSchema
  .extend({ id: z.string().min(1) })
  .superRefine(rejectDuplicateIngredients)

export const recipeIdSchema = z.object({
  id: z.string().min(1, 'A recipe id is required'),
})

/** Coercing so it works both for direct calls and for URL search params. */
export const recipeListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(120).optional(),
  ingredient: z.string().trim().max(100).optional(),
})

/**
 * URL search params for the feed. Kept fully optional (and tolerant of bad
 * values) so that a bare `/` renders without a canonicalising redirect; the
 * route loader applies the real defaults.
 */
export const recipeListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  ingredient: z.string().optional().catch(undefined),
})

export type RecipeListSearch = z.infer<typeof recipeListSearchSchema>

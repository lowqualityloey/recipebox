import { describe, expect, it } from 'vitest'
import {
  recipeIdSchema,
  recipeInputSchema,
  recipeListInputSchema,
  recipeListSearchSchema,
  recipeUpdateInputSchema,
} from './recipes.schemas'

const validRecipe = {
  title: 'Classic Pizza',
  description: 'A simple pizza.',
  steps: ['Make dough', 'Bake it'],
  ingredients: [
    { name: 'flour', amount: '2 cups' },
    { name: 'water', amount: '1 cup' },
  ],
}

describe('recipeInputSchema', () => {
  it('accepts a well-formed recipe', () => {
    const result = recipeInputSchema.safeParse(validRecipe)
    expect(result.success).toBe(true)
  })

  it('trims whitespace from fields', () => {
    const result = recipeInputSchema.safeParse({
      ...validRecipe,
      title: '  Pizza  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Pizza')
    }
  })

  it('rejects an empty title', () => {
    const result = recipeInputSchema.safeParse({ ...validRecipe, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a recipe with no ingredients', () => {
    const result = recipeInputSchema.safeParse({
      ...validRecipe,
      ingredients: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a recipe with no steps', () => {
    const result = recipeInputSchema.safeParse({ ...validRecipe, steps: [] })
    expect(result.success).toBe(false)
  })

  it('rejects an ingredient without an amount', () => {
    const result = recipeInputSchema.safeParse({
      ...validRecipe,
      ingredients: [{ name: 'flour', amount: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects duplicate ingredient names (case-insensitive)', () => {
    const result = recipeInputSchema.safeParse({
      ...validRecipe,
      ingredients: [
        { name: 'Flour', amount: '1 cup' },
        { name: 'flour', amount: '2 cups' },
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe('recipeUpdateInputSchema', () => {
  it('requires an id', () => {
    const result = recipeUpdateInputSchema.safeParse(validRecipe)
    expect(result.success).toBe(false)
  })

  it('accepts a valid update', () => {
    const result = recipeUpdateInputSchema.safeParse({
      ...validRecipe,
      id: 'abc123',
    })
    expect(result.success).toBe(true)
  })
})

describe('recipeIdSchema', () => {
  it('rejects an empty id', () => {
    expect(recipeIdSchema.safeParse({ id: '' }).success).toBe(false)
  })

  it('accepts a non-empty id', () => {
    expect(recipeIdSchema.safeParse({ id: 'x' }).success).toBe(true)
  })
})

describe('recipeListInputSchema', () => {
  it('applies page/pageSize defaults', () => {
    const result = recipeListInputSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(12)
  })

  it('coerces numeric strings', () => {
    const result = recipeListInputSchema.parse({ page: '3', pageSize: '20' })
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(20)
  })

  it('rejects a pageSize above the maximum', () => {
    expect(recipeListInputSchema.safeParse({ pageSize: 999 }).success).toBe(
      false,
    )
  })
})

describe('recipeListSearchSchema', () => {
  it('drops invalid values instead of throwing (no forced redirect)', () => {
    const result = recipeListSearchSchema.parse({ page: 'nope' })
    expect(result).toEqual({})
  })

  it('keeps provided values', () => {
    const result = recipeListSearchSchema.parse({
      page: '2',
      q: 'pizza',
      ingredient: 'flour',
    })
    expect(result).toEqual({ page: 2, q: 'pizza', ingredient: 'flour' })
  })
})

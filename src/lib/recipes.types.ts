/**
 * RecipeBox — data transfer objects shared between server functions and the UI.
 *
 * These are plain, JSON-serializable types (no Prisma types leak to the client)
 * so the server-function boundary stays type-safe end to end.
 */

export type RecipeIngredientDTO = {
  id: string
  name: string
  amount: string
}

export type RecipeListItemDTO = {
  id: string
  title: string
  description: string
  authorName: string
  createdAt: string
  ingredientCount: number
}

export type RecipeDetailDTO = {
  id: string
  title: string
  description: string
  steps: string[]
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
  ingredients: RecipeIngredientDTO[]
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

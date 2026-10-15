import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { Prisma } from '#/generated/prisma/client.js'
import { stepsToText, textToSteps } from '#/lib/format'
import {
  recipeIdSchema,
  recipeInputSchema,
  recipeListInputSchema,
  recipeUpdateInputSchema,
} from '#/lib/recipes.schemas'
import type {
  Paginated,
  RecipeDetailDTO,
  RecipeListItemDTO,
} from '#/lib/recipes.types'
import { requireUser } from './auth.server.js'

/**
 * RecipeBox — recipe server functions.
 *
 * All database access lives here. Every function validates input with Zod and
 * returns plain, serializable DTOs. Mutations require an authenticated session;
 * edit/delete additionally require the caller to be the recipe's author.
 */

// --- row shapes returned from Prisma queries (kept local to this module) -----

type ListRow = {
  id: string
  title: string
  description: string
  createdAt: Date
  author: { name: string }
  _count: { ingredients: number }
}

type DetailRow = {
  id: string
  title: string
  description: string
  steps: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: { name: string }
  ingredients: Array<{ id: string; amount: string; ingredient: { name: string } }>
}

const listInclude = {
  author: { select: { name: true } },
  _count: { select: { ingredients: true } },
} as const

const detailInclude = {
  author: { select: { name: true } },
  ingredients: { include: { ingredient: { select: { name: true } } } },
} as const

function toListItem(row: ListRow): RecipeListItemDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    authorName: row.author.name,
    createdAt: row.createdAt.toISOString(),
    ingredientCount: row._count.ingredients,
  }
}

function toDetail(row: DetailRow): RecipeDetailDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    steps: textToSteps(row.steps),
    authorId: row.authorId,
    authorName: row.author.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ingredients: row.ingredients.map((item) => ({
      id: item.id,
      name: item.ingredient.name,
      amount: item.amount,
    })),
  }
}

function rethrowUniqueTitle(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new Error('A recipe with this title already exists.')
  }
  throw error
}

// --- queries -----------------------------------------------------------------

export const getRecipes = createServerFn({ method: 'GET' })
  .validator(recipeListInputSchema)
  .handler(
    async ({ data }): Promise<Paginated<RecipeListItemDTO>> => {
      const { page, pageSize, q, ingredient } = data
      const where: Prisma.RecipeWhereInput = {}

      if (q) {
        where.title = { contains: q, mode: 'insensitive' }
      }
      if (ingredient) {
        where.ingredients = {
          some: {
            ingredient: { name: { equals: ingredient, mode: 'insensitive' } },
          },
        }
      }

      const [total, rows] = await Promise.all([
        prisma.recipe.count({ where }),
        prisma.recipe.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: listInclude,
        }),
      ])

      return {
        items: rows.map(toListItem),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    },
  )

export const getRecipeById = createServerFn({ method: 'GET' })
  .validator(recipeIdSchema)
  .handler(async ({ data }): Promise<RecipeDetailDTO | null> => {
    const row = await prisma.recipe.findUnique({
      where: { id: data.id },
      include: detailInclude,
    })
    return row ? toDetail(row) : null
  })

export const getMyRecipes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<RecipeListItemDTO[]> => {
    const user = await requireUser()
    const rows = await prisma.recipe.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: listInclude,
    })
    return rows.map(toListItem)
  },
)

// --- mutations ---------------------------------------------------------------

async function resolveIngredientIds(
  tx: Prisma.TransactionClient,
  ingredients: ReadonlyArray<{ name: string }>,
): Promise<Map<string, string>> {
  const uniqueNames = [...new Set(ingredients.map((item) => item.name))]
  const rows = await Promise.all(
    uniqueNames.map((name) =>
      tx.ingredient.upsert({
        where: { name },
        create: { name },
        update: {},
        select: { id: true, name: true },
      }),
    ),
  )
  return new Map(rows.map((row) => [row.name, row.id]))
}

export const createRecipe = createServerFn({ method: 'POST' })
  .validator(recipeInputSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser()

    const recipe = await prisma
      .$transaction(async (tx) => {
        const idByName = await resolveIngredientIds(tx, data.ingredients)
        return tx.recipe.create({
          data: {
            title: data.title,
            description: data.description,
            steps: stepsToText(data.steps),
            authorId: user.id,
            ingredients: {
              create: data.ingredients.map((item) => ({
                amount: item.amount,
                ingredientId: idByName.get(item.name)!,
              })),
            },
          },
          select: { id: true },
        })
      })
      .catch(rethrowUniqueTitle)

    return { id: recipe.id }
  })

export const updateRecipe = createServerFn({ method: 'POST' })
  .validator(recipeUpdateInputSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser()

    await prisma
      .$transaction(async (tx) => {
        const existing = await tx.recipe.findUnique({
          where: { id: data.id },
          select: { authorId: true },
        })
        if (!existing) {
          throw new Error('Recipe not found.')
        }
        if (existing.authorId !== user.id) {
          throw new Error('You can only edit your own recipes.')
        }

        const idByName = await resolveIngredientIds(tx, data.ingredients)
        await tx.recipeIngredient.deleteMany({ where: { recipeId: data.id } })
        await tx.recipe.update({
          where: { id: data.id },
          data: {
            title: data.title,
            description: data.description,
            steps: stepsToText(data.steps),
            ingredients: {
              create: data.ingredients.map((item) => ({
                amount: item.amount,
                ingredientId: idByName.get(item.name)!,
              })),
            },
          },
        })
      })
      .catch(rethrowUniqueTitle)

    return { id: data.id }
  })

export const deleteRecipe = createServerFn({ method: 'POST' })
  .validator(recipeIdSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser()

    const { count } = await prisma.recipe.deleteMany({
      where: { id: data.id, authorId: user.id },
    })
    if (count === 0) {
      const exists = await prisma.recipe.findUnique({
        where: { id: data.id },
        select: { id: true },
      })
      throw new Error(
        exists ? 'You can only delete your own recipes.' : 'Recipe not found.',
      )
    }
    return { id: data.id }
  })

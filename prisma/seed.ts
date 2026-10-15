import { auth } from '../src/lib/auth.js'
import { prisma } from '../src/db.js'

/**
 * RecipeBox seed — creates a loginable demo account and two sample recipes.
 *
 * Run with:  npm run db:seed
 * Demo login: demo@recipebox.dev / password123
 */

const DEMO_EMAIL = 'demo@recipebox.dev'
const DEMO_PASSWORD = 'password123'
const DEMO_NAME = 'Demo Cook'

type SeedIngredient = { name: string; amount: string }

async function ensureDemoUser(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (existing) {
    return existing.id
  }
  await auth.api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME },
  })
  const created = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!created) {
    throw new Error('Failed to create the demo user')
  }
  return created.id
}

async function createRecipe(
  authorId: string,
  title: string,
  description: string,
  steps: string[],
  ingredients: SeedIngredient[],
): Promise<void> {
  const existing = await prisma.recipe.findUnique({ where: { title } })
  if (existing) {
    return
  }

  const resolved = await Promise.all(
    ingredients.map(async (item) => {
      const ingredient = await prisma.ingredient.upsert({
        where: { name: item.name },
        create: { name: item.name },
        update: {},
        select: { id: true },
      })
      return { ingredientId: ingredient.id, amount: item.amount }
    }),
  )

  await prisma.recipe.create({
    data: {
      title,
      description,
      steps: steps.join('\n'),
      authorId,
      ingredients: {
        create: resolved.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount,
        })),
      },
    },
  })
}

async function main(): Promise<void> {
  console.log('🌱 Seeding RecipeBox…')

  const authorId = await ensureDemoUser()

  await createRecipe(
    authorId,
    'Classic Margherita Pizza',
    'A simple, chewy Neapolitan-style pizza with San Marzano tomatoes, fresh mozzarella and basil.',
    [
      'Mix flour, water, yeast and salt and knead until smooth.',
      'Let the dough rise for 2 hours, then divide into balls.',
      'Top with crushed tomatoes, torn mozzarella and basil.',
      'Bake at 250°C for 8–10 minutes until blistered.',
    ],
    [
      { name: 'flour', amount: '4 cups' },
      { name: 'water', amount: '1 1/2 cups' },
      { name: 'yeast', amount: '1 tsp' },
      { name: 'mozzarella', amount: '200 g' },
      { name: 'basil', amount: 'a handful' },
    ],
  )

  await createRecipe(
    authorId,
    'Weeknight Banana Bread',
    'A moist, one-bowl banana bread that is perfect for using up overripe bananas.',
    [
      'Preheat the oven to 175°C and grease a loaf tin.',
      'Mash the bananas and mix in the melted butter and sugar.',
      'Stir in the egg, then fold in the flour and baking soda.',
      'Bake for 60 minutes until a skewer comes out clean.',
    ],
    [
      { name: 'bananas', amount: '3 ripe' },
      { name: 'butter', amount: '1/2 cup' },
      { name: 'sugar', amount: '3/4 cup' },
      { name: 'egg', amount: '1' },
      { name: 'flour', amount: '1 1/2 cups' },
      { name: 'baking soda', amount: '1 tsp' },
    ],
  )

  console.log('✅ Seed complete — demo login: demo@recipebox.dev / password123')
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

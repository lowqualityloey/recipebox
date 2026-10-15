import { createFileRoute, useRouter } from '@tanstack/react-router'
import RecipeForm, { type RecipeFormValues } from '#/components/RecipeForm'
import { createRecipe } from '#/server/recipes'

export const Route = createFileRoute('/_protected/recipes/new')({
  component: NewRecipePage,
})

function NewRecipePage() {
  const router = useRouter()
  const navigate = Route.useNavigate()

  async function handleSubmit(values: RecipeFormValues) {
    const { id } = await createRecipe({ data: values })
    await router.invalidate()
    navigate({
      to: '/recipes/$recipeId',
      params: { recipeId: id },
    })
  }

  function handleCancel() {
    router.history.back()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="island-kicker mb-1">Create Recipe</p>
        <h1 className="page-title">New recipe</h1>
        <p className="muted mt-1 text-sm">
          Add your ingredients, step-by-step instructions, and description.
        </p>
      </div>

      <RecipeForm
        submitLabel="Create recipe"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}

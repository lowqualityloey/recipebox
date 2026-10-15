import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import RecipeForm, { type RecipeFormValues } from '#/components/RecipeForm'
import { getRecipeById, updateRecipe } from '#/server/recipes'

export const Route = createFileRoute('/_protected/recipes/$recipeId/edit')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.recipeId } })
    if (!recipe) {
      throw notFound()
    }
    return recipe
  },
  component: EditRecipePage,
  notFoundComponent: EditRecipeNotFound,
})

function EditRecipeNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="alert alert-danger max-w-md" role="alert">
        <h2 className="section-title mb-1 text-base">Recipe not found</h2>
        <p className="m-0 text-sm">
          The recipe you are trying to edit does not exist or may have been deleted.
        </p>
      </div>
      <Link to="/dashboard" className="btn btn-secondary text-sm no-underline">
        Back to your recipes
      </Link>
    </div>
  )
}

function EditRecipePage() {
  const recipe = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const navigate = Route.useNavigate()

  if (recipe.authorId !== user.id) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
        <div className="alert alert-danger w-full" role="alert">
          <h2 className="section-title mb-1 text-base">Permission denied</h2>
          <p className="m-0 text-sm">You can only edit your own recipes.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => router.history.back()}
        >
          Go back
        </button>
      </div>
    )
  }

  async function handleSubmit(values: RecipeFormValues) {
    await updateRecipe({
      data: {
        id: recipe.id,
        ...values,
      },
    })
    await router.invalidate()
    navigate({
      to: '/recipes/$recipeId',
      params: { recipeId: recipe.id },
    })
  }

  function handleCancel() {
    router.history.back()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="island-kicker mb-1">Recipe Editor</p>
        <h1 className="page-title">Edit recipe</h1>
        <p className="muted mt-1 text-sm">
          Update the title, ingredients, instructions, or description.
        </p>
      </div>

      <RecipeForm
        initialValues={recipe}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}

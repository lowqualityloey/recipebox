import { useState } from 'react'
import type { FormEvent } from 'react'
import { recipeInputSchema } from '#/lib/recipes.schemas'
import type { RecipeDetailDTO } from '#/lib/recipes.types'

/**
 * RecipeBox — create/edit form.
 *
 * Owns its own field state (including dynamic step and ingredient rows),
 * validates with the shared Zod schema before submitting, and hands a clean
 * payload to the caller. The caller performs the server-function call.
 */

export type RecipeFormValues = {
  title: string
  description: string
  steps: string[]
  ingredients: Array<{ name: string; amount: string }>
}

type IngredientRow = { name: string; amount: string }

export default function RecipeForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: RecipeDetailDTO
  submitLabel: string
  onSubmit: (values: RecipeFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [steps, setSteps] = useState<string[]>(
    initialValues?.steps.length ? initialValues.steps : [''],
  )
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialValues?.ingredients.length
      ? initialValues.ingredients.map((item) => ({
          name: item.name,
          amount: item.amount,
        }))
      : [{ name: '', amount: '' }],
  )
  const [errors, setErrors] = useState<string[]>([])
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateStep(index: number, value: string) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? value : step)),
    )
  }

  function updateIngredient(index: number, patch: Partial<IngredientRow>) {
    setIngredients((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError('')

    const parsed = recipeInputSchema.safeParse({
      title,
      description,
      steps,
      ingredients,
    })
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message))
      return
    }

    setErrors([])
    setSubmitting(true)
    try {
      await onSubmit(parsed.data)
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Something went wrong.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex flex-col gap-6" noValidate>
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <ul className="m-0 list-disc pl-5 text-sm">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger" role="alert">
          <p className="m-0 text-sm">{serverError}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="recipe-title" className="text-sm font-semibold">
          Title
        </label>
        <input
          id="recipe-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Classic Margherita Pizza"
          maxLength={120}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="recipe-description" className="text-sm font-semibold">
          Short description
        </label>
        <textarea
          id="recipe-description"
          className="textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A one- or two-sentence summary."
          maxLength={500}
          required
        />
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold">Steps</legend>
        <div className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="pill mt-3 shrink-0">{index + 1}</span>
              <textarea
                className="textarea flex-1"
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                placeholder="Describe this step…"
                maxLength={500}
                aria-label={`Step ${index + 1}`}
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary mt-1 px-3 py-2 text-sm"
                  onClick={() =>
                    setSteps((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  aria-label={`Remove step ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary mt-3 px-3 py-2 text-sm"
          onClick={() => setSteps((current) => [...current, ''])}
        >
          + Add step
        </button>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold">Ingredients</legend>
        <div className="flex flex-col gap-3">
          {ingredients.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="input flex-[2]"
                value={row.amount}
                onChange={(event) =>
                  updateIngredient(index, { amount: event.target.value })
                }
                placeholder="2 cups"
                maxLength={60}
                aria-label={`Ingredient ${index + 1} amount`}
              />
              <input
                className="input flex-[3]"
                value={row.name}
                onChange={(event) =>
                  updateIngredient(index, { name: event.target.value })
                }
                placeholder="flour"
                maxLength={100}
                aria-label={`Ingredient ${index + 1} name`}
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary px-3 py-2 text-sm"
                  onClick={() =>
                    setIngredients((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary mt-3 px-3 py-2 text-sm"
          onClick={() =>
            setIngredients((current) => [...current, { name: '', amount: '' }])
          }
        >
          + Add ingredient
        </button>
      </fieldset>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

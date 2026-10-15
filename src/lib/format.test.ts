import { describe, expect, it } from 'vitest'
import {
  formatIngredientAmount,
  formatRecipeDate,
  stepsToText,
  textToSteps,
  truncate,
} from './format'

describe('stepsToText / textToSteps', () => {
  it('joins steps with newlines and drops blanks', () => {
    expect(stepsToText(['  Mix  ', '', 'Bake'])).toBe('Mix\nBake')
  })

  it('splits back into a clean list', () => {
    expect(textToSteps('Mix\n\nBake\n')).toEqual(['Mix', 'Bake'])
  })

  it('round-trips', () => {
    const steps = ['One', 'Two', 'Three']
    expect(textToSteps(stepsToText(steps))).toEqual(steps)
  })
})

describe('formatIngredientAmount', () => {
  it('combines amount and name', () => {
    expect(formatIngredientAmount('2 cups', 'flour')).toBe('2 cups flour')
  })

  it('omits an empty amount', () => {
    expect(formatIngredientAmount('  ', 'basil')).toBe('basil')
  })
})

describe('truncate', () => {
  it('leaves short text unchanged', () => {
    expect(truncate('short', 20)).toBe('short')
  })

  it('collapses whitespace and truncates long text with an ellipsis', () => {
    const result = truncate('one    two   three four five', 12)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(12)
  })
})

describe('formatRecipeDate', () => {
  it('formats an ISO date', () => {
    expect(formatRecipeDate('2026-10-15T00:00:00.000Z')).toMatch(/2026/)
  })

  it('returns an empty string for invalid input', () => {
    expect(formatRecipeDate('not-a-date')).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { CONTENT, groupsFor, phrasesFor } from './index.ts'
import { validateContent } from './validate.ts'

describe('built-in content', () => {
  it('passes every integrity check', () => {
    expect(validateContent(CONTENT)).toEqual([])
  })

  it('has phrases for every section that shows a phrase bank', () => {
    for (const section of ['writing', 'speaking', 'vocabulary'] as const) {
      expect(groupsFor(section).length).toBeGreaterThan(0)
      expect(phrasesFor(section).length).toBeGreaterThan(0)
    }
  })
})

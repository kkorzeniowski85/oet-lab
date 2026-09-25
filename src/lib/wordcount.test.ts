import { describe, expect, it } from 'vitest'
import { countWords, letterBody } from './wordcount.ts'

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('I am  writing\nto refer\tMrs Carter.')).toBe(7)
  })

  it('counts numbers and hyphenated words as one word each', () => {
    expect(countWords('a 68-year-old woman, Hb 94 g/L')).toBe(6)
  })

  it('ignores stray punctuation and empty text', () => {
    expect(countWords(' – , ')).toBe(0)
    expect(countWords('')).toBe(0)
  })
})

describe('letterBody', () => {
  it('takes the text between the salutation and the closing', () => {
    const letter = 'Dr Smith\nAddress\n\nDear Dr Smith,\n\nFirst line.\n\nSecond line.\n\nYours sincerely,\n\nDoctor'
    expect(letterBody(letter)).toBe('First line.\n\nSecond line.')
  })

  it('leaves out the "Re:" line, which is a heading', () => {
    const letter = 'Dear Dr Smith,\n\nRe: Mr Brown, DOB 01/01/1950\n\nI am writing to refer Mr Brown.\n\nYours sincerely,'
    expect(letterBody(letter)).toBe('I am writing to refer Mr Brown.')
  })

  it('returns null without a salutation or closing', () => {
    expect(letterBody('Just some text')).toBeNull()
  })
})

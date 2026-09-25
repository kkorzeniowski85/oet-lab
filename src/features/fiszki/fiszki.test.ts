import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/index.ts'
import { fiszkiFile, fromOwnPhrase, fromPhrase } from './fiszki.ts'

const phrase = (id: string) => CONTENT.phrases.find((p) => p.id === id)!

describe('fiszki/v1 export', () => {
  it('keeps the original Fiszki reference for phrases that came from Fiszki', () => {
    const note = fromPhrase(phrase('core-m101'))
    expect(note).toMatchObject({
      front: 'I am writing to refer…',
      back: 'Piszę, aby skierować…',
      source_ref: 'oet-core/m101',
      kind: 'expression',
      note_type: 'basic_reversed',
      synonyms: ['I am writing to request a referral for', 'I would like to refer'],
      tags: ['oet', 'oet-lab'],
    })
    expect(note.example?.split('\n')).toHaveLength(3)
  })

  it('carries pronunciation and the formal version of informal phrases', () => {
    const note = fromPhrase(phrase('everyday-l1'))
    expect(note.pronunciation).toBe('/tə tʃeɪz ʌp/')
    expect(note.formal).toEqual(['to follow up on', 'to enquire about the status of'])
  })

  it('gives app-written phrases their own reference and one-way cards for sentences', () => {
    const note = fromPhrase(phrase('lab-s-open-2'))
    expect(note.source_ref).toBe('oet-lab/lab-s-open-2')
    expect(note.note_type).toBe('basic')
  })

  it('exports your own phrases without guessing their kind', () => {
    const note = fromOwnPhrase({ id: 'u1', group: 'w-request', en: 'Could you kindly', pl: 'Czy mógłby Pan', createdAt: 'x', updatedAt: 'x' })
    expect(note).toEqual({ front: 'Could you kindly', back: 'Czy mógłby Pan', tags: ['oet', 'oet-lab'], source_ref: 'oet-lab/mine/u1' })
  })

  it('wraps the notes in the envelope Fiszki expects', () => {
    const file = fiszkiFile([fromPhrase(phrase('core-m101'))])
    expect(file.format).toBe('fiszki/v1')
    expect(file.notes).toHaveLength(1)
    // Fiszki rejects a note without front or back.
    expect(file.notes.every((n) => n.front.trim() && n.back.trim())).toBe(true)
  })
})

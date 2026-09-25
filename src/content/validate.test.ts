import { describe, expect, it } from 'vitest'
import type { Content } from './types.ts'
import { validateContent } from './validate.ts'

function sample(): Content {
  return {
    phraseGroups: [{ id: 'w-purpose', section: 'writing', name: 'Purpose', description: 'Why you write.' }],
    phrases: [
      {
        id: 'p1',
        group: 'w-purpose',
        en: 'I am writing to refer',
        pl: 'Piszę, aby skierować',
        kind: 'expression',
        examples: ['I am writing to refer Mr Smith.'],
        source: 'test',
      },
    ],
    abbreviationGroups: [{ id: 'a-dosing', name: 'Dosing' }],
    abbreviations: [{ id: 'a1', group: 'a-dosing', abbr: 'BD', expansion: 'twice daily', source: 'test' }],
    criteria: [
      {
        id: 'c1',
        subtest: 'writing',
        name: 'Purpose',
        scaleMax: 3,
        bScore: 2,
        summary: 'Clear purpose.',
        checklist: ['Purpose in the first paragraph.'],
      },
    ],
    guides: [{ id: 'g1', section: 'reading', title: 'Part A', blocks: [{ type: 'text', text: 'Read fast.' }] }],
    writingCases: [
      {
        id: 'wc1',
        title: 'Referral',
        writer: 'You are a GP.',
        task: 'Write a referral letter.',
        notes: [
          { heading: 'Patient', lines: ['Mrs Smith, 68'] },
          { heading: 'Plan', lines: ['Refer'] },
        ],
        tags: [],
      },
    ],
    rolePlays: [
      {
        id: 'rp1',
        title: 'New diagnosis',
        setting: 'General practice',
        candidate: ['You are a GP.', 'Explain the diagnosis.', 'Check understanding.'],
        otherParty: ['You are the patient.', 'You are worried.', 'Ask about insulin.'],
        focus: ['p1'],
      },
    ],
  }
}

const letter = (words: number) =>
  `Dr Jones\n\nDear Dr Jones,\n\n${Array.from({ length: words }, () => 'word').join(' ')}\n\nYours sincerely,\n\nDoctor`

describe('validateContent', () => {
  it('accepts valid content', () => {
    expect(validateContent(sample())).toEqual([])
  })

  it('reports a duplicate id across content types', () => {
    const c = sample()
    c.abbreviations[0].id = 'p1'
    expect(validateContent(c)).toContain('abbreviation p1: duplicate id')
  })

  it('reports a phrase in an unknown group', () => {
    const c = sample()
    c.phrases[0].group = 'w-nowhere'
    expect(validateContent(c)).toContain('phrase p1: unknown group "w-nowhere"')
  })

  it('reports a group with no phrases', () => {
    const c = sample()
    c.phraseGroups.push({ id: 'w-empty', section: 'writing', name: 'Empty', description: 'Nothing.' })
    expect(validateContent(c)).toContain('group w-empty: has no phrases')
  })

  it('reports missing translations and examples', () => {
    const c = sample()
    c.phrases[0].pl = ' '
    c.phrases[0].examples = []
    expect(validateContent(c)).toEqual(['phrase p1: missing pl', 'phrase p1: needs at least one example'])
  })

  it('reports a B score outside the scale', () => {
    const c = sample()
    c.criteria[0].bScore = 5
    expect(validateContent(c)).toContain('criterion c1: bScore outside the scale')
  })

  it('reports speaking criteria without a family', () => {
    const c = sample()
    c.criteria[0].subtest = 'speaking'
    expect(validateContent(c)).toContain('criterion c1: speaking criteria need a family')
  })

  it('reports an abbreviation listed twice', () => {
    const c = sample()
    c.abbreviations.push({ id: 'a2', group: 'a-dosing', abbr: 'BD', expansion: 'twice a day', source: 'test' })
    expect(validateContent(c)).toContain('abbreviation a2: "BD" listed twice')
  })

  it('accepts a model letter of the right length', () => {
    const c = sample()
    c.writingCases[0].modelLetter = letter(190)
    expect(validateContent(c)).toEqual([])
  })

  it('reports a model letter that is too long or has no closing', () => {
    const c = sample()
    c.writingCases[0].modelLetter = letter(240)
    expect(validateContent(c)).toContain('writing case wc1: model letter body has 240 words (170–210 expected)')
    c.writingCases[0].modelLetter = 'Dear Dr Jones, no closing'
    expect(validateContent(c)).toContain('writing case wc1: model letter needs a "Dear" line and a "Yours" line')
  })

  it('reports a writing case with too few note sections', () => {
    const c = sample()
    c.writingCases[0].notes = c.writingCases[0].notes.slice(0, 1)
    expect(validateContent(c)).toContain('writing case wc1: needs at least two note sections')
  })

  it('reports a role-play with a thin card or an unknown phrase', () => {
    const c = sample()
    c.rolePlays[0].otherParty = ['You are the patient.']
    c.rolePlays[0].focus = ['nope']
    expect(validateContent(c)).toEqual([
      'role-play rp1: otherParty card needs at least three lines',
      'role-play rp1: unknown focus phrase "nope"',
    ])
  })

  it('reports a fact without a source', () => {
    const c = sample()
    c.guides[0].blocks.push({ type: 'fact', text: 'Part A lasts 15 minutes.', source: '' })
    expect(validateContent(c)).toContain('guide g1 block 1: missing source')
  })
})

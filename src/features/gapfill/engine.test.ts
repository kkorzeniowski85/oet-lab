import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/index.ts'
import { checkAnswer, findGap, phraseForms } from './engine.ts'

describe('phraseForms', () => {
  const texts = (p: string) => phraseForms(p).map((f) => f.text)

  it('drops the infinitive marker, brackets, trailing ellipses and question marks', () => {
    expect(phraseForms('to be commenced on (medication)')).toEqual([{ text: 'commenced on', verbFirst: true }])
    expect(texts('I am writing to refer...')).toEqual(['I am writing to refer'])
    expect(texts('Can you tell me a bit more about…?')).toEqual(['Can you tell me a bit more about'])
  })

  it('keeps an ellipsis inside a phrase as a slot for a word or two', () => {
    expect(texts('Hello, I’m Dr …, one of the doctors')).toEqual(['Hello, I’m Dr … , one of the doctors'])
  })

  it('splits alternatives on a spaced slash only', () => {
    expect(texts('dizziness / light-headedness')).toEqual(['dizziness', 'light-headedness'])
    expect(texts('temporary/covering doctor')).toEqual(['temporary/covering doctor'])
  })
})

describe('findGap', () => {
  const rebuilt = (g: { before: string; answer: string; after: string }) => g.before + g.answer + g.after

  it('finds an inflected verb phrase', () => {
    const s = 'She was commenced on IV antibiotics.'
    const g = findGap('to be commenced on (medication)', s)
    expect(g?.answer).toBe('commenced on')
    expect(rebuilt(g!)).toBe(s)
  })

  it('finds a phrase at the start, ignoring case', () => {
    expect(findGap('in light of', 'In light of these findings, I would recommend a referral.')?.answer).toBe('In light of')
  })

  it('handles apostrophes and "someone"', () => {
    expect(findGap("to put someone in the picture", "Let me put you in the picture before the meeting.")?.answer).toBe(
      'put you in the picture',
    )
  })

  it('matches hyphenated and spaced forms alike', () => {
    expect(findGap('follow-up', 'Follow up was arranged in four weeks.')?.answer).toBe('Follow up')
  })

  it('inflects irregular and short verbs', () => {
    expect(findGap('to go pear-shaped', 'Things went pear-shaped in theatre.')?.answer).toBe('went pear-shaped')
    expect(findGap('to pop to the shops', "I'm just popping to the shops.")?.answer).toBe('popping to the shops')
  })

  it('treats a, an and the as the same word', () => {
    expect(findGap('to consent a patient', 'I need to consent the patient in bay three.')?.answer).toBe('consent the patient')
  })

  it('fills the slot marked by an ellipsis and allows commas', () => {
    const s = 'Hello, I’m Dr Nowak, one of the doctors looking after you on the ward.'
    expect(findGap('Hello, I’m Dr …, one of the doctors looking after you.', s)?.answer).toBe(
      'Hello, I’m Dr Nowak, one of the doctors looking after you',
    )
  })

  it('does not match inside another word', () => {
    expect(findGap('rigors', 'The patient reported rigorous exercise.')).toBeNull()
  })

  it('returns null when the phrase is not in the sentence', () => {
    expect(findGap('pyrexia', 'The patient was afebrile.')).toBeNull()
  })

  it('finds a gap in most built-in phrases', () => {
    const phrases = CONTENT.phrases
    const usable = phrases.filter((p) => p.examples.some((e) => findGap(p.en, e)))
    // Phrases without a usable example are simply left out of gap-fill.
    expect(usable.length / phrases.length).toBeGreaterThan(0.95)
    for (const p of usable) {
      for (const e of p.examples) {
        const g = findGap(p.en, e)
        if (g) expect(g.before + g.answer + g.after).toBe(e)
      }
    }
  })
})

describe('checkAnswer', () => {
  it('ignores case, punctuation, hyphens and spacing', () => {
    expect(checkAnswer('  In Light of,', 'in light of')).toBe('correct')
    expect(checkAnswer('follow up', 'follow-up')).toBe('correct')
    expect(checkAnswer("I’ve", "I've")).toBe('correct')
  })

  it('calls a small slip close, not correct', () => {
    expect(checkAnswer('haemoptisis', 'haemoptysis')).toBe('close')
  })

  it('marks a different answer wrong', () => {
    expect(checkAnswer('consequently', 'in light of')).toBe('wrong')
    expect(checkAnswer('', 'in light of')).toBe('wrong')
  })
})

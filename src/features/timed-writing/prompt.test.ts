import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/index.ts'
import { bodyWords, evaluationPrompt } from './prompt.ts'

const kase = CONTENT.writingCases.find((c) => c.id === 'wc-colorectal-referral')!
const letter = 'Dear Mr Hughes,\n\nRe: Mrs Carter\n\nI am writing to refer Mrs Carter urgently.\n\nYours sincerely,\nDoctor'

describe('evaluationPrompt', () => {
  const prompt = evaluationPrompt(kase, letter, 'English')

  it('contains the task, the case notes and the letter', () => {
    expect(prompt).toContain(kase.task)
    expect(prompt).toContain('- FIT: 180 µg Hb/g faeces (positive; threshold 10)')
    expect(prompt).toContain('I am writing to refer Mrs Carter urgently.')
  })

  it('names all six criteria with their scales', () => {
    for (const c of ['Purpose (0–3)', 'Content (0–7)', 'Conciseness & Clarity (0–7)', 'Genre & Style (0–7)', 'Organisation & Layout (0–7)', 'Language (0–7)'])
      expect(prompt).toContain(c)
  })

  it('states the body word count and the language of the feedback', () => {
    expect(prompt).toContain('MY LETTER (8 words in the body)')
    expect(evaluationPrompt(kase, letter, 'Polish')).toContain('Reply in Polish')
  })

  it('works for your own case written as plain text', () => {
    const own = evaluationPrompt({ title: 'Own', task: 'Refer to cardiology', notes: 'Chest pain on exertion' }, letter, 'English')
    expect(own).toContain('CASE NOTES\nChest pain on exertion')
  })
})

describe('bodyWords', () => {
  it('counts the whole text when there is no letter frame yet', () => {
    expect(bodyWords('Just a draft sentence')).toBe(4)
  })
})

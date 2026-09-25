import { countWords, letterBody } from '../../lib/wordcount.ts'
import { notesAsText, type ResolvedCase } from './cases.ts'

export type FeedbackLanguage = 'English' | 'Polish'

export function bodyWords(letter: string): number {
  return countWords(letterBody(letter) ?? letter)
}

/** A prompt to paste into a Claude chat; the app itself never calls an AI service (D16). */
export function evaluationPrompt(kase: ResolvedCase, letter: string, language: FeedbackLanguage): string {
  return [
    'You are an experienced OET Writing assessor for Medicine. Assess my letter strictly, using the six OET Writing criteria:',
    'Purpose (0–3), Content (0–7), Conciseness & Clarity (0–7), Genre & Style (0–7), Organisation & Layout (0–7), Language (0–7).',
    'Grade B usually needs at least 2 for Purpose and 5 for each of the other criteria.',
    '',
    `Reply in ${language}, in this order:`,
    '1. Scores: one line per criterion, with the score and a one-sentence reason.',
    '2. Overall: would this letter reach grade B? Say it plainly.',
    '3. Language errors: every error as "original → correction". Mark the ones that interfere with meaning.',
    '4. Content: key information from the case notes that is missing or inaccurate, and anything included that the reader does not need.',
    '5. The two most important things to improve in my next letter.',
    '6. The word count of the body (the test asks for about 180–200 words).',
    '',
    'Be strict. If the letter would not reach grade B, say so directly.',
    '',
    'TASK',
    ...(kase.writer ? [kase.writer] : []),
    kase.task,
    '',
    'CASE NOTES',
    notesAsText(kase.notes),
    '',
    `MY LETTER (${bodyWords(letter)} words in the body)`,
    letter.trim(),
  ].join('\n')
}

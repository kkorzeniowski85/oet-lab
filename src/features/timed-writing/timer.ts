import type { LetterRecord } from '../../data/db.ts'

export const READING_MS = 5 * 60_000
export const WRITING_MS = 40 * 60_000

export type Clock =
  | { phase: 'reading'; remainingMs: number }
  | { phase: 'writing'; remainingMs: number; overtimeMs: number }
  | { phase: 'done' }

type Times = Pick<LetterRecord, 'phase' | 'readingStartedAt' | 'writingStartedAt'>

/** When writing began: explicitly, or automatically five minutes after reading started. */
export function writingStart(letter: Times): number {
  return letter.writingStartedAt ? Date.parse(letter.writingStartedAt) : Date.parse(letter.readingStartedAt) + READING_MS
}

// Derived from timestamps only, so a sleeping phone or a reload cannot make the clock drift.
export function clock(letter: Times, now: number): Clock {
  if (letter.phase === 'done') return { phase: 'done' }
  const start = writingStart(letter)
  if (letter.phase === 'reading' && now < start) return { phase: 'reading', remainingMs: start - now }
  const left = start + WRITING_MS - now
  return { phase: 'writing', remainingMs: Math.max(0, left), overtimeMs: Math.max(0, -left) }
}

/** Minutes spent writing, for the history list. */
export function writingMinutes(letter: Pick<LetterRecord, 'readingStartedAt' | 'writingStartedAt' | 'finishedAt' | 'phase'>): number | null {
  if (!letter.finishedAt) return null
  return Math.max(0, Math.round((Date.parse(letter.finishedAt) - writingStart(letter)) / 60_000))
}

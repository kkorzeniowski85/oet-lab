import { useEffect, useState } from 'react'
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

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Minutes spent writing, for the history list. */
export function writingMinutes(letter: Pick<LetterRecord, 'readingStartedAt' | 'writingStartedAt' | 'finishedAt' | 'phase'>): number | null {
  if (!letter.finishedAt) return null
  return Math.max(0, Math.round((Date.parse(letter.finishedAt) - writingStart(letter)) / 60_000))
}

/** Re-renders every second and immediately when the app comes back to the screen. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
  return now
}

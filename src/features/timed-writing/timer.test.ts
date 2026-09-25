import { describe, expect, it } from 'vitest'
import { formatClock } from '../../lib/time.ts'
import { clock, writingMinutes } from './timer.ts'

const T0 = Date.parse('2026-09-25T10:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const MIN = 60_000

describe('clock', () => {
  const reading = { phase: 'reading' as const, readingStartedAt: iso(T0) }

  it('counts down the five minutes of reading', () => {
    expect(clock(reading, T0 + 1 * MIN)).toEqual({ phase: 'reading', remainingMs: 4 * MIN })
  })

  it('switches to writing by itself after five minutes, even after a long sleep', () => {
    expect(clock(reading, T0 + 5 * MIN)).toEqual({ phase: 'writing', remainingMs: 40 * MIN, overtimeMs: 0 })
    expect(clock(reading, T0 + 25 * MIN)).toEqual({ phase: 'writing', remainingMs: 20 * MIN, overtimeMs: 0 })
  })

  it('starts the 40 minutes early when writing starts early', () => {
    const early = { phase: 'writing' as const, readingStartedAt: iso(T0), writingStartedAt: iso(T0 + 2 * MIN) }
    expect(clock(early, T0 + 12 * MIN)).toEqual({ phase: 'writing', remainingMs: 30 * MIN, overtimeMs: 0 })
  })

  it('reports time over the limit instead of going negative', () => {
    expect(clock(reading, T0 + 48 * MIN)).toEqual({ phase: 'writing', remainingMs: 0, overtimeMs: 3 * MIN })
  })

  it('stops for a finished letter', () => {
    expect(clock({ ...reading, phase: 'done' }, T0 + 10 * MIN)).toEqual({ phase: 'done' })
  })
})

describe('formatClock', () => {
  it('rounds up to whole seconds', () => {
    expect(formatClock(4 * MIN + 59_001)).toBe('5:00')
    expect(formatClock(61_000)).toBe('1:01')
    expect(formatClock(0)).toBe('0:00')
  })
})

describe('writingMinutes', () => {
  it('measures from the start of writing to the finish', () => {
    expect(
      writingMinutes({ phase: 'done', readingStartedAt: iso(T0), finishedAt: iso(T0 + 43 * MIN) }),
    ).toBe(38)
  })

  it('is unknown until the letter is finished', () => {
    expect(writingMinutes({ phase: 'writing', readingStartedAt: iso(T0) })).toBeNull()
  })
})

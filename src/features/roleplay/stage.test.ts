import { describe, expect, it } from 'vitest'
import { stage } from './stage.ts'

const MIN = 60_000

describe('stage', () => {
  const run = { startedAt: 0, speakingAt: null }

  it('counts down three minutes of preparation', () => {
    expect(stage(run, 1 * MIN)).toEqual({ speakingAt: null, left: 2 * MIN })
  })

  it('moves to speaking by itself when preparation ends', () => {
    expect(stage(run, 4 * MIN)).toEqual({ speakingAt: 3 * MIN, left: 4 * MIN })
  })

  it('starts the five minutes early when you start early', () => {
    expect(stage({ startedAt: 0, speakingAt: 1 * MIN }, 2 * MIN)).toEqual({ speakingAt: 1 * MIN, left: 4 * MIN })
  })

  it('goes negative after the five minutes', () => {
    expect(stage(run, 9 * MIN)).toEqual({ speakingAt: 3 * MIN, left: -1 * MIN })
  })
})

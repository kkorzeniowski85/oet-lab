import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '../../data/db.ts'
import { buildPool, choices, pickRound, shuffle, weakIds, type Source } from './round.ts'

// Deterministic "random" numbers for repeatable tests.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sources: Source[] = [
  { id: 'a', group: 'g1', en: 'in light of', pl: 'w świetle', examples: ['In light of this, we stopped.', 'No match here.'] },
  { id: 'b', group: 'g1', en: 'consequently', pl: 'w konsekwencji', examples: ['Consequently, she was admitted.'] },
  { id: 'c', group: 'g2', en: 'to be commenced on', pl: 'włączony', examples: ['He was commenced on aspirin.'] },
  { id: 'd', group: 'g2', en: 'pyrexia', pl: 'gorączka', examples: ['She was afebrile.'] },
  {
    id: 'e',
    group: 'g1',
    en: 'should you have any questions, please do not hesitate to contact me',
    pl: 'w razie pytań',
    examples: ['Should you have any questions, please do not hesitate to contact me.'],
  },
]

describe('buildPool', () => {
  it('uses only sentences that contain the phrase, one item per phrase', () => {
    const pool = buildPool(sources, 'choose', seeded(1))
    expect(pool.map((p) => p.id)).toEqual(['a', 'b', 'c', 'e'])
    expect(pool.find((p) => p.id === 'a')?.sentence).toBe('In light of this, we stopped.')
  })

  it('leaves long answers out of typing mode', () => {
    expect(buildPool(sources, 'type', seeded(1)).map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('weakIds', () => {
  const attempt = (itemId: string, correct: boolean, at: string): AttemptRecord => ({
    id: `${itemId}-${at}`,
    itemId,
    correct,
    exercise: 'gapfill',
    answer: '',
    mode: 'type',
    createdAt: at,
    updatedAt: at,
  })

  it('flags phrases below 70% over the last five tries', () => {
    const attempts = [
      attempt('a', false, '01'),
      attempt('a', true, '02'),
      attempt('b', true, '01'),
      attempt('b', true, '02'),
      attempt('b', false, '03'),
      attempt('b', true, '04'),
    ]
    expect([...weakIds(attempts)]).toEqual(['a'])
  })

  it('forgets old mistakes once the last five are mostly right', () => {
    const attempts = ['01', '02', '03'].map((t) => attempt('a', false, t))
    attempts.push(...['04', '05', '06', '07', '08'].map((t) => attempt('a', true, t)))
    expect(weakIds(attempts).size).toBe(0)
  })
})

describe('rounds and choices', () => {
  it('picks at most the round size without repeats', () => {
    const pool = buildPool(sources, 'choose', seeded(2))
    const round = pickRound(pool, seeded(3), 3)
    expect(round).toHaveLength(3)
    expect(new Set(round.map((r) => r.id)).size).toBe(3)
  })

  it('offers the right answer among distinct options', () => {
    const pool = buildPool(sources, 'choose', seeded(4))
    const item = pool.find((p) => p.id === 'b')!
    const options = choices(item, pool, seeded(5))
    expect(options).toContain('Consequently')
    expect(options).toHaveLength(4)
    expect(new Set(options.map((o) => o.toLowerCase())).size).toBe(4)
  })

  it('shuffles without losing items', () => {
    expect(shuffle([1, 2, 3, 4], seeded(6)).sort()).toEqual([1, 2, 3, 4])
  })
})

import type { AttemptRecord } from '../../data/db.ts'
import { findGap, type Gap } from './engine.ts'

export interface GapItem {
  id: string
  group: string
  en: string
  pl: string
  sentence: string
  gap: Gap
}

export interface Source {
  id: string
  group: string
  en: string
  pl: string
  examples: string[]
}

export type Rng = () => number
export type Mode = 'type' | 'choose'

/** Typing a whole sentence from memory is not a gap-fill; longer answers are for "choose" only. */
export const MAX_TYPED_WORDS = 6
export const ROUND_SIZE = 10
const WEAK_BELOW = 0.7
const RECENT = 5

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const words = (s: string) => s.trim().split(/\s+/).length

/** One item per phrase, from a random example in which the phrase can be found. */
export function buildPool(sources: Source[], mode: Mode, rng: Rng): GapItem[] {
  const pool: GapItem[] = []
  for (const s of sources) {
    const candidates = s.examples
      .map((sentence) => ({ sentence, gap: findGap(s.en, sentence) }))
      .filter((c): c is { sentence: string; gap: Gap } => c.gap !== null)
      .filter((c) => mode === 'choose' || words(c.gap.answer) <= MAX_TYPED_WORDS)
    if (candidates.length === 0) continue
    const pick = candidates[Math.floor(rng() * candidates.length)]
    pool.push({ id: s.id, group: s.group, en: s.en, pl: s.pl, ...pick })
  }
  return pool
}

/** Phrases answered at least once and right less than 70% of the time in the last five tries. */
export function weakIds(attempts: AttemptRecord[]): Set<string> {
  const byItem = new Map<string, AttemptRecord[]>()
  for (const a of attempts) byItem.set(a.itemId, [...(byItem.get(a.itemId) ?? []), a])
  const weak = new Set<string>()
  for (const [id, list] of byItem) {
    const recent = list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-RECENT)
    if (recent.filter((a) => a.correct).length / recent.length < WEAK_BELOW) weak.add(id)
  }
  return weak
}

export function pickRound(pool: GapItem[], rng: Rng, size = ROUND_SIZE): GapItem[] {
  return shuffle(pool, rng).slice(0, size)
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '')

/** The right answer and three others, preferably from the same group. */
export function choices(item: GapItem, pool: GapItem[], rng: Rng): string[] {
  const others = shuffle(
    pool.filter((p) => p.id !== item.id),
    rng,
  ).sort((a, b) => Number(b.group === item.group) - Number(a.group === item.group))
  const picked = [item.gap.answer]
  for (const o of others) {
    if (picked.length === 4) break
    if (!picked.some((p) => key(p) === key(o.gap.answer))) picked.push(o.gap.answer)
  }
  return shuffle(picked, rng)
}

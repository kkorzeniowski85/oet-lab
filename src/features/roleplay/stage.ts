export const PREP_MS = 3 * 60_000
export const SPEAK_MS = 5 * 60_000

/**
 * Preparation ends on its own after three minutes, as in the test.
 * `left` is negative once the five minutes of speaking have run out.
 */
export function stage(run: { startedAt: number; speakingAt: number | null }, now: number): { speakingAt: number | null; left: number } {
  const speakingAt = run.speakingAt ?? (now - run.startedAt >= PREP_MS ? run.startedAt + PREP_MS : null)
  return speakingAt === null
    ? { speakingAt, left: run.startedAt + PREP_MS - now }
    : { speakingAt, left: speakingAt + SPEAK_MS - now }
}

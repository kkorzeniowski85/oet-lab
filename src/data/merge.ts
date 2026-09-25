import type { BackupFile } from './backup.ts'
import { USER_STORES, type Stamped, type UserStore } from './db.ts'

export type Data = BackupFile['data']

export interface StoreReport {
  /** New on this device. */
  added: number
  /** Replaced by a newer version from the file. */
  updated: number
  /** Deletions carried over from the other device. */
  removed: number
  /** This device already had a newer version. */
  kept: number
  /** Identical on both sides. */
  unchanged: number
}

export type MergeReport = { [S in UserStore]: StoreReport }

/** Stable text of a record (sorted keys), so the same content always compares the same way. */
function canonical(record: object): string {
  return JSON.stringify(record, (_key, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : value,
  )
}

/**
 * Which version survives. The newer change wins; a deletion is a change like any other.
 * Equal times fall back to comparing the content, so both devices pick the same winner.
 */
export function winner<T extends Stamped>(mine: T, theirs: T): 'mine' | 'theirs' | 'same' {
  if (mine.updatedAt !== theirs.updatedAt) return theirs.updatedAt > mine.updatedAt ? 'theirs' : 'mine'
  const a = canonical(mine)
  const b = canonical(theirs)
  if (a === b) return 'same'
  return b > a ? 'theirs' : 'mine'
}

/** Merges a file into this device's data. Nothing is ever lost silently: every record ends up somewhere in the report. */
export function merge(local: Data, incoming: Data): { data: Data; report: MergeReport; changes: Data } {
  const data = {} as Data
  const changes = {} as Data
  const report = {} as MergeReport
  for (const store of USER_STORES) {
    const byId = new Map<string, Stamped>(local[store].map((r) => [r.id, r]))
    const changed: Stamped[] = []
    const r: StoreReport = { added: 0, updated: 0, removed: 0, kept: 0, unchanged: 0 }
    for (const theirs of incoming[store] as Stamped[]) {
      const mine = byId.get(theirs.id)
      const take = () => {
        byId.set(theirs.id, theirs)
        changed.push(theirs)
      }
      if (!mine) {
        take()
        // A deletion of something this device never had changes nothing visible.
        if (theirs.deletedAt) r.unchanged++
        else r.added++
        continue
      }
      const w = winner(mine, theirs)
      if (w === 'theirs') {
        take()
        if (theirs.deletedAt) r.removed++
        else r.updated++
      } else if (w === 'mine') r.kept++
      else r.unchanged++
    }
    ;(data[store] as Stamped[]) = [...byId.values()]
    ;(changes[store] as Stamped[]) = changed
    report[store] = r
  }
  return { data, report, changes }
}

export function totalChanges(report: MergeReport): number {
  return USER_STORES.reduce((n, s) => n + report[s].added + report[s].updated + report[s].removed, 0)
}

import { SECTIONS } from '../app/sections.ts'
import { DB_VERSION, USER_STORES, db, type UserRecords, type UserStore } from './db.ts'
import { notify } from './records.ts'

export const FORMAT = 'oet-lab/v1'

export interface BackupFile {
  format: typeof FORMAT
  schema: number
  exportedAt: string
  data: { [S in UserStore]: UserRecords[S][] }
}

/** Everything the user made, including deletion markers (needed to merge files later). */
export async function exportData(): Promise<BackupFile> {
  const database = await db()
  const data = {} as BackupFile['data']
  for (const store of USER_STORES) (data[store] as unknown[]) = await database.getAll(store)
  return { format: FORMAT, schema: DB_VERSION, exportedAt: new Date().toISOString(), data }
}

type Check = (r: Record<string, unknown>) => boolean
const str = (v: unknown) => typeof v === 'string'
const optStr = (v: unknown) => v === undefined || typeof v === 'string'
const stamped: Check = (r) =>
  str(r.id) && (r.id as string).length > 0 && str(r.createdAt) && str(r.updatedAt) && optStr(r.deletedAt)
const bool = (v: unknown) => typeof v === 'boolean'
const strList = (v: unknown) => Array.isArray(v) && v.every(str)
const oneOf = (v: unknown, options: string[]) => options.includes(v as string)
const SECTION_IDS: string[] = SECTIONS.map((s) => s.id)
const CHECKS: { [S in UserStore]: Check } = {
  notes: (r) => stamped(r) && SECTION_IDS.includes(r.section as string) && str(r.title) && str(r.body),
  customPhrases: (r) => stamped(r) && str(r.group) && str(r.en) && str(r.pl) && optStr(r.example),
  attempts: (r) =>
    stamped(r) && r.exercise === 'gapfill' && str(r.itemId) && bool(r.correct) && str(r.answer) && oneOf(r.mode, ['type', 'choose']),
  letters: (r) =>
    stamped(r) &&
    oneOf(r.caseKind, ['builtin', 'custom']) &&
    str(r.caseId) &&
    str(r.text) &&
    oneOf(r.phase, ['reading', 'writing', 'done']) &&
    str(r.readingStartedAt) &&
    optStr(r.writingStartedAt) &&
    optStr(r.finishedAt) &&
    strList(r.selfCheck) &&
    optStr(r.evaluation),
  customCases: (r) => stamped(r) && str(r.title) && str(r.task) && str(r.notes),
  roleplaySessions: (r) =>
    stamped(r) && str(r.cardId) && str(r.startedAt) && optStr(r.finishedAt) && strList(r.selfCheck) && optStr(r.reflection),
  fiszkiExports: (r) => stamped(r) && strList(r.itemIds) && oneOf(r.via, ['share', 'download', 'copy']),
}

export type Parsed = { ok: true; file: BackupFile } | { ok: false; error: string }

const NOT_A_BACKUP = 'This file is not an OET Lab backup.'

export function parseBackup(text: string): Parsed {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: NOT_A_BACKUP }
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: NOT_A_BACKUP }
  const f = raw as Record<string, unknown>
  if (f.format !== FORMAT || typeof f.schema !== 'number' || typeof f.data !== 'object' || f.data === null)
    return { ok: false, error: NOT_A_BACKUP }
  if (f.schema > DB_VERSION)
    return {
      ok: false,
      error: 'This backup was made by a newer version of OET Lab. Reload the app to update it, then try again.',
    }

  const source = f.data as Record<string, unknown>
  const data = {} as BackupFile['data']
  let damaged = 0
  for (const store of USER_STORES) {
    // A store added in a later schema is simply absent from older backups.
    const list = source[store] ?? []
    if (!Array.isArray(list)) return { ok: false, error: NOT_A_BACKUP }
    damaged += list.filter((r) => typeof r !== 'object' || r === null || !CHECKS[store](r)).length
    ;(data[store] as unknown[]) = list
  }
  if (damaged > 0)
    return { ok: false, error: `This backup is damaged: ${damaged} ${damaged === 1 ? 'entry' : 'entries'} cannot be read. Nothing was changed.` }

  return {
    ok: true,
    file: { format: FORMAT, schema: f.schema, exportedAt: str(f.exportedAt) ? (f.exportedAt as string) : '', data },
  }
}

/** Replaces everything in one transaction: either the whole backup lands or nothing changes. */
export async function restoreBackup(file: BackupFile): Promise<void> {
  const database = await db()
  const tx = database.transaction([...USER_STORES], 'readwrite')
  await Promise.all(
    USER_STORES.flatMap((store) => {
      const target = tx.objectStore(store)
      return [target.clear(), ...file.data[store].map((r) => target.put(r as never))]
    }),
  )
  await tx.done
  for (const store of USER_STORES) notify(store)
}

export function liveCounts(data: BackupFile['data']): { [S in UserStore]: number } {
  const counts = {} as { [S in UserStore]: number }
  for (const store of USER_STORES) counts[store] = data[store].filter((r) => !r.deletedAt).length
  return counts
}

const NOUNS: { [S in UserStore]: [string, string] } = {
  notes: ['note', 'notes'],
  customPhrases: ['phrase', 'phrases'],
  letters: ['letter', 'letters'],
  customCases: ['own case', 'own cases'],
  attempts: ['gap-fill answer', 'gap-fill answers'],
  roleplaySessions: ['role-play', 'role-plays'],
  fiszkiExports: ['sending to Fiszki', 'sendings to Fiszki'],
}

/** "2 notes, 1 letter" — or "nothing" when every store is empty. */
export function describeCounts(counts: { [S in UserStore]: number }): string {
  const parts = USER_STORES.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${NOUNS[s][counts[s] === 1 ? 0 : 1]}`)
  return parts.length ? parts.join(', ') : 'nothing'
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `oet-lab-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

/** Days since the last backup when a reminder is due; null when it is not. */
export function backupDue(lastBackupAt: string | null | undefined, hasData: boolean, now = new Date()): { days: number | null } | null {
  if (!hasData) return null
  if (!lastBackupAt) return { days: null }
  const days = Math.floor((now.getTime() - new Date(lastBackupAt).getTime()) / 86_400_000)
  return days >= 7 ? { days } : null
}

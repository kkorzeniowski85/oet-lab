import { exportData, restoreBackup, type BackupFile } from './backup.ts'
import { USER_STORES, db } from './db.ts'
import { merge, totalChanges, type MergeReport } from './merge.ts'
import { getSetting, notify, setSetting } from './records.ts'

const SNAPSHOT = 'importSnapshot'

export interface Snapshot {
  takenAt: string
  source: string
  file: BackupFile
}

export async function previewImport(file: BackupFile): Promise<MergeReport> {
  return merge((await exportData()).data, file.data).report
}

/** Merges the file into this device, keeping a snapshot of the state before it for Undo. */
export async function applyImport(file: BackupFile, source: string): Promise<MergeReport> {
  const before = await exportData()
  const { report, changes } = merge(before.data, file.data)
  if (totalChanges(report) === 0) return report

  await setSetting(SNAPSHOT, { takenAt: new Date().toISOString(), source, file: before } satisfies Snapshot)
  const tx = (await db()).transaction([...USER_STORES], 'readwrite')
  await Promise.all(USER_STORES.flatMap((store) => changes[store].map((r) => tx.objectStore(store).put(r as never))))
  await tx.done
  for (const store of USER_STORES) if (changes[store].length > 0) notify(store)
  return report
}

export function getSnapshot(): Promise<Snapshot | null | undefined> {
  return getSetting<Snapshot | null>(SNAPSHOT)
}

/** Puts everything back as it was before the last import. */
export async function undoImport(): Promise<boolean> {
  const snapshot = await getSnapshot()
  if (!snapshot) return false
  await restoreBackup(snapshot.file)
  await setSetting(SNAPSHOT, null)
  return true
}

import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportData, type BackupFile } from './backup.ts'
import { closeDB } from './db.ts'
import { totalChanges } from './merge.ts'
import { listRecords, saveRecord } from './records.ts'
import { applyImport, getSnapshot, previewImport, undoImport } from './transfer.ts'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(async () => {
  await closeDB()
})

/** Builds a file as another device would have exported it. */
async function fileFromAnotherDevice(): Promise<BackupFile> {
  await saveRecord('notes', { section: 'speaking', title: 'From the laptop', body: 'Signpost changes of topic.' })
  await saveRecord('letters', {
    caseKind: 'builtin',
    caseId: 'wc-af-referral',
    text: 'Dear Dr Shah,',
    phase: 'done',
    readingStartedAt: '2026-09-20T10:00:00.000Z',
    finishedAt: '2026-09-20T10:45:00.000Z',
    selfCheck: [],
  })
  const file = await exportData()
  await closeDB()
  globalThis.indexedDB = new IDBFactory()
  return file
}

describe('import with merge', () => {
  it('adds the other device’s work next to this device’s own', async () => {
    const file = await fileFromAnotherDevice()
    await saveRecord('notes', { section: 'writing', title: 'On the phone', body: 'Purpose first.' })

    expect((await previewImport(file)).notes.added).toBe(1)
    const report = await applyImport(file, 'progress.txt')

    expect(report.letters.added).toBe(1)
    expect((await listRecords('notes')).map((n) => n.title).sort()).toEqual(['From the laptop', 'On the phone'])
  })

  it('changes nothing and keeps no snapshot when the file brings nothing new', async () => {
    const file = await fileFromAnotherDevice()
    await applyImport(file, 'first.txt')
    const first = await getSnapshot()
    const again = await applyImport(file, 'again.txt')
    expect(totalChanges(again)).toBe(0)
    expect((await getSnapshot())?.source).toBe(first?.source)
  })

  it('undo puts back exactly what was there before the import', async () => {
    const file = await fileFromAnotherDevice()
    await saveRecord('notes', { section: 'writing', title: 'On the phone', body: 'Purpose first.' })
    const before = await exportData()

    await applyImport(file, 'progress.txt')
    expect(await undoImport()).toBe(true)

    const after = await exportData()
    expect(after.data).toEqual(before.data)
    expect(await getSnapshot()).toBeNull()
    expect(await undoImport()).toBe(false)
  })
})

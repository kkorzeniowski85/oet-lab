import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { backupDue, backupFileName, describeCounts, exportData, liveCounts, parseBackup, restoreBackup } from './backup.ts'
import { DB_VERSION, closeDB, db } from './db.ts'
import { deleteRecord, listRecords, saveRecord } from './records.ts'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(async () => {
  await closeDB()
})

async function seed() {
  await saveRecord('notes', { section: 'writing', title: 'Purpose', body: 'First two lines.' })
  const gone = await saveRecord('notes', { section: 'reading', title: '', body: 'To delete' })
  await deleteRecord('notes', gone.id)
  await saveRecord('customPhrases', { group: 'w-purpose', en: 'I am writing to', pl: 'Piszę, aby', example: 'I am writing to refer…' })
}

describe('backup round trip', () => {
  it('restores exactly what was exported, deletion markers included', async () => {
    await seed()
    const exported = await exportData()
    const text = JSON.stringify(exported)

    await saveRecord('notes', { section: 'speaking', title: 'Later', body: 'Written after the backup' })
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    await restoreBackup(parsed.file)

    const database = await db()
    expect(await database.getAll('notes')).toEqual(exported.data.notes)
    expect(await database.getAll('customPhrases')).toEqual(exported.data.customPhrases)
    expect((await listRecords('notes')).map((n) => n.title)).toEqual(['Purpose'])
    expect(liveCounts(parsed.file.data)).toMatchObject({ notes: 1, customPhrases: 1, letters: 0 })
  })

  it('declares the format and the schema version', async () => {
    const exported = await exportData()
    expect(exported.format).toBe('oet-lab/v1')
    expect(exported.schema).toBe(DB_VERSION)
  })
})

describe('parseBackup', () => {
  const valid = () => ({
    format: 'oet-lab/v1',
    schema: 1,
    exportedAt: '2026-09-25T10:00:00.000Z',
    data: {
      notes: [{ id: 'n1', section: 'writing', title: 't', body: 'b', createdAt: 'x', updatedAt: 'x' }],
      customPhrases: [],
    },
  })

  it('accepts a valid backup', () => {
    expect(parseBackup(JSON.stringify(valid())).ok).toBe(true)
  })

  it('refuses something that is not JSON or not ours', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, error: 'This file is not an OET Lab backup.' })
    expect(parseBackup(JSON.stringify({ format: 'fiszki/v1', notes: [] })).ok).toBe(false)
  })

  it('refuses a backup from a newer version', () => {
    const r = parseBackup(JSON.stringify({ ...valid(), schema: DB_VERSION + 1 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('newer version')
  })

  it('refuses a damaged backup and says nothing changed', () => {
    const f = valid()
    ;(f.data.notes[0] as Record<string, unknown>).section = 'chemistry'
    const r = parseBackup(JSON.stringify(f))
    expect(r).toEqual({ ok: false, error: 'This backup is damaged: 1 entry cannot be read. Nothing was changed.' })
  })

  it('treats a store missing from an older backup as empty', () => {
    const f = valid() as { data: Record<string, unknown> }
    delete f.data.customPhrases
    const r = parseBackup(JSON.stringify(f))
    expect(r.ok && r.file.data.customPhrases).toEqual([])
  })
})

describe('backupDue', () => {
  const now = new Date('2026-09-25T12:00:00Z')

  it('stays quiet when there is nothing to lose', () => {
    expect(backupDue(null, false, now)).toBeNull()
  })

  it('reminds when there has never been a backup', () => {
    expect(backupDue(undefined, true, now)).toEqual({ days: null })
  })

  it('reminds after seven days, not before', () => {
    expect(backupDue('2026-09-19T12:00:01Z', true, now)).toBeNull()
    expect(backupDue('2026-09-18T12:00:00Z', true, now)).toEqual({ days: 7 })
  })
})

describe('describeCounts', () => {
  const none = { notes: 0, customPhrases: 0, attempts: 0, letters: 0, customCases: 0, roleplaySessions: 0 }

  it('lists only what exists, with singular and plural', () => {
    expect(describeCounts({ ...none, notes: 2, letters: 1 })).toBe('2 notes, 1 letter')
  })

  it('says nothing for an empty device', () => {
    expect(describeCounts(none)).toBe('nothing')
  })
})

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(new Date(2026, 8, 5, 23, 30))).toBe('oet-lab-backup-2026-09-05.json')
  })
})

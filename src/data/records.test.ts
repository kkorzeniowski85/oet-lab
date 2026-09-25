import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDB, db } from './db.ts'
import { deleteRecord, getSetting, listRecords, onChange, saveRecord, setSetting } from './records.ts'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(async () => {
  vi.useRealTimers()
  await closeDB()
})

const note = { section: 'writing' as const, title: 'Openings', body: 'Start with the purpose.' }

describe('records', () => {
  it('saves a new record with an id and timestamps', async () => {
    const saved = await saveRecord('notes', note)
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(saved.createdAt).toBe(saved.updatedAt)
    expect(await listRecords('notes')).toEqual([saved])
  })

  it('keeps createdAt and moves updatedAt when editing', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T10:00:00Z'))
    const first = await saveRecord('notes', note)
    vi.setSystemTime(new Date('2026-09-25T11:00:00Z'))
    const edited = await saveRecord('notes', { ...note, id: first.id, body: 'Purpose first.' })
    expect(edited.createdAt).toBe('2026-09-25T10:00:00.000Z')
    expect(edited.updatedAt).toBe('2026-09-25T11:00:00.000Z')
    expect(await listRecords('notes')).toHaveLength(1)
  })

  it('lists the most recently changed first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T10:00:00Z'))
    const older = await saveRecord('notes', { ...note, title: 'older' })
    vi.setSystemTime(new Date('2026-09-25T12:00:00Z'))
    await saveRecord('notes', { ...note, title: 'newer' })
    vi.setSystemTime(new Date('2026-09-25T13:00:00Z'))
    await saveRecord('notes', { ...older, title: 'older, edited' })
    expect((await listRecords('notes')).map((n) => n.title)).toEqual(['older, edited', 'newer'])
  })

  it('hides a deleted record but keeps a tombstone without its content', async () => {
    const saved = await saveRecord('notes', note)
    await deleteRecord('notes', saved.id)
    expect(await listRecords('notes')).toEqual([])
    const tombstone = await (await db()).get('notes', saved.id)
    expect(tombstone).toMatchObject({ id: saved.id, title: '', body: '', section: 'writing' })
    expect(tombstone?.deletedAt).toBeTruthy()
  })

  it('announces changes to listeners', async () => {
    const heard: string[] = []
    const off = onChange((t) => heard.push(t))
    const saved = await saveRecord('customPhrases', { group: 'w-purpose', en: 'I am writing to', pl: 'Piszę, aby' })
    await deleteRecord('customPhrases', saved.id)
    await setSetting('lastBackupAt', '2026-09-25T10:00:00.000Z')
    off()
    expect(heard).toEqual(['customPhrases', 'customPhrases', 'settings'])
  })

  it('stores and reads settings', async () => {
    expect(await getSetting('lastBackupAt')).toBeUndefined()
    await setSetting('lastBackupAt', '2026-09-25T10:00:00.000Z')
    expect(await getSetting('lastBackupAt')).toBe('2026-09-25T10:00:00.000Z')
  })
})

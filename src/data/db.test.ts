import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DB_NAME, USER_STORES, closeDB, db } from './db.ts'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(async () => {
  await closeDB()
})

describe('database upgrades', () => {
  it('creates every store on a fresh device', async () => {
    const names = [...(await db()).objectStoreNames]
    expect(names).toEqual(expect.arrayContaining([...USER_STORES, 'settings']))
  })

  it('keeps version 1 data when upgrading to the current version', async () => {
    // A device that installed the app before version 2 of the database.
    const v1 = await openDB(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore('notes', { keyPath: 'id' })
        d.createObjectStore('customPhrases', { keyPath: 'id' })
        d.createObjectStore('settings', { keyPath: 'key' })
      },
    })
    const note = { id: 'n1', section: 'writing', title: 'Kept', body: 'Still here', createdAt: 'x', updatedAt: 'x' }
    await v1.put('notes', note)
    await v1.put('settings', { key: 'lastBackupAt', value: '2026-09-25T10:00:00.000Z' })
    v1.close()

    const upgraded = await db()
    expect(await upgraded.get('notes', 'n1')).toEqual(note)
    expect(await upgraded.get('settings', 'lastBackupAt')).toEqual({ key: 'lastBackupAt', value: '2026-09-25T10:00:00.000Z' })
    expect(await upgraded.getAll('letters')).toEqual([])
    expect(await upgraded.getAll('attempts')).toEqual([])
    expect(await upgraded.getAll('fiszkiExports')).toEqual([])
  })

  it('keeps version 2 letters when upgrading to version 3', async () => {
    const v2 = await openDB(DB_NAME, 2, {
      upgrade(d) {
        for (const s of ['notes', 'customPhrases', 'attempts', 'letters', 'customCases', 'roleplaySessions'])
          d.createObjectStore(s, { keyPath: 'id' })
        d.createObjectStore('settings', { keyPath: 'key' })
      },
    })
    const letter = { id: 'l1', caseKind: 'builtin', caseId: 'wc-af-referral', text: 'Dear Dr Shah,', createdAt: 'x', updatedAt: 'x' }
    await v2.put('letters', letter)
    v2.close()

    const upgraded = await db()
    expect(await upgraded.get('letters', 'l1')).toEqual(letter)
    expect([...upgraded.objectStoreNames]).toContain('fiszkiExports')
  })
})

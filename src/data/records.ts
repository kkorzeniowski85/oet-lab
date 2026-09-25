import { useEffect, useState } from 'react'
import { db, type Stamped, type UserRecords, type UserStore } from './db.ts'

type Topic = UserStore | 'settings'
const listeners = new Set<(topic: Topic) => void>()

export function onChange(listener: (topic: Topic) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notify(topic: Topic): void {
  for (const l of listeners) l(topic)
}

export type Draft<S extends UserStore> = Omit<UserRecords[S], keyof Stamped> & { id?: string }

// Deleting removes the content; only what identifies the record is kept.
const BLANK: { [S in UserStore]: Partial<UserRecords[S]> } = {
  notes: { title: '', body: '' },
  customPhrases: { en: '', pl: '', example: undefined },
  attempts: { answer: '' },
  letters: { text: '', evaluation: undefined },
  customCases: { title: '', task: '', notes: '' },
  roleplaySessions: { reflection: undefined },
}

/** Live records, newest change first. */
export async function listRecords<S extends UserStore>(store: S): Promise<UserRecords[S][]> {
  const all = (await (await db()).getAll(store)) as UserRecords[S][]
  return all.filter((r) => !r.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveRecord<S extends UserStore>(store: S, draft: Draft<S>): Promise<UserRecords[S]> {
  const database = await db()
  const now = new Date().toISOString()
  const existing = draft.id ? ((await database.get(store, draft.id)) as UserRecords[S] | undefined) : undefined
  const record = {
    ...draft,
    id: draft.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } as UserRecords[S]
  await database.put(store, record as never)
  notify(store)
  return record
}

export async function deleteRecord(store: UserStore, id: string): Promise<void> {
  const database = await db()
  const existing = await database.get(store, id)
  if (!existing || existing.deletedAt) return
  const now = new Date().toISOString()
  await database.put(store, { ...existing, ...BLANK[store], deletedAt: now, updatedAt: now } as never)
  notify(store)
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('settings', key))?.value as T | undefined
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await (await db()).put('settings', { key, value })
  notify('settings')
}

/** Records of one store, refreshed after every change; undefined while loading. */
export function useRecords<S extends UserStore>(store: S): UserRecords[S][] | undefined {
  const [records, setRecords] = useState<UserRecords[S][]>()
  useEffect(() => {
    let alive = true
    const load = () =>
      void listRecords(store).then((r) => {
        if (alive) setRecords(r)
      })
    load()
    const off = onChange((topic) => {
      if (topic === store) load()
    })
    return () => {
      alive = false
      off()
    }
  }, [store])
  return records
}

export function useSetting<T>(key: string): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    let alive = true
    const load = () =>
      void getSetting<T>(key).then((v) => {
        if (alive) setValue(v)
      })
    load()
    const off = onChange((topic) => {
      if (topic === 'settings') load()
    })
    return () => {
      alive = false
      off()
    }
  }, [key])
  return value
}

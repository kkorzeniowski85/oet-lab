import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SectionId } from '../app/sections.ts'

export const DB_NAME = 'oet-lab'
export const DB_VERSION = 1

/** Every user record; a deleted one keeps only its stamps, so the deletion can travel between devices. */
export interface Stamped {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface NoteRecord extends Stamped {
  section: SectionId
  title: string
  body: string
}

export interface CustomPhraseRecord extends Stamped {
  group: string
  en: string
  pl: string
  example?: string
}

export interface SettingRecord {
  key: string
  value: unknown
}

interface OetLabDB extends DBSchema {
  notes: { key: string; value: NoteRecord }
  customPhrases: { key: string; value: CustomPhraseRecord }
  settings: { key: string; value: SettingRecord }
}

/** Stores with the user's own work. They go into backups; `settings` stays on the device. */
export const USER_STORES = ['notes', 'customPhrases'] as const
export type UserStore = (typeof USER_STORES)[number]
export interface UserRecords {
  notes: NoteRecord
  customPhrases: CustomPhraseRecord
}

let connection: Promise<IDBPDatabase<OetLabDB>> | null = null

export function db(): Promise<IDBPDatabase<OetLabDB>> {
  connection ??= openDB<OetLabDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('notes', { keyPath: 'id' })
        database.createObjectStore('customPhrases', { keyPath: 'id' })
        database.createObjectStore('settings', { keyPath: 'key' })
      }
    },
    // A newer version of the app opened in another tab: step aside so its upgrade can run.
    blocking() {
      void closeDB()
    },
  })
  return connection
}

export async function closeDB(): Promise<void> {
  const open = connection
  connection = null
  if (open) (await open).close()
}

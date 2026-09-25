import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SectionId } from '../app/sections.ts'

export const DB_NAME = 'oet-lab'
export const DB_VERSION = 3

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

/** One answer in gap-fill. */
export interface AttemptRecord extends Stamped {
  exercise: 'gapfill'
  itemId: string
  correct: boolean
  answer: string
  mode: 'type' | 'choose'
}

export interface LetterRecord extends Stamped {
  caseKind: 'builtin' | 'custom'
  caseId: string
  text: string
  phase: 'reading' | 'writing' | 'done'
  readingStartedAt: string
  writingStartedAt?: string
  finishedAt?: string
  /** Ticked checklist items, as "criterionId:index". */
  selfCheck: string[]
  /** Evaluation pasted back from the Claude chat. */
  evaluation?: string
}

export interface CustomCaseRecord extends Stamped {
  title: string
  task: string
  notes: string
}

export interface RoleplaySessionRecord extends Stamped {
  cardId: string
  startedAt: string
  finishedAt?: string
  selfCheck: string[]
  reflection?: string
}

/** Phrases sent to the Fiszki app, so the bank can mark them. */
export interface FiszkiExportRecord extends Stamped {
  itemIds: string[]
  via: 'share' | 'download' | 'copy'
}

export interface SettingRecord {
  key: string
  value: unknown
}

interface OetLabDB extends DBSchema {
  notes: { key: string; value: NoteRecord }
  customPhrases: { key: string; value: CustomPhraseRecord }
  settings: { key: string; value: SettingRecord }
  attempts: { key: string; value: AttemptRecord }
  letters: { key: string; value: LetterRecord }
  customCases: { key: string; value: CustomCaseRecord }
  roleplaySessions: { key: string; value: RoleplaySessionRecord }
  fiszkiExports: { key: string; value: FiszkiExportRecord }
}

/** Stores with the user's own work. They go into backups; `settings` stays on the device. */
export const USER_STORES = [
  'notes',
  'customPhrases',
  'attempts',
  'letters',
  'customCases',
  'roleplaySessions',
  'fiszkiExports',
] as const
export type UserStore = (typeof USER_STORES)[number]
export interface UserRecords {
  notes: NoteRecord
  customPhrases: CustomPhraseRecord
  attempts: AttemptRecord
  letters: LetterRecord
  customCases: CustomCaseRecord
  roleplaySessions: RoleplaySessionRecord
  fiszkiExports: FiszkiExportRecord
}

let connection: Promise<IDBPDatabase<OetLabDB>> | null = null

export function db(): Promise<IDBPDatabase<OetLabDB>> {
  connection ??= openDB<OetLabDB>(DB_NAME, DB_VERSION, {
    // Each step runs once per device, in order; never edit a step that has shipped.
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('notes', { keyPath: 'id' })
        database.createObjectStore('customPhrases', { keyPath: 'id' })
        database.createObjectStore('settings', { keyPath: 'key' })
      }
      if (oldVersion < 2) {
        database.createObjectStore('attempts', { keyPath: 'id' })
        database.createObjectStore('letters', { keyPath: 'id' })
        database.createObjectStore('customCases', { keyPath: 'id' })
        database.createObjectStore('roleplaySessions', { keyPath: 'id' })
      }
      if (oldVersion < 3) {
        database.createObjectStore('fiszkiExports', { keyPath: 'id' })
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

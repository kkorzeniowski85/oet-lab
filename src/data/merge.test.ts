import { describe, expect, it } from 'vitest'
import type { NoteRecord } from './db.ts'
import { merge, totalChanges, winner, type Data } from './merge.ts'

const empty = (): Data => ({ notes: [], customPhrases: [], attempts: [], letters: [], customCases: [], roleplaySessions: [] })

const note = (id: string, updatedAt: string, body = 'text', extra: Partial<NoteRecord> = {}): NoteRecord => ({
  id,
  section: 'writing',
  title: '',
  body,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt,
  ...extra,
})

const T1 = '2026-09-20T10:00:00.000Z'
const T2 = '2026-09-21T10:00:00.000Z'

const withNotes = (...notes: NoteRecord[]): Data => ({ ...empty(), notes })
const sorted = (d: Data) => ({ ...d, notes: [...d.notes].sort((a, b) => a.id.localeCompare(b.id)) })

describe('winner', () => {
  it('prefers the newer change', () => {
    expect(winner(note('a', T1), note('a', T2))).toBe('theirs')
    expect(winner(note('a', T2), note('a', T1))).toBe('mine')
  })

  it('treats identical records as the same', () => {
    expect(winner(note('a', T1), note('a', T1))).toBe('same')
  })

  it('breaks a tie the same way on both devices', () => {
    const a = note('a', T1, 'phone version')
    const b = note('a', T1, 'laptop version')
    expect(winner(a, b)).not.toBe(winner(b, a))
    const onPhone = winner(a, b) === 'theirs' ? b : a
    const onLaptop = winner(b, a) === 'theirs' ? a : b
    expect(onPhone).toEqual(onLaptop)
  })
})

describe('merge', () => {
  it('copies everything onto an empty device', () => {
    const file = withNotes(note('a', T1), note('b', T2))
    const { data, report } = merge(empty(), file)
    expect(sorted(data)).toEqual(sorted(file))
    expect(report.notes).toEqual({ added: 2, updated: 0, kept: 0, unchanged: 0 })
  })

  it('changes nothing when the same file is imported twice', () => {
    const file = withNotes(note('a', T1), note('b', T2))
    const once = merge(empty(), file).data
    const twice = merge(once, file)
    expect(sorted(twice.data)).toEqual(sorted(once))
    expect(totalChanges(twice.report)).toBe(0)
    expect(twice.report.notes.unchanged).toBe(2)
  })

  it('ends in the same state whichever device imports first', () => {
    const phone = withNotes(note('a', T2, 'edited on phone'), note('b', T1), note('p', T1))
    const laptop = withNotes(note('a', T1, 'old'), note('b', T2, 'edited on laptop'), note('l', T1))
    expect(sorted(merge(phone, laptop).data)).toEqual(sorted(merge(laptop, phone).data))
  })

  it('carries a deletion to the other device when it is newer', () => {
    const phone = withNotes(note('a', T1, 'still here'))
    const laptop = withNotes(note('a', T2, '', { deletedAt: T2 }))
    const { data, report } = merge(phone, laptop)
    expect(data.notes[0].deletedAt).toBe(T2)
    expect(report.notes.updated).toBe(1)
  })

  it('keeps a newer local edit over an older deletion', () => {
    const phone = withNotes(note('a', T2, 'edited later'))
    const laptop = withNotes(note('a', T1, '', { deletedAt: T1 }))
    const { data, report } = merge(phone, laptop)
    expect(data.notes[0].body).toBe('edited later')
    expect(report.notes.kept).toBe(1)
  })

  it('lists only the records that must be written', () => {
    const local = withNotes(note('a', T1), note('b', T2))
    const incoming = withNotes(note('a', T2, 'newer'), note('b', T1, 'older'), note('c', T1))
    const { changes } = merge(local, incoming)
    expect(changes.notes.map((n) => n.id).sort()).toEqual(['a', 'c'])
  })
})

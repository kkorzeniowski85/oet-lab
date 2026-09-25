import { useState } from 'react'
import { CONTENT } from '../../content/index.ts'
import type { CustomCaseRecord, LetterRecord } from '../../data/db.ts'
import { deleteRecord, saveRecord, useRecords } from '../../data/records.ts'
import FictionalWarning from '../../ui/FictionalWarning.tsx'
import { resolveCase } from './cases.ts'
import LetterSession from './LetterSession.tsx'

const field = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-brand'

function startLetter(caseKind: LetterRecord['caseKind'], caseId: string) {
  return saveRecord('letters', {
    caseKind,
    caseId,
    text: '',
    phase: 'reading',
    readingStartedAt: new Date().toISOString(),
    selfCheck: [],
  })
}

function OwnCaseForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [task, setTask] = useState('')
  const [notes, setNotes] = useState('')
  const ready = title.trim() && task.trim() && notes.trim()
  return (
    <form
      className="space-y-2 rounded-lg border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        void saveRecord('customCases', { title: title.trim(), task: task.trim(), notes: notes.trim() }).then((c) =>
          startLetter('custom', c.id),
        )
      }}
    >
      <h2 className="font-semibold">Your own case</h2>
      <FictionalWarning />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Chest pain — GP to cardiology" aria-label="Title" className={field} />
      <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Task: whom you write to, why, and the address" aria-label="Task" rows={3} className={field} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Case notes" aria-label="Case notes" rows={10} className={field} />
      <div className="flex gap-2">
        <button type="submit" disabled={!ready} className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand disabled:opacity-40">
          Save and start
        </button>
        <button type="button" onClick={onDone} className="rounded-md px-4 py-2 text-muted">
          Cancel
        </button>
      </div>
    </form>
  )
}

function CaseRow({
  title,
  detail,
  count,
  onStart,
  onDelete,
}: {
  title: string
  detail: string
  count: number
  onStart: () => void
  onDelete?: () => void
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted">
          {detail}
          {count > 0 && ` · written ${count}×`}
        </p>
        {onDelete && (
          <button type="button" onClick={onDelete} className="mt-1 text-sm text-muted underline">
            Delete case
          </button>
        )}
      </div>
      <button type="button" onClick={onStart} className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand">
        Start
      </button>
    </li>
  )
}

function CasePicker({ letters, customCases }: { letters: LetterRecord[]; customCases: CustomCaseRecord[] }) {
  const [adding, setAdding] = useState(false)
  const written = (kind: LetterRecord['caseKind'], id: string) =>
    letters.filter((l) => l.caseKind === kind && l.caseId === id).length

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Choose a case. You get 5 minutes to read the notes, then 40 minutes to write, as in the test.
      </p>
      {adding ? (
        <OwnCaseForm onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="rounded-md border border-line px-4 py-2">
          Use your own case
        </button>
      )}
      {customCases.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Your cases</h2>
          <ul className="space-y-2">
            {customCases.map((c) => (
              <CaseRow
                key={c.id}
                title={c.title}
                detail="Your own case"
                count={written('custom', c.id)}
                onStart={() => void startLetter('custom', c.id)}
                onDelete={() => {
                  if (window.confirm('Delete this case? Letters written for it will lose their case notes.'))
                    void deleteRecord('customCases', c.id)
                }}
              />
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-2 font-semibold">Practice cases</h2>
        <ul className="space-y-2">
          {CONTENT.writingCases.map((c) => (
            <CaseRow
              key={c.id}
              title={c.title}
              detail={c.modelLetter ? 'With a model letter' : 'Fictional case'}
              count={written('builtin', c.id)}
              onStart={() => void startLetter('builtin', c.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function TimedWriting() {
  const letters = useRecords('letters')
  const customCases = useRecords('customCases')
  if (!letters || !customCases) return <p className="text-muted">Loading…</p>

  const active = letters.find((l) => l.phase !== 'done')
  if (active) {
    const kase = resolveCase(active, customCases)
    if (!kase)
      return (
        <div className="space-y-3">
          <p>The case for your unfinished letter no longer exists.</p>
          <button type="button" onClick={() => void deleteRecord('letters', active.id)} className="rounded-md border border-line px-4 py-2">
            Discard the letter
          </button>
        </div>
      )
    return <LetterSession key={active.id} letter={active} kase={kase} />
  }
  return <CasePicker letters={letters} customCases={customCases} />
}

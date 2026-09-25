import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { CONTENT } from '../../content/index.ts'
import type { CustomCaseRecord, LetterRecord } from '../../data/db.ts'
import { deleteRecord, patchRecord, saveRecord, useRecords } from '../../data/records.ts'
import { field, primaryButton, secondaryButton, smallButton, textButton } from '../../ui/buttons.ts'
import FictionalWarning from '../../ui/FictionalWarning.tsx'
import { resolveCase } from './cases.ts'
import LetterSession from './LetterSession.tsx'
import { bodyWords } from './prompt.ts'

const TIMED = '/writing/practice/timed'
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

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

function OwnCaseForm({ onStart, onCancel, busy }: { onStart: (c: CustomCaseRecord) => void; onCancel: () => void; busy: boolean }) {
  const [title, setTitle] = useState('')
  const [task, setTask] = useState('')
  const [notes, setNotes] = useState('')
  const ready = title.trim() && task.trim() && notes.trim()
  return (
    <form
      className="space-y-2 rounded-lg border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready || busy) return
        void saveRecord('customCases', { title: title.trim(), task: task.trim(), notes: notes.trim() }).then(onStart)
      }}
    >
      <h2 className="font-semibold">Your own case</h2>
      <FictionalWarning />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Chest pain — GP to cardiology" aria-label="Title" className={field} />
      <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Task: whom you write to, why, and the address" aria-label="Task" rows={3} className={field} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Case notes" aria-label="Case notes" rows={10} className={field} />
      <div className="flex gap-2">
        <button type="submit" disabled={!ready || busy} className={primaryButton}>
          Save and start
        </button>
        <button type="button" onClick={onCancel} className={textButton + ' text-muted'}>
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
  busy,
  onStart,
  onDelete,
}: {
  title: string
  detail: string
  count: number
  busy: boolean
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
          <button type="button" onClick={onDelete} className={textButton + ' -ml-2 text-muted underline'}>
            Delete case
          </button>
        )}
      </div>
      <button type="button" onClick={onStart} disabled={busy} className={smallButton}>
        Start
      </button>
    </li>
  )
}

function UnfinishedLetters({ letters, customCases }: { letters: LetterRecord[]; customCases: CustomCaseRecord[] }) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">Unfinished letters</h2>
      <ul className="space-y-2">
        {letters.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-lg border border-brand bg-surface p-4">
            <div className="flex-1">
              <p className="font-medium">{resolveCase(l, customCases)?.title ?? 'Case deleted'}</p>
              <p className="mt-0.5 text-sm text-muted">
                {shortDate(l.readingStartedAt)} · {bodyWords(l.text)} words so far
              </p>
            </div>
            <Link href={`${TIMED}/${l.id}`} className={smallButton}>
              Continue
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CasePicker({
  letters,
  customCases,
  unfinished,
}: {
  letters: LetterRecord[]
  customCases: CustomCaseRecord[]
  unfinished: LetterRecord[]
}) {
  const [, navigate] = useLocation()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const written = (kind: LetterRecord['caseKind'], id: string) =>
    letters.filter((l) => l.caseKind === kind && l.caseId === id).length

  // One tap starts one letter; a second tap while the first is being saved does nothing.
  const start = (kind: LetterRecord['caseKind'], id: string) => {
    if (busy) return
    setBusy(true)
    void startLetter(kind, id)
      .then((l) => navigate(`${TIMED}/${l.id}`))
      .finally(() => setBusy(false))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Choose a case. You get 5 minutes to read the notes, then 40 minutes to write, as in the test.
      </p>
      {unfinished.length > 0 && <UnfinishedLetters letters={unfinished} customCases={customCases} />}
      {adding ? (
        <OwnCaseForm busy={busy} onStart={(c) => start('custom', c.id)} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={secondaryButton}>
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
                busy={busy}
                onStart={() => start('custom', c.id)}
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
              busy={busy}
              onStart={() => start('builtin', c.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

/** A letter whose own case was deleted: keep what was written, or drop it — never silently. */
function OrphanedLetter({ letter }: { letter: LetterRecord }) {
  const [, navigate] = useLocation()
  const keep = () =>
    void patchRecord('letters', letter.id, { phase: 'done', finishedAt: new Date().toISOString() }).then(() =>
      navigate(`/writing/practice/letters/${letter.id}`),
    )
  const discard = () => {
    if (!window.confirm('Discard this letter? It will be deleted.')) return
    void deleteRecord('letters', letter.id).then(() => navigate(TIMED))
  }
  return (
    <div className="space-y-3">
      <p>The case for this unfinished letter has been deleted, so it cannot be continued.</p>
      <p className="text-sm text-muted">{bodyWords(letter.text)} words written so far.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={keep} className={primaryButton}>
          Finish and keep the letter
        </button>
        <button type="button" onClick={discard} className={secondaryButton}>
          Discard the letter
        </button>
      </div>
    </div>
  )
}

export default function TimedWriting({ letterId }: { letterId?: string }) {
  const letters = useRecords('letters')
  const customCases = useRecords('customCases')
  if (!letters || !customCases) return <p className="text-muted">Loading…</p>

  const unfinished = letters.filter((l) => l.phase !== 'done')
  const chosen = letterId ? letters.find((l) => l.id === letterId) : unfinished.length === 1 ? unfinished[0] : undefined

  if (letterId && !chosen)
    return (
      <p>
        This letter no longer exists.{' '}
        <Link href={TIMED} className="text-brand underline">
          Start a new one
        </Link>
      </p>
    )
  if (chosen?.phase === 'done')
    return (
      <p>
        This letter is finished.{' '}
        <Link href={`/writing/practice/letters/${chosen.id}`} className="text-brand underline">
          Open it
        </Link>
      </p>
    )
  if (chosen) {
    const kase = resolveCase(chosen, customCases)
    if (!kase) return <OrphanedLetter letter={chosen} />
    return <LetterSession key={chosen.id} letter={chosen} kase={kase} />
  }
  return <CasePicker letters={letters} customCases={customCases} unfinished={unfinished} />
}

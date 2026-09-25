import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import type { LetterRecord } from '../../data/db.ts'
import { deleteRecord, saveRecord } from '../../data/records.ts'
import type { ResolvedCase } from './cases.ts'
import CaseNotes from './CaseNotes.tsx'
import { bodyWords } from './prompt.ts'
import { formatClock, useNow } from '../../lib/time.ts'
import { clock, writingStart } from './timer.ts'

const SAVE_AFTER_MS = 800

type Draft = Omit<LetterRecord, 'createdAt' | 'updatedAt' | 'deletedAt'>
const draftOf = (l: LetterRecord): Draft => ({
  id: l.id,
  caseKind: l.caseKind,
  caseId: l.caseId,
  text: l.text,
  phase: l.phase,
  readingStartedAt: l.readingStartedAt,
  writingStartedAt: l.writingStartedAt,
  finishedAt: l.finishedAt,
  selfCheck: l.selfCheck,
  evaluation: l.evaluation,
})

function WordCount({ text }: { text: string }) {
  const n = bodyWords(text)
  const tone = n < 180 ? 'text-muted' : n <= 200 ? 'text-brand' : 'text-ink'
  return (
    <span className={'text-sm ' + tone}>
      {n} words <span className="text-muted">/ 180–200</span>
    </span>
  )
}

export default function LetterSession({ letter, kase }: { letter: LetterRecord; kase: ResolvedCase }) {
  const [, navigate] = useLocation()
  const now = useNow()
  const time = clock(letter, now)
  const [text, setText] = useState(letter.text)
  const [pane, setPane] = useState<'notes' | 'letter' | null>(null)
  const shown = pane ?? (time.phase === 'reading' ? 'notes' : 'letter')

  // The latest record and text, for saves triggered by timers and page events.
  const latest = useRef({ letter, text })
  useLayoutEffect(() => {
    latest.current = { letter, text }
  })
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  const switching = useRef(false)

  const save = useCallback((changes: Partial<Draft> = {}) => {
    if (pending.current) clearTimeout(pending.current)
    pending.current = null
    const { letter: l, text: t } = latest.current
    return saveRecord('letters', { ...draftOf(l), text: t, ...changes })
  }, [])

  // Reading time runs out on its own; record once when writing started.
  useEffect(() => {
    if (letter.phase === 'reading' && time.phase === 'writing' && !switching.current) {
      switching.current = true
      void save({ phase: 'writing', writingStartedAt: new Date(writingStart(letter)).toISOString() })
    }
  }, [letter, time.phase, save])

  // Save when the app is hidden (phone locked, app switched) and when leaving the screen.
  useEffect(() => {
    const flush = () => {
      if (pending.current) void save()
    }
    document.addEventListener('visibilitychange', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      flush()
    }
  }, [save])

  const edit = (value: string) => {
    setText(value)
    if (pending.current) clearTimeout(pending.current)
    pending.current = setTimeout(() => void save(), SAVE_AFTER_MS)
  }

  const finish = async () => {
    if (!window.confirm('Finish this letter? You can still read it and add feedback afterwards.')) return
    await save({ phase: 'done', finishedAt: new Date().toISOString() })
    navigate(`/writing/practice/letters/${letter.id}`)
  }

  const discard = () => {
    if (window.confirm('Discard this letter? It will be deleted.')) void deleteRecord('letters', letter.id)
  }

  const reading = time.phase === 'reading'

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-line bg-canvas px-4 py-3 md:mx-0 md:px-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">{kase.title}</p>
          <p className="shrink-0 text-right">
            <span className="block text-xs text-muted">{reading ? 'Reading time' : 'Writing time'}</span>
            <span className="font-mono text-2xl tabular-nums" role="timer" aria-live="off">
              {time.phase === 'writing' && time.overtimeMs > 0
                ? `+${formatClock(time.overtimeMs)}`
                : formatClock(time.phase === 'done' ? 0 : time.remainingMs)}
            </span>
          </p>
        </div>
        {time.phase === 'writing' && time.overtimeMs > 0 && (
          <p role="status" className="text-sm font-medium">
            Time is up. In the test you would stop now.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {reading ? (
            <button type="button" onClick={() => void save({ phase: 'writing', writingStartedAt: new Date().toISOString() })} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand">
              Start writing now
            </button>
          ) : (
            <>
              <WordCount text={text} />
              <button type="button" onClick={() => void finish()} className="ml-auto rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand">
                Finish
              </button>
            </>
          )}
          <button type="button" onClick={discard} className="text-sm text-muted">
            Discard
          </button>
        </div>
        <div role="group" aria-label="Show" className="flex gap-2 md:hidden">
          {(['notes', 'letter'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={shown === p}
              onClick={() => setPane(p)}
              className={'rounded-md px-3 py-1 text-sm ' + (shown === p ? 'bg-ink text-canvas' : 'bg-surface text-muted')}
            >
              {p === 'notes' ? 'Case notes' : 'Your letter'}
            </button>
          ))}
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div className={shown === 'notes' ? 'block' : 'hidden md:block'}>
          <CaseNotes kase={kase} />
        </div>
        <div className={shown === 'letter' ? 'block' : 'hidden md:block'}>
          <textarea
            value={text}
            onChange={(e) => edit(e.target.value)}
            readOnly={reading}
            aria-label="Your letter"
            placeholder={reading ? `You can start writing in ${formatClock(time.remainingMs)}, or now with “Start writing now”.` : 'Dear …'}
            spellCheck={false}
            autoCorrect="off"
            autoComplete="off"
            className="min-h-[60vh] w-full rounded-md border border-line bg-surface p-3 text-base leading-relaxed outline-none focus:border-brand read-only:opacity-60"
          />
          <p className="mt-1 text-xs text-muted">Spell check is off, as in the test. Your text is saved as you type.</p>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { setWritingSession } from '../../app/session.ts'
import type { LetterRecord } from '../../data/db.ts'
import { deleteRecord, patchRecord } from '../../data/records.ts'
import { formatClock, useNow } from '../../lib/time.ts'
import { chip, chipOff, chipOn, smallButton, textButton } from '../../ui/buttons.ts'
import type { ResolvedCase } from './cases.ts'
import CaseNotes from './CaseNotes.tsx'
import { bodyWords } from './prompt.ts'
import { clock, writingStart } from './timer.ts'

const SAVE_AFTER_MS = 800
type Patch = Partial<Pick<LetterRecord, 'text' | 'phase' | 'writingStartedAt' | 'finishedAt'>>

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
  const [saveError, setSaveError] = useState<string | null>(null)
  const shown = pane ?? (time.phase === 'reading' ? 'notes' : 'letter')

  // The latest text, for saves triggered by timers and page events.
  const latestText = useRef(text)
  useLayoutEffect(() => {
    latestText.current = text
  })
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  // After Finish or Discard nothing may be written any more, whatever timers are still alive.
  const stopped = useRef(false)
  const switching = useRef(false)

  // Fields are patched onto the stored record, so a screen that lags behind cannot undo a newer change.
  const save = useCallback(
    async (changes: Patch = {}) => {
      if (pending.current) clearTimeout(pending.current)
      pending.current = null
      if (stopped.current) return null
      try {
        const saved = await patchRecord('letters', letter.id, { text: latestText.current, ...changes })
        setSaveError(null)
        return saved
      } catch {
        setSaveError('Your letter could not be saved. Free up storage on this device, then keep writing.')
        return null
      }
    },
    [letter.id],
  )

  // Reading time runs out on its own; record once when writing started.
  useEffect(() => {
    if (letter.phase === 'reading' && time.phase === 'writing' && !switching.current) {
      switching.current = true
      void save({ phase: 'writing', writingStartedAt: new Date(writingStart(letter)).toISOString() })
    }
  }, [letter, time.phase, save])

  // Save when the app is hidden (phone locked, app switched), on reload or close, and when leaving the screen.
  useEffect(() => {
    const flush = () => {
      if (pending.current) void save()
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [save])

  useEffect(() => {
    setWritingSession(true)
    return () => setWritingSession(false)
  }, [])

  const edit = (value: string) => {
    setText(value)
    if (pending.current) clearTimeout(pending.current)
    pending.current = setTimeout(() => void save(), SAVE_AFTER_MS)
  }

  const finish = async () => {
    if (!window.confirm('Finish this letter? You can still read it and add feedback afterwards.')) return
    const saved = await save({ phase: 'done', finishedAt: new Date().toISOString() })
    if (!saved) return
    stopped.current = true
    navigate(`/writing/practice/letters/${letter.id}`)
  }

  const discard = () => {
    if (!window.confirm('Discard this letter? It will be deleted.')) return
    stopped.current = true
    if (pending.current) clearTimeout(pending.current)
    pending.current = null
    void deleteRecord('letters', letter.id).then(() => navigate('/writing/practice/timed'))
  }

  const reading = time.phase === 'reading'

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-line bg-canvas px-4 py-2 md:mx-0 md:px-0">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">{kase.title}</p>
          <p className="shrink-0 text-right">
            <span className="block text-xs text-muted">{reading ? 'Reading time' : 'Writing time'}</span>
            <span className="font-mono text-2xl leading-none tabular-nums" role="timer" aria-live="off">
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
        {saveError && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {saveError}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={discard} className={textButton + ' -ml-2 text-muted'}>
            Discard
          </button>
          <span className="flex-1 text-center">{!reading && <WordCount text={text} />}</span>
          {reading ? (
            <button
              type="button"
              onClick={() => void save({ phase: 'writing', writingStartedAt: new Date().toISOString() })}
              className={smallButton}
            >
              Start writing now
            </button>
          ) : (
            <button type="button" onClick={() => void finish()} className={smallButton}>
              Finish
            </button>
          )}
        </div>
        <div role="group" aria-label="Show notes or letter" className="flex gap-2 md:hidden">
          {(['notes', 'letter'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={shown === p}
              onClick={() => setPane(p)}
              className={chip + ' ' + (shown === p ? chipOn : chipOff)}
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
          {reading && (
            <p className="mb-2 text-sm text-muted">
              Reading time: you can start writing in {formatClock(time.remainingMs)}, or now with “Start writing now”.
            </p>
          )}
          <textarea
            value={text}
            onChange={(e) => edit(e.target.value)}
            readOnly={reading}
            aria-label="Your letter"
            placeholder="Dear …"
            spellCheck={false}
            autoCorrect="off"
            autoComplete="off"
            className="min-h-[50vh] w-full rounded-md border border-field bg-surface p-3 text-base leading-relaxed outline-none focus:border-brand read-only:bg-canvas"
          />
          <p className="mt-1 text-xs text-muted">Spell check is off, as in the test. Your text is saved as you type.</p>
        </div>
      </div>
    </div>
  )
}

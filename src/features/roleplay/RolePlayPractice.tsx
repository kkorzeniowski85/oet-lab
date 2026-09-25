import { useState } from 'react'
import { CONTENT, criteriaFor } from '../../content/index.ts'
import type { RolePlay } from '../../content/types.ts'
import { saveRecord, useRecords } from '../../data/records.ts'
import { formatClock, useNow } from '../../lib/time.ts'
import SpeakButton from '../../ui/SpeakButton.tsx'
import { stage } from './stage.ts'

const button = 'rounded-md bg-brand px-4 py-2 font-medium text-on-brand disabled:opacity-40'
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

interface Run {
  card: RolePlay
  startedAt: number
  speakingAt: number | null
  finishedAt: number | null
}

function Card({ card }: { card: RolePlay }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 text-sm">
      <p className="text-muted">Setting: {card.setting}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {card.candidate.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  )
}

function OtherPartyCard({ card }: { card: RolePlay }) {
  return (
    <details className="rounded-lg border border-line bg-surface p-4 text-sm">
      <summary className="cursor-pointer font-medium">The patient’s card (for a practice partner)</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {card.otherParty.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </details>
  )
}

function Timer({ label, ms, over }: { label: string; ms: number; over: boolean }) {
  return (
    <p className="text-right">
      <span className="block text-xs text-muted">{label}</span>
      <span role="timer" className="font-mono text-2xl tabular-nums">
        {over ? `+${formatClock(ms)}` : formatClock(ms)}
      </span>
    </p>
  )
}

function Review({ run, onDone }: { run: Run; onDone: (saved: boolean) => void }) {
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [reflection, setReflection] = useState('')
  const phrases = run.card.focus.map((id) => CONTENT.phrases.find((p) => p.id === id)!)
  const toggle = (key: string) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const save = () =>
    void saveRecord('roleplaySessions', {
      cardId: run.card.id,
      startedAt: new Date(run.startedAt).toISOString(),
      finishedAt: new Date(run.finishedAt ?? Date.now()).toISOString(),
      selfCheck: [...ticked],
      ...(reflection.trim() && { reflection: reflection.trim() }),
    }).then(() => onDone(true))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">How did it go?</h2>
      {(['clinical', 'linguistic'] as const).map((family) => (
        <section key={family} className="space-y-2">
          <h3 className="font-semibold">{family === 'clinical' ? 'Clinical communication' : 'Language'}</h3>
          {criteriaFor('speaking')
            .filter((c) => c.family === family)
            .map((c) => (
              <fieldset key={c.id} className="rounded-lg border border-line bg-surface p-3">
                <legend className="px-1 text-sm font-semibold">{c.name}</legend>
                {c.checklist.map((item, i) => {
                  const key = `${c.id}:${i}`
                  return (
                    <label key={key} className="flex items-start gap-2 py-1 text-sm">
                      <input type="checkbox" checked={ticked.has(key)} onChange={() => toggle(key)} className="mt-0.5 accent-[var(--brand)]" />
                      <span>{item}</span>
                    </label>
                  )
                })}
              </fieldset>
            ))}
        </section>
      ))}
      <section className="space-y-2">
        <h3 className="font-semibold">Useful phrases for this role-play</h3>
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
          {phrases.map((p) => (
            <li key={p.id} className="flex items-start gap-2 py-2 text-sm">
              <span className="flex-1">
                <span className="font-medium">{p.en}</span>
                <span className="block text-muted">{p.pl}</span>
              </span>
              <SpeakButton text={p.en} showLabel={false} />
            </li>
          ))}
        </ul>
      </section>
      <OtherPartyCard card={run.card} />
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">What would you do differently next time? (optional)</span>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-surface p-2 outline-none focus:border-brand"
        />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={save} className={button}>
          Save and finish
        </button>
        <button type="button" onClick={() => onDone(false)} className="rounded-md px-4 py-2 text-muted">
          Don’t save
        </button>
      </div>
    </div>
  )
}

function Session({ run, setRun, onDone }: { run: Run; setRun: (r: Run) => void; onDone: (saved: boolean) => void }) {
  const now = useNow()
  if (run.finishedAt !== null) return <Review run={run} onDone={onDone} />
  const { speakingAt, left } = stage(run, now)
  const preparing = speakingAt === null

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{run.card.title}</h2>
          <p className="text-sm text-muted">
            {preparing ? 'Read the card and plan what you will say.' : 'Speak out loud, as if the patient were in front of you.'}
          </p>
        </div>
        <Timer label={preparing ? 'Preparation' : 'Role-play'} ms={Math.abs(left)} over={left < 0} />
      </div>
      {!preparing && left < 0 && (
        <p role="status" className="font-medium">
          Time is up. In the test the interlocutor would close the role-play now.
        </p>
      )}
      <Card card={run.card} />
      <div className="flex flex-wrap gap-2">
        {preparing ? (
          <button type="button" onClick={() => setRun({ ...run, speakingAt: Date.now() })} className={button}>
            Start the role-play
          </button>
        ) : (
          <button type="button" onClick={() => setRun({ ...run, speakingAt, finishedAt: Date.now() })} className={button}>
            Finish
          </button>
        )}
        <button type="button" onClick={() => onDone(false)} className="rounded-md px-4 py-2 text-muted">
          Stop
        </button>
      </div>
      <OtherPartyCard card={run.card} />
    </div>
  )
}

export default function RolePlayPractice() {
  const sessions = useRecords('roleplaySessions')
  const [run, setRun] = useState<Run | null>(null)
  const [saved, setSaved] = useState(false)

  if (run) {
    return (
      <Session
        run={run}
        setRun={setRun}
        onDone={(didSave) => {
          setSaved(didSave)
          setRun(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Pick a card: 3 minutes to prepare, then 5 minutes to speak. Practise out loud — with a partner reading the patient’s
        card, or on your own.
      </p>
      {saved && (
        <p role="status" className="text-sm text-brand">
          Saved.
        </p>
      )}
      <ul className="space-y-2">
        {CONTENT.rolePlays.map((card) => {
          const done = (sessions ?? []).filter((s) => s.cardId === card.id)
          const last = done[0]
          return (
            <li key={card.id} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
              <div className="flex-1">
                <p className="font-medium">{card.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {card.setting}
                  {done.length > 0 && ` · practised ${done.length}× · last ${shortDate(last.updatedAt)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSaved(false)
                  setRun({ card, startedAt: Date.now(), speakingAt: null, finishedAt: null })
                }}
                className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand"
              >
                Start
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

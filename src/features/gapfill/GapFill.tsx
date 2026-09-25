import { useMemo, useState } from 'react'
import { groupsFor, phrasesFor } from '../../content/index.ts'
import type { PhraseSection } from '../../content/types.ts'
import { saveRecord, useRecords } from '../../data/records.ts'
import { chip, chipOff, chipOn, field, primaryButton, secondaryButton } from '../../ui/buttons.ts'
import SpeakButton from '../../ui/SpeakButton.tsx'
import { checkAnswer, type Verdict } from './engine.ts'
import { ROUND_SIZE, buildPool, choices, pickRound, weakIds, type GapItem, type Mode, type Source } from './round.ts'

interface Answered {
  item: GapItem
  given: string
  verdict: Verdict
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; name: string; disabled?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            disabled={o.disabled}
            onClick={() => onChange(o.id)}
            className={chip + ' ' + (value === o.id ? chipOn : chipOff)}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Sentence({ item, reveal }: { item: GapItem; reveal: boolean }) {
  return (
    <p className="text-lg leading-relaxed">
      {item.gap.before}
      {reveal ? (
        <strong className="text-brand">{item.gap.answer}</strong>
      ) : (
        <>
          <span className="sr-only">(blank)</span>
          <span aria-hidden="true" className="inline-block min-w-16 border-b-2 border-ink">
            &nbsp;
          </span>
        </>
      )}
      {item.gap.after}
    </p>
  )
}

function Question({
  item,
  number,
  total,
  mode,
  options,
  onAnswered,
}: {
  item: GapItem
  number: number
  total: number
  mode: Mode
  options: string[]
  onAnswered: (a: Answered) => void
}) {
  const [given, setGiven] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  const check = (answer: string) => {
    const v = checkAnswer(answer, item.gap.answer)
    setGiven(answer)
    setVerdict(v)
    void saveRecord('attempts', { exercise: 'gapfill', itemId: item.id, correct: v === 'correct', answer, mode })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Question {number} of {total}
      </p>
      <p className="text-sm">
        <span className="text-muted">Hint: </span>
        <span lang="pl">{item.pl}</span>
      </p>
      <Sentence item={item} reveal={verdict !== null} />

      {verdict === null && mode === 'type' && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (given.trim()) check(given)
          }}
        >
          <input
            value={given}
            onChange={(e) => setGiven(e.target.value)}
            aria-label="Your answer"
            placeholder="Type the missing words"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            className={field + ' text-base'}
          />
          <button type="submit" disabled={!given.trim()} className={primaryButton}>
            Check
          </button>
        </form>
      )}

      {verdict === null && mode === 'choose' && (
        <div className="grid gap-2">
          {options.map((o) => (
            <button key={o} type="button" onClick={() => check(o)} className={secondaryButton + ' justify-start text-left'}>
              {o}
            </button>
          ))}
        </div>
      )}

      {verdict !== null && (
        <div className="space-y-3">
          <p role="status" className={verdict === 'correct' ? 'font-medium text-brand' : 'font-medium'}>
            {verdict === 'correct' && 'Correct.'}
            {verdict === 'close' && `Almost — check the spelling. You wrote “${given}”.`}
            {verdict === 'wrong' && `Not quite. You wrote “${given}”.`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <SpeakButton text={item.sentence} />
            <span className="text-sm text-muted">{item.en}</span>
          </div>
          <button type="button" onClick={() => onAnswered({ item, given, verdict })} className={primaryButton} autoFocus>
            {number === total ? 'See results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function GapFill({ section }: { section: PhraseSection }) {
  const custom = useRecords('customPhrases')
  const attempts = useRecords('attempts')
  const [mode, setMode] = useState<Mode>('type')
  const [focus, setFocus] = useState<'all' | 'weak'>('all')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [round, setRound] = useState<{ items: GapItem[]; options: string[][] } | null>(null)
  const [answered, setAnswered] = useState<Answered[]>([])

  const groups = useMemo(() => groupsFor(section), [section])
  const sources = useMemo<Source[]>(() => {
    const inSection = new Set(groups.map((g) => g.id))
    const own = (custom ?? [])
      .filter((r) => inSection.has(r.group) && r.example)
      .map((r) => ({ id: r.id, group: r.group, en: r.en, pl: r.pl, examples: [r.example!] }))
    return [...own, ...phrasesFor(section)]
  }, [custom, groups, section])

  // Rebuilt when the settings change; the random example per phrase is fixed until then.
  const pool = useMemo(() => buildPool(sources, mode, Math.random), [sources, mode])
  const weak = useMemo(() => weakIds(attempts ?? []), [attempts])
  const inGroup = pool.filter((p) => groupId === null || p.group === groupId)
  const weakCount = inGroup.filter((p) => weak.has(p.id)).length
  const candidates = focus === 'weak' && weakCount > 0 ? inGroup.filter((p) => weak.has(p.id)) : inGroup

  const start = (items: GapItem[]) => {
    setAnswered([])
    setRound({ items, options: items.map((i) => choices(i, pool, Math.random)) })
  }

  if (round && answered.length < round.items.length) {
    const i = answered.length
    return (
      <Question
        key={i}
        item={round.items[i]}
        number={i + 1}
        total={round.items.length}
        mode={mode}
        options={round.options[i]}
        onAnswered={(a) => setAnswered((prev) => [...prev, a])}
      />
    )
  }

  if (round) {
    const right = answered.filter((a) => a.verdict === 'correct').length
    const missed = answered.filter((a) => a.verdict !== 'correct')
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" tabIndex={-1} autoFocus>
          {right} of {answered.length} correct
        </h2>
        {missed.length > 0 && (
          <ul className="space-y-3">
            {missed.map((a) => (
              <li key={a.item.id} className="rounded-lg border border-line bg-surface p-3">
                <Sentence item={a.item} reveal />
                <p className="mt-1 text-sm text-muted">You wrote “{a.given}”.</p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => start(pickRound(candidates, Math.random))} className={primaryButton}>
            Practise again
          </button>
          {missed.length > 0 && (
            <button type="button" onClick={() => start(missed.map((a) => a.item))} className={secondaryButton}>
              Practise the missed ones
            </button>
          )}
          <button type="button" onClick={() => setRound(null)} className={secondaryButton}>
            Change settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Fill the gap in real example sentences. The Polish meaning is your hint. Answers are saved, so the app knows which
        phrases need more work.
      </p>
      <Toggle
        label="Answer by"
        value={mode}
        onChange={setMode}
        options={[
          { id: 'type', name: 'Typing' },
          { id: 'choose', name: 'Multiple choice' },
        ]}
      />
      <Toggle
        label="Phrases"
        value={focus}
        onChange={setFocus}
        options={[
          { id: 'all', name: 'All' },
          { id: 'weak', name: `Weak only (${weakCount})`, disabled: weakCount === 0 },
        ]}
      />
      {weakCount === 0 && (
        <p className="text-sm text-muted">Weak phrases are the ones you got wrong lately. None here yet — practise all phrases first.</p>
      )}
      <Toggle
        label="Group"
        value={groupId ?? 'all'}
        onChange={(v) => setGroupId(v === 'all' ? null : v)}
        options={[
          { id: 'all', name: 'All groups' },
          ...groups.filter((g) => pool.some((p) => p.group === g.id)).map((g) => ({ id: g.id, name: g.name })),
        ]}
      />
      <button
        type="button"
        disabled={candidates.length === 0}
        onClick={() => start(pickRound(candidates, Math.random))}
        className={primaryButton}
      >
        Start {Math.min(ROUND_SIZE, candidates.length)} questions
      </button>
    </div>
  )
}

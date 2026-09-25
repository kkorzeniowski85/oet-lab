import { useState } from 'react'
import { Link } from 'wouter'
import { criteriaFor } from '../../content/index.ts'
import type { LetterRecord } from '../../data/db.ts'
import { deleteRecord, patchRecord, setSetting, useRecords, useSetting } from '../../data/records.ts'
import { chip, chipOff, chipOn, primaryButton, secondaryButton, textButton } from '../../ui/buttons.ts'
import { resolveCase, type ResolvedCase } from './cases.ts'
import CaseNotes from './CaseNotes.tsx'
import { bodyWords, evaluationPrompt, type FeedbackLanguage } from './prompt.ts'
import { writingMinutes } from './timer.ts'

const LETTERS = '/writing/practice/letters'
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const button = primaryButton
const quiet = secondaryButton

const update = (l: LetterRecord, changes: Partial<Pick<LetterRecord, 'selfCheck' | 'evaluation'>>) =>
  patchRecord('letters', l.id, changes)

function SelfCheck({ letter }: { letter: LetterRecord }) {
  const ticked = new Set(letter.selfCheck)
  const toggle = (key: string) => {
    const next = new Set(ticked)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    void update(letter, { selfCheck: [...next] })
  }
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Check it yourself</h2>
      {criteriaFor('writing').map((c) => (
        <fieldset key={c.id} className="rounded-lg border border-line bg-surface p-3">
          <legend className="px-1 text-sm font-semibold">{c.name}</legend>
          {c.checklist.map((item) => {
            // Keyed by the text, so reordering a checklist in content keeps the ticks.
            const key = `${c.id}:${item}`
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
  )
}

function Feedback({ letter, kase }: { letter: LetterRecord; kase: ResolvedCase }) {
  const language = useSetting<FeedbackLanguage>('feedbackLanguage') ?? 'English'
  const [copied, setCopied] = useState<'yes' | 'manual' | null>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const prompt = evaluationPrompt(kase, letter.text, language)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied('yes')
    } catch {
      setCopied('manual')
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Feedback from Claude</h2>
      <p className="text-sm text-muted">
        Copy the prompt, paste it into a new Claude chat, then paste the reply below. It stays with this letter.
      </p>
      <div role="group" aria-label="Feedback language" className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Feedback in:</span>
        {(['English', 'Polish'] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={language === l}
            onClick={() => void setSetting('feedbackLanguage', l)}
            className={chip + ' ' + (language === l ? chipOn : chipOff)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void copy()} className={button}>
          Copy evaluation prompt
        </button>
        <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="text-sm text-brand underline">
          Open Claude
        </a>
      </div>
      {copied === 'yes' && <p role="status" className="text-sm text-brand">Copied. Paste it into a new Claude chat.</p>}
      {copied === 'manual' && (
        <div className="space-y-1">
          <p role="status" className="text-sm">Copying is blocked here. Select the text below and copy it.</p>
          <textarea
            readOnly
            value={prompt}
            rows={8}
            aria-label="Evaluation prompt"
            className="w-full rounded-md border border-field bg-surface p-2 text-sm"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      {draft !== null ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            aria-label="Feedback"
            placeholder="Paste Claude's feedback here"
            className="w-full rounded-md border border-field bg-surface p-3 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => void update(letter, { evaluation: draft.trim() }).then(() => setDraft(null))}
              className={button}
            >
              Save feedback
            </button>
            <button type="button" onClick={() => setDraft(null)} className={textButton + ' text-muted'}>
              Cancel
            </button>
          </div>
        </div>
      ) : letter.evaluation ? (
        <div className="space-y-2">
          <div className="break-words whitespace-pre-wrap rounded-lg border border-line bg-surface p-4 text-sm">{letter.evaluation}</div>
          <button type="button" onClick={() => setDraft(letter.evaluation ?? '')} className={textButton + ' -ml-2 text-brand'}>
            Edit feedback
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setDraft('')} className={quiet}>
          Paste feedback
        </button>
      )}
    </section>
  )
}

export function LetterReview({ id }: { id: string }) {
  const letters = useRecords('letters')
  const customCases = useRecords('customCases')
  if (!letters || !customCases) return <p className="text-muted">Loading…</p>
  const letter = letters.find((l) => l.id === id)
  if (!letter)
    return (
      <p>
        This letter no longer exists.{' '}
        <Link href={LETTERS} className="text-brand underline">
          My letters
        </Link>
      </p>
    )
  const kase = resolveCase(letter, customCases)
  const minutes = writingMinutes(letter)

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{kase?.title ?? 'Case deleted'}</h2>
        <p className="text-sm text-muted">
          {shortDate(letter.readingStartedAt)} · {bodyWords(letter.text)} words
          {minutes !== null && ` · ${minutes} min of writing`}
        </p>
        {letter.phase !== 'done' && (
          <Link href={`/writing/practice/timed/${letter.id}`} className="text-sm text-brand underline">
            Continue writing
          </Link>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your letter</h2>
        <div className="break-words whitespace-pre-wrap rounded-lg border border-line bg-surface p-4">{letter.text || '(empty)'}</div>
      </section>

      {letter.phase === 'done' && <SelfCheck letter={letter} />}
      {letter.phase === 'done' && kase && <Feedback letter={letter} kase={kase} />}

      {kase && (
        <details className="rounded-lg border border-line bg-surface p-4">
          <summary className="cursor-pointer font-medium">Case notes</summary>
          <div className="mt-3">
            <CaseNotes kase={kase} />
          </div>
        </details>
      )}
      {kase?.modelLetter && (
        <details className="rounded-lg border border-line bg-surface p-4">
          <summary className="cursor-pointer font-medium">Compare with a model letter</summary>
          <p className="mt-3 break-words whitespace-pre-wrap text-sm">{kase.modelLetter}</p>
        </details>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/writing/practice/timed" className={button}>
          Write another letter
        </Link>
        <Link href={LETTERS} className={quiet}>
          My letters
        </Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete this letter and its feedback?')) void deleteRecord('letters', letter.id)
          }}
          className={textButton + ' text-muted'}
        >
          Delete letter
        </button>
      </div>
    </div>
  )
}

export function LetterList() {
  const letters = useRecords('letters')
  const customCases = useRecords('customCases')
  if (!letters || !customCases) return <p className="text-muted">Loading…</p>
  if (letters.length === 0)
    return (
      <p className="text-muted">
        No letters yet.{' '}
        <Link href="/writing/practice/timed" className="text-brand underline">
          Write your first one
        </Link>
        .
      </p>
    )
  const sorted = [...letters].sort((a, b) => b.readingStartedAt.localeCompare(a.readingStartedAt))
  return (
    <ul className="space-y-2">
      {sorted.map((l) => {
        const minutes = writingMinutes(l)
        return (
          <li key={l.id}>
            <Link href={`${LETTERS}/${l.id}`} className="block rounded-lg border border-line bg-surface p-4 hover:border-brand">
              <span className="font-medium">{resolveCase(l, customCases)?.title ?? 'Case deleted'}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {shortDate(l.readingStartedAt)} · {l.phase === 'done' ? `${bodyWords(l.text)} words` : 'in progress'}
                {minutes !== null && ` · ${minutes} min`}
                {l.evaluation && ' · feedback saved'}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

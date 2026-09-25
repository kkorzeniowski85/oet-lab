import { useState } from 'react'
import { groupsFor, phrasesFor } from '../../content/index.ts'
import type { Phrase, PhraseSection } from '../../content/types.ts'
import type { CustomPhraseRecord } from '../../data/db.ts'
import { deleteRecord, saveRecord, useRecords } from '../../data/records.ts'
import { matches } from '../../lib/search.ts'
import { FilterChips, SearchInput } from '../../ui/controls.tsx'
import SpeakButton from '../../ui/SpeakButton.tsx'
import { Link } from 'wouter'
import { useFiszkiBasket } from '../fiszki/fiszki.ts'
import PhraseForm from '../quick-add/PhraseForm.tsx'

type Item = Phrase & { mine?: CustomPhraseRecord }

const fromRecord = (r: CustomPhraseRecord): Item => ({
  id: r.id,
  group: r.group,
  en: r.en,
  pl: r.pl,
  kind: 'phrase',
  examples: r.example ? [r.example] : [],
  source: 'mine',
  mine: r,
})

function MineActions({ record, section }: { record: CustomPhraseRecord; section: PhraseSection }) {
  const [editing, setEditing] = useState(false)
  if (editing)
    return (
      <div className="rounded-md border border-brand p-3">
        <PhraseForm
          section={section}
          initial={record}
          onSave={(p) => void saveRecord('customPhrases', { id: record.id, ...p }).then(() => setEditing(false))}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  return (
    <div className="flex gap-4 pt-1">
      <button type="button" onClick={() => setEditing(true)} className="text-brand">
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Delete this phrase?')) void deleteRecord('customPhrases', record.id)
        }}
        className="text-muted"
      >
        Delete
      </button>
    </div>
  )
}

interface FiszkiState {
  inList: boolean
  sentBefore: boolean
  toggle: () => void
}

function PhraseItem({ phrase: p, section, fiszki }: { phrase: Item; section: PhraseSection; fiszki: FiszkiState }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <details className="group py-3">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="font-medium">{p.en}</span>
            {p.register === 'informal' && (
              <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 align-middle text-xs text-brand">informal</span>
            )}
            {p.mine && (
              <span className="ml-2 rounded bg-ink px-1.5 py-0.5 align-middle text-xs text-canvas">mine</span>
            )}
            {fiszki.sentBefore && (
              <span className="ml-2 rounded border border-line px-1.5 py-0.5 align-middle text-xs text-muted">in Fiszki</span>
            )}
            <span className="mt-0.5 block text-sm text-muted">{p.pl}</span>
          </span>
          <span aria-hidden="true" className="mt-0.5 text-muted transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <SpeakButton text={p.en} />
            {p.pronunciation && <span className="text-muted">{p.pronunciation}</span>}
          </div>
          {p.examples.length > 0 && (
            <ul className="space-y-1.5">
              {p.examples.map((e) => (
                <li key={e} className="flex items-start gap-1 border-l-2 border-line pl-3">
                  <span className="flex-1">{e}</span>
                  <SpeakButton text={e} showLabel={false} />
                </li>
              ))}
            </ul>
          )}
          {p.synonyms && (
            <p>
              <span className="text-muted">Similar: </span>
              {p.synonyms.join(' · ')}
            </p>
          )}
          {p.formal && (
            <p>
              <span className="text-muted">Formal: </span>
              {p.formal.join(' · ')}
            </p>
          )}
          <button type="button" onClick={fiszki.toggle} aria-pressed={fiszki.inList} className="text-brand">
            {fiszki.inList ? '✓ In your Fiszki list — remove' : '+ Add to Fiszki list'}
          </button>
          {p.mine && <MineActions record={p.mine} section={section} />}
        </div>
      </details>
    </li>
  )
}

export default function PhraseBank({ section }: { section: PhraseSection }) {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)
  const custom = useRecords('customPhrases')
  const basket = useFiszkiBasket()
  const exports = useRecords('fiszkiExports')
  const sent = new Set((exports ?? []).flatMap((e) => e.itemIds))

  const groups = groupsFor(section)
  const inSection = new Set(groups.map((g) => g.id))
  // Your own phrases come first in each group.
  const all: Item[] = [...(custom ?? []).filter((r) => inSection.has(r.group)).map(fromRecord), ...phrasesFor(section)]
  const found = all.filter((p) => matches(query, [p.en, p.pl, ...(p.synonyms ?? []), ...(p.formal ?? [])]))
  const visible = found.filter((p) => groupId === null || p.group === groupId)

  return (
    <div className="space-y-4">
      <SearchInput value={query} onChange={setQuery} label="Search in English or Polish" />
      <FilterChips
        label="Groups"
        chips={groups.map((g) => ({ id: g.id, label: g.name, count: found.filter((p) => p.group === g.id).length }))}
        selected={groupId}
        onSelect={setGroupId}
      />
      {basket.ids.length > 0 && (
        <p className="text-sm">
          <span className="text-muted">
            Fiszki list: {basket.ids.length} {basket.ids.length === 1 ? 'phrase' : 'phrases'} ·{' '}
          </span>
          <Link href="/vocabulary/material/fiszki" className="text-brand underline">
            Send to Fiszki
          </Link>
        </p>
      )}
      {visible.length === 0 && <p className="text-muted">No phrases match.</p>}
      {groups.map((g) => {
        const items = visible.filter((p) => p.group === g.id)
        if (items.length === 0) return null
        return (
          <section key={g.id}>
            <h2 className="font-semibold">{g.name}</h2>
            <p className="text-sm text-muted">{g.description}</p>
            <ul className="mt-2 rounded-lg border border-line bg-surface px-4">
              {items.map((p) => (
                <PhraseItem
                  key={p.id}
                  phrase={p}
                  section={section}
                  fiszki={{ inList: basket.has(p.id), sentBefore: sent.has(p.id), toggle: () => basket.toggle(p.id) }}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

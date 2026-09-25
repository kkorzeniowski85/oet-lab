import { useState } from 'react'
import { groupsFor, phrasesFor } from '../../content/index.ts'
import type { Phrase, PhraseSection } from '../../content/types.ts'
import { matches } from '../../lib/search.ts'
import { FilterChips, SearchInput } from '../../ui/controls.tsx'

function PhraseItem({ phrase: p }: { phrase: Phrase }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <details className="group py-3">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="font-medium">{p.en}</span>
            {p.register === 'informal' && (
              <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 align-middle text-xs text-brand">
                informal
              </span>
            )}
            <span className="mt-0.5 block text-sm text-muted">{p.pl}</span>
          </span>
          <span aria-hidden="true" className="mt-0.5 text-muted transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>
        <div className="mt-3 space-y-2 text-sm">
          {p.pronunciation && <p className="text-muted">{p.pronunciation}</p>}
          <ul className="space-y-1.5">
            {p.examples.map((e) => (
              <li key={e} className="border-l-2 border-line pl-3">
                {e}
              </li>
            ))}
          </ul>
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
        </div>
      </details>
    </li>
  )
}

export default function PhraseBank({ section }: { section: PhraseSection }) {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)

  const groups = groupsFor(section)
  const found = phrasesFor(section).filter((p) => matches(query, [p.en, p.pl, ...(p.synonyms ?? []), ...(p.formal ?? [])]))
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
                <PhraseItem key={p.id} phrase={p} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

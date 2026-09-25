import { useState } from 'react'
import { CONTENT } from '../../content/index.ts'
import { matches } from '../../lib/search.ts'
import { FilterChips, SearchInput, SourceLink } from '../../ui/controls.tsx'

export default function AbbreviationList() {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)

  const { abbreviationGroups: groups, abbreviations } = CONTENT
  const found = abbreviations.filter((a) => matches(query, [a.abbr, a.expansion]))
  const visible = found.filter((a) => groupId === null || a.group === groupId)

  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-md bg-brand-soft px-3 py-2 text-sm">
        <p>
          <span className="font-medium text-brand">Writing: </span>
          use abbreviations only as far as your reader will follow them — fewer for a GP or another specialty.{' '}
          <SourceLink href="https://cdn-aus.aglty.io/oet/pdf-files/Writing%20assessment%20criteria.pdf" />
        </p>
        <p>
          <span className="font-medium text-brand">Reading: </span>
          an abbreviation is not accepted as an answer unless it appears in the text.{' '}
          <SourceLink href="https://oet.com/ready/reading" />
        </p>
      </div>
      <SearchInput value={query} onChange={setQuery} label="Search abbreviations" />
      <FilterChips
        label="Groups"
        chips={groups.map((g) => ({ id: g.id, label: g.name, count: found.filter((a) => a.group === g.id).length }))}
        selected={groupId}
        onSelect={setGroupId}
      />
      {visible.length === 0 && <p className="text-muted">No abbreviations match.</p>}
      {groups.map((g) => {
        const items = visible.filter((a) => a.group === g.id)
        if (items.length === 0) return null
        return (
          <section key={g.id}>
            <h2 className="font-semibold">{g.name}</h2>
            <dl className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface px-4">
              {items.map((a) => (
                <div key={a.id} className="grid grid-cols-[5.5rem_1fr] gap-x-3 py-2.5">
                  <dt className="font-semibold">{a.abbr}</dt>
                  <dd>
                    {a.expansion}
                    {a.example && <span className="mt-0.5 block text-sm text-muted">{a.example}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}

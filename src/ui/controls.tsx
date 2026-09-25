export function SearchInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      aria-label={label}
      className="w-full rounded-md border border-line bg-surface px-3 py-2 text-base outline-none focus:border-brand"
    />
  )
}

export interface Chip {
  id: string
  label: string
  count: number
}

/** Single-choice filter; `null` means "All". */
export function FilterChips({
  chips,
  selected,
  onSelect,
  label,
}: {
  chips: Chip[]
  selected: string | null
  onSelect: (id: string | null) => void
  label: string
}) {
  const total = chips.reduce((n, c) => n + c.count, 0)
  const all: Chip & { value: string | null } = { id: 'all', label: 'All', count: total, value: null }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {[all, ...chips.map((c) => ({ ...c, value: c.id }))].map((c) => {
        const active = selected === c.value
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(c.value)}
            className={
              'rounded-full border px-3 py-1 text-sm ' +
              (active ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')
            }
          >
            {c.label} <span className="opacity-70">{c.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SourceLink({ href }: { href: string }) {
  const host = new URL(href).hostname.replace(/^www\./, '')
  const label = host.endsWith('aglty.io') ? 'OET (PDF)' : host
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline">
      Source: {label}
    </a>
  )
}

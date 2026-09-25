import { field } from './buttons.ts'

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
      className={field + ' text-base'}
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
              'inline-flex min-h-10 items-center rounded-full border px-3 text-sm ' +
              (active ? 'border-brand bg-brand-soft text-brand' : 'border-field text-muted')
            }
          >
            {c.label}&nbsp;<span className={active ? 'text-brand' : 'text-muted'}>{c.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SourceLink({ href }: { href: string }) {
  let label = 'link'
  try {
    const host = new URL(href).hostname.replace(/^www\./, '')
    label = host.endsWith('aglty.io') ? 'OET (PDF)' : host
  } catch {
    // A malformed source in content is caught by the content test; show a plain label.
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline">
      Source: {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/**
 * One always-present line for messages, so screen readers hear each change.
 * Errors are announced at once; other messages wait for a pause.
 */
export function StatusLine({ message, tone = 'ok' }: { message: string | null; tone?: 'ok' | 'error' }) {
  const error = tone === 'error' && message
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={'min-h-5 text-sm ' + (error ? 'text-red-700 dark:text-red-400' : 'text-brand')}
    >
      {message}
    </p>
  )
}

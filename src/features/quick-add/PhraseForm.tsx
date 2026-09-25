import { useState } from 'react'
import { groupsFor } from '../../content/index.ts'
import type { PhraseSection } from '../../content/types.ts'

export interface PhraseDraft {
  group: string
  en: string
  pl: string
  example?: string
}

const field = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-brand'

export default function PhraseForm({
  section,
  initial,
  onSave,
  onCancel,
}: {
  section: PhraseSection
  initial?: PhraseDraft
  onSave: (phrase: PhraseDraft) => void
  onCancel: () => void
}) {
  const groups = groupsFor(section)
  const [group, setGroup] = useState(initial?.group ?? groups[0].id)
  const [en, setEn] = useState(initial?.en ?? '')
  const [pl, setPl] = useState(initial?.pl ?? '')
  const [example, setExample] = useState(initial?.example ?? '')
  const ready = en.trim() !== '' && pl.trim() !== ''

  // Switching section in the parent keeps this form, so fall back to the first group of the new section.
  const groupId = groups.some((g) => g.id === group) ? group : groups[0].id

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        const ex = example.trim()
        onSave({ group: groupId, en: en.trim(), pl: pl.trim(), ...(ex && { example: ex }) })
      }}
    >
      <label className="block text-sm">
        <span className="text-muted">Group</span>
        <select value={groupId} onChange={(e) => setGroup(e.target.value)} className={field}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="English" aria-label="English" className={field} />
      <input value={pl} onChange={(e) => setPl(e.target.value)} placeholder="Polish" aria-label="Polish" className={field} />
      <textarea
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder="Example sentence (optional)"
        aria-label="Example sentence"
        rows={2}
        className={field}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={!ready} className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand disabled:opacity-40">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-muted">
          Cancel
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import type { SectionId } from '../../app/sections.ts'
import type { NoteRecord } from '../../data/db.ts'
import { deleteRecord, saveRecord, useRecords } from '../../data/records.ts'
import { matches } from '../../lib/search.ts'
import { SearchInput } from '../../ui/controls.tsx'
import FictionalWarning from '../../ui/FictionalWarning.tsx'

const edited = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function NoteForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { title: string; body: string }
  onSave: (note: { title: string; body: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (body.trim()) onSave({ title: title.trim(), body: body.trim() })
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        aria-label="Title"
        className="w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-brand"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your note"
        aria-label="Note"
        rows={6}
        required
        className="w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-brand"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!body.trim()}
          className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand disabled:opacity-40"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-muted">
          Cancel
        </button>
      </div>
    </form>
  )
}

function NoteItem({ note, onEdit }: { note: NoteRecord; onEdit: () => void }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      {note.title && <h3 className="font-semibold">{note.title}</h3>}
      <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="flex-1 text-muted">Edited {edited(note.updatedAt)}</span>
        <button type="button" onClick={onEdit} className="text-brand">
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete this note?')) void deleteRecord('notes', note.id)
          }}
          className="text-muted"
        >
          Delete
        </button>
      </div>
    </li>
  )
}

export default function NotesView({ section }: { section: SectionId }) {
  const all = useRecords('notes')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const mine = (all ?? []).filter((n) => n.section === section)
  const visible = mine.filter((n) => matches(query, [n.title, n.body]))

  return (
    <div className="space-y-4">
      <FictionalWarning />
      {editing === 'new' ? (
        <NoteForm
          onSave={(n) => void saveRecord('notes', { ...n, section }).then(() => setEditing(null))}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand"
        >
          New note
        </button>
      )}
      {all === undefined && <p className="text-muted">Loading…</p>}
      {all !== undefined && mine.length === 0 && editing !== 'new' && (
        <p className="text-muted">No notes yet. Write down anything you want to remember.</p>
      )}
      {mine.length > 1 && <SearchInput value={query} onChange={setQuery} label="Search your notes" />}
      {mine.length > 0 && visible.length === 0 && <p className="text-muted">No notes match.</p>}
      <ul className="space-y-3">
        {visible.map((n) =>
          editing === n.id ? (
            <li key={n.id} className="rounded-lg border border-brand bg-surface p-4">
              <NoteForm
                initial={n}
                onSave={(edit) =>
                  void saveRecord('notes', { id: n.id, section: n.section, ...edit }).then(() => setEditing(null))
                }
                onCancel={() => setEditing(null)}
              />
            </li>
          ) : (
            <NoteItem key={n.id} note={n} onEdit={() => setEditing(n.id)} />
          ),
        )}
      </ul>
    </div>
  )
}

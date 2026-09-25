import { useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { SECTIONS, findSection, type SectionId } from '../../app/sections.ts'
import { CONTENT } from '../../content/index.ts'
import type { PhraseSection } from '../../content/types.ts'
import { saveRecord } from '../../data/records.ts'
import { NoteForm } from '../notes/NotesView.tsx'
import FictionalWarning from '../../ui/FictionalWarning.tsx'
import PhraseForm from './PhraseForm.tsx'

const PHRASE_SECTIONS: PhraseSection[] = ['writing', 'speaking', 'vocabulary']
const field = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-brand'

function useCurrentSection(): SectionId | undefined {
  const [location] = useLocation()
  return findSection(location.split('/')[1] ?? '')?.id
}

function AddForm({ onDone }: { onDone: () => void }) {
  const current = useCurrentSection()
  const [kind, setKind] = useState<'phrase' | 'note'>('phrase')
  const [phraseSection, setPhraseSection] = useState<PhraseSection>(
    PHRASE_SECTIONS.find((s) => s === current) ?? 'writing',
  )
  const [noteSection, setNoteSection] = useState<SectionId>(current ?? 'writing')
  const [saved, setSaved] = useState<string | null>(null)

  if (saved) {
    return (
      <div className="space-y-3">
        <p>Saved to {saved}.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSaved(null)} className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand">
            Add another
          </button>
          <button type="button" onClick={onDone} className="rounded-md px-4 py-2 text-muted">
            Close
          </button>
        </div>
      </div>
    )
  }

  const sectionName = (id: SectionId) => findSection(id)!.name

  return (
    <div className="space-y-3">
      <div role="group" aria-label="What to add" className="flex gap-2">
        {(['phrase', 'note'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={'rounded-md px-3 py-1.5 text-sm ' + (kind === k ? 'bg-ink text-canvas' : 'bg-canvas text-muted')}
          >
            {k === 'phrase' ? 'Phrase' : 'Note'}
          </button>
        ))}
      </div>

      {kind === 'phrase' ? (
        <>
          <label className="block text-sm">
            <span className="text-muted">Section</span>
            <select value={phraseSection} onChange={(e) => setPhraseSection(e.target.value as PhraseSection)} className={field}>
              {PHRASE_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {sectionName(s)}
                </option>
              ))}
            </select>
          </label>
          <PhraseForm
            section={phraseSection}
            onSave={(p) =>
              void saveRecord('customPhrases', p).then(() => {
                const group = CONTENT.phraseGroups.find((g) => g.id === p.group)!
                setSaved(`${sectionName(phraseSection)} · ${group.name}`)
              })
            }
            onCancel={onDone}
          />
        </>
      ) : (
        <>
          <FictionalWarning />
          <label className="block text-sm">
            <span className="text-muted">Section</span>
            <select value={noteSection} onChange={(e) => setNoteSection(e.target.value as SectionId)} className={field}>
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <NoteForm
            onSave={(n) =>
              void saveRecord('notes', { ...n, section: noteSection }).then(() =>
                setSaved(`${sectionName(noteSection)} · My notes`),
              )
            }
            onCancel={onDone}
          />
        </>
      )}
    </div>
  )
}

// The dialog element owns its open state (Escape and the Android back gesture close it natively),
// so React never keeps a copy that could drift out of step.
export default function QuickAdd({ className }: { className?: string }) {
  const [visit, setVisit] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setVisit((v) => v + 1)
          dialog.current?.showModal()
        }}
        className={className}
      >
        + Add
      </button>
      <dialog
        ref={dialog}
        aria-label="Add a phrase or note"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-4 text-ink backdrop:bg-black/40"
      >
        {/* A new key on every visit starts with an empty form. */}
        <AddForm key={visit} onDone={() => dialog.current?.close()} />
      </dialog>
    </>
  )
}

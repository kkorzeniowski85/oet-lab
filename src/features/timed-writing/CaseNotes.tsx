import type { ResolvedCase } from './cases.ts'

export default function CaseNotes({ kase }: { kase: ResolvedCase }) {
  return (
    <div className="space-y-3 text-sm">
      {kase.writer && <p className="text-muted">{kase.writer}</p>}
      <p className="rounded-md bg-brand-soft px-3 py-2">
        <span className="font-medium text-brand">Task: </span>
        {kase.task}
      </p>
      {typeof kase.notes === 'string' ? (
        <p className="whitespace-pre-wrap">{kase.notes}</p>
      ) : (
        kase.notes.map((s) => (
          <section key={s.heading}>
            <h3 className="font-semibold">{s.heading}</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {s.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

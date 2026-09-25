import { criteriaFor } from '../../content/index.ts'
import type { Criterion } from '../../content/types.ts'
import { SourceLink } from '../../ui/controls.tsx'

const OFFICIAL = {
  writing: 'https://cdn-aus.aglty.io/oet/pdf-files/Writing%20assessment%20criteria.pdf',
  speaking: 'https://cdn-aus.aglty.io/oet/pdf-files/Speaking%20assessment%20criteria%20and%20level%20descriptors.pdf',
}

function CriterionCard({ c }: { c: Criterion }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="font-semibold">{c.name}</h3>
        <span className="text-sm text-muted">
          0–{c.scaleMax}
          {c.bScore !== undefined && <> · B needs {c.bScore}</>}
        </span>
      </div>
      <p className="mt-1 text-sm">{c.summary}</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted">
        {c.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </li>
  )
}

export default function CriteriaList({ subtest }: { subtest: Criterion['subtest'] }) {
  const criteria = criteriaFor(subtest)
  const families =
    subtest === 'speaking'
      ? [
          { title: 'Linguistic criteria', items: criteria.filter((c) => c.family === 'linguistic') },
          { title: 'Clinical communication', items: criteria.filter((c) => c.family === 'clinical') },
        ]
      : [{ title: null, items: criteria }]

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Summaries in our own words, with the scores usually needed for grade B.{' '}
        <SourceLink href={OFFICIAL[subtest]} />
      </p>
      {families.map((f) => (
        <section key={f.title ?? 'all'}>
          {f.title && <h2 className="mb-2 font-semibold">{f.title}</h2>}
          <ul className="space-y-3">
            {f.items.map((c) => (
              <CriterionCard key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

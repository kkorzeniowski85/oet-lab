import { guidesFor } from '../../content/index.ts'
import type { GuideBlock, GuideSection } from '../../content/types.ts'
import { SourceLink } from '../../ui/controls.tsx'

function Block({ block: b }: { block: GuideBlock }) {
  switch (b.type) {
    case 'heading':
      return <h3 className="pt-3 font-semibold">{b.text}</h3>
    case 'text':
      return <p>{b.text}</p>
    case 'list':
      return (
        <ol className="list-decimal space-y-1 pl-5">
          {b.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )
    case 'fact':
      return (
        <p>
          {b.text} <SourceLink href={b.source} />
        </p>
      )
    case 'tip':
      return (
        <p className="rounded-md bg-brand-soft px-3 py-2">
          <span className="font-medium text-brand">Tip: </span>
          {b.text}
        </p>
      )
  }
}

export default function GuideView({ section }: { section: GuideSection }) {
  return (
    <div className="space-y-6">
      {guidesFor(section).map((g) => (
        <article key={g.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          {g.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </article>
      ))}
    </div>
  )
}

import { Link } from 'wouter'
import { SECTIONS, TABS, findSection, isTabId, sectionPath } from './sections.ts'

export function Home() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">OET Lab</h1>
      <p className="mt-1 text-muted">Preparation for the Occupational English Test (Medicine).</p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <Link
              href={sectionPath(s.id)}
              className="block h-full rounded-lg border border-line bg-surface p-4 hover:border-brand"
            >
              <span className="font-medium">{s.name}</span>
              <span className="mt-1 block text-sm text-muted">{s.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SectionPage({ sectionId, tabId }: { sectionId: string; tabId: string }) {
  const section = findSection(sectionId)
  if (!section || !isTabId(tabId)) return <NotFound />
  const tab = TABS.find((t) => t.id === tabId)!

  return (
    <div>
      <h1 className="text-2xl font-semibold">{section.name}</h1>
      <p className="mt-1 text-muted">{section.blurb}</p>
      <nav aria-label={`${section.name} tabs`} className="mt-5 flex gap-1 border-b border-line">
        {TABS.map((t) => {
          const active = t.id === tabId
          return (
            <Link
              key={t.id}
              href={sectionPath(section.id, t.id)}
              aria-current={active ? 'page' : undefined}
              className={
                '-mb-px border-b-2 px-3 py-2 text-sm ' +
                (active ? 'border-brand font-medium text-brand' : 'border-transparent text-muted')
              }
            >
              {t.name}
            </Link>
          )
        })}
      </nav>
      <section className="mt-6 rounded-lg border border-dashed border-line p-6 text-muted">
        <h2 className="font-medium text-ink">{tab.name}</h2>
        <p className="mt-1 text-sm">Nothing here yet. This part is being built.</p>
      </section>
    </div>
  )
}

export function Settings() {
  const built = new Date(__BUILD_TIME__).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-4 text-sm text-muted">Your data stays on this device.</p>
      <p className="mt-6 text-sm text-muted">
        Version {__APP_VERSION__} · built {built}
      </p>
    </div>
  )
}

export function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">
        This page does not exist.{' '}
        <Link href="/" className="text-brand underline">
          Go to Home
        </Link>
      </p>
    </div>
  )
}

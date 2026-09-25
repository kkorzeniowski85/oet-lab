import { Link } from 'wouter'
import { BackupPanel, BackupReminder } from '../features/backup/Backup.tsx'
import NotesView from '../features/notes/NotesView.tsx'
import { usePersistence } from '../lib/storage.ts'
import { VIEWS, tabsFor } from '../sections/views.tsx'
import { SECTIONS, TABS, findSection, isTabId, sectionPath } from './sections.ts'

export function Home() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">OET Lab</h1>
      <p className="mt-1 text-muted">Preparation for the Occupational English Test (Medicine).</p>
      <div className="mt-6">
        <BackupReminder />
      </div>
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

export function SectionPage({
  sectionId,
  tabId,
  viewId,
  itemId,
}: {
  sectionId: string
  tabId: string
  viewId?: string
  itemId?: string
}) {
  const section = findSection(sectionId)
  if (!section || !isTabId(tabId)) return <NotFound />
  const tabs = TABS.filter((t) => tabsFor(section.id).includes(t.id))
  if (!tabs.some((t) => t.id === tabId)) return <NotFound />

  let body
  if (tabId === 'notes') {
    if (viewId !== undefined) return <NotFound />
    body = <NotesView section={section.id} />
  } else {
    const views = VIEWS[tabId][section.id]!
    const view = viewId === undefined ? views[0] : views.find((v) => v.id === viewId)
    if (!view || (itemId !== undefined && !view.item)) return <NotFound />
    const tabName = tabs.find((t) => t.id === tabId)!.name
    body = (
      <>
        {views.length > 1 && (
          <nav aria-label={`${section.name} ${tabName.toLowerCase()}`} className="mb-5 flex flex-wrap gap-2">
            {views.map((v) => (
              <Link
                key={v.id}
                href={`${sectionPath(section.id, tabId)}/${v.id}`}
                aria-current={v.id === view.id ? 'page' : undefined}
                className={
                  'rounded-md px-3 py-1.5 text-sm ' +
                  (v.id === view.id ? 'bg-ink text-canvas' : 'bg-surface text-muted')
                }
              >
                {v.name}
              </Link>
            ))}
          </nav>
        )}
        {/* A new key per view resets its state when switching between views. */}
        <div key={`${section.id}/${tabId}/${view.id}/${itemId ?? ''}`}>
          {itemId !== undefined && view.item ? view.item(itemId) : view.render()}
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{section.name}</h1>
      <p className="mt-1 text-muted">{section.blurb}</p>
      <nav aria-label={`${section.name} tabs`} className="mt-5 flex gap-1 border-b border-line">
        {tabs.map((t) => {
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
      <div className="mt-6">{body}</div>
    </div>
  )
}

export function Settings() {
  const built = new Date(__BUILD_TIME__).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  const persisted = usePersistence()
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-4 text-sm text-muted">Your data stays on this device.</p>
      {persisted !== undefined && (
        <p className="mt-1 text-sm text-muted">
          {persisted
            ? 'Storage is protected: the browser will not clear your data on its own.'
            : 'Storage is not protected: the browser may clear your data when space runs low. Keep backups.'}
        </p>
      )}
      <Link href="/transfer" className="mt-8 block rounded-lg border border-line bg-surface p-4 hover:border-brand">
        <span className="font-medium">Move your work between devices</span>
        <span className="mt-1 block text-sm text-muted">Send a file from one device and merge it on the other.</span>
      </Link>
      <div className="mt-8">
        <BackupPanel />
      </div>
      <p className="mt-10 text-sm text-muted">
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

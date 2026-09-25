import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import QuickAdd from '../features/quick-add/QuickAdd.tsx'
import { SECTIONS } from './sections.ts'

function isActive(location: string, path: string): boolean {
  if (path === '/') return location === '/'
  return location === path || location.startsWith(path + '/')
}

function SideLink({ to, label }: { to: string; label: string }) {
  const [location] = useLocation()
  const active = isActive(location, to)
  return (
    <Link
      href={to}
      aria-current={active ? 'page' : undefined}
      className={
        'block rounded-md px-3 py-2 text-sm ' +
        (active ? 'bg-brand-soft font-medium text-brand' : 'text-ink hover:bg-surface')
      }
    >
      {label}
    </Link>
  )
}

function BottomLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      href={to}
      aria-current={active ? 'page' : undefined}
      className={'flex min-h-14 flex-1 flex-col items-center justify-center text-xs ' + (active ? 'font-semibold text-brand' : 'text-muted')}
    >
      {label}
    </Link>
  )
}

const examSections = SECTIONS.filter((s) => s.exam)
const toolSections = SECTIONS.filter((s) => !s.exam)
/** Screens reached from the "More" tab on the phone. */
const MORE_PATHS = ['/more', '/vocabulary', '/abbreviations', '/transfer', '/settings']

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const main = useRef<HTMLElement>(null)
  const previous = useRef(location)

  // A new screen starts at the top with focus on its content, as a full page load would.
  useEffect(() => {
    if (previous.current === location) return
    previous.current = location
    window.scrollTo({ top: 0 })
    main.current?.focus({ preventScroll: true })
  }, [location])

  const inMore = MORE_PATHS.some((p) => isActive(location, p))

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only z-20 rounded-md bg-brand px-3 py-2 text-on-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="hidden w-56 shrink-0 border-r border-line p-4 md:block">
        <Link href="/" className="mb-4 block px-3 text-lg font-semibold text-brand">
          OET Lab
        </Link>
        <QuickAdd className="mb-6 inline-flex min-h-11 w-full items-center rounded-md bg-brand px-3 text-left text-sm font-medium text-on-brand" />
        <nav aria-label="Main" className="space-y-6">
          <div className="space-y-1">
            <SideLink to="/" label="Home" />
          </div>
          <div className="space-y-1">
            <p className="px-3 text-xs font-medium tracking-wide text-muted uppercase">Exam</p>
            {examSections.map((s) => (
              <SideLink key={s.id} to={`/${s.id}`} label={s.name} />
            ))}
          </div>
          <div className="space-y-1">
            <p className="px-3 text-xs font-medium tracking-wide text-muted uppercase">Tools</p>
            {toolSections.map((s) => (
              <SideLink key={s.id} to={`/${s.id}`} label={s.name} />
            ))}
            <SideLink to="/transfer" label="Move your work" />
          </div>
          <div className="space-y-1">
            <SideLink to="/settings" label="Settings" />
          </div>
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-2 md:hidden">
          <Link href="/" className="inline-flex min-h-11 items-center text-lg font-semibold text-brand">
            OET Lab
          </Link>
          <QuickAdd className="inline-flex min-h-10 items-center rounded-md bg-brand px-3 text-sm font-medium text-on-brand" />
        </header>

        <main
          id="main"
          ref={main}
          tabIndex={-1}
          className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 outline-none md:px-8 md:pb-10"
        >
          {children}
        </main>

        <nav
          aria-label="Sections"
          className="fixed inset-x-0 bottom-0 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <BottomLink to="/" label="Home" active={location === '/'} />
          {examSections.map((s) => (
            <BottomLink key={s.id} to={`/${s.id}`} label={s.short} active={isActive(location, `/${s.id}`)} />
          ))}
          <BottomLink to="/more" label="More" active={inMore} />
        </nav>
      </div>
    </div>
  )
}

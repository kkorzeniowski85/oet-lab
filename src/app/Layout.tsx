import type { ReactNode } from 'react'
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

function BottomLink({ to, label }: { to: string; label: string }) {
  const [location] = useLocation()
  const active = isActive(location, to)
  return (
    <Link
      href={to}
      aria-current={active ? 'page' : undefined}
      className={
        'flex flex-1 flex-col items-center py-3 text-xs ' +
        (active ? 'font-semibold text-brand' : 'text-muted')
      }
    >
      {label}
    </Link>
  )
}

const examSections = SECTIONS.filter((s) => s.exam)
const toolSections = SECTIONS.filter((s) => !s.exam)

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-56 shrink-0 border-r border-line p-4 md:block">
        <Link href="/" className="mb-4 block px-3 text-lg font-semibold text-brand">
          OET Lab
        </Link>
        <QuickAdd className="mb-6 w-full rounded-md bg-brand px-3 py-2 text-left text-sm font-medium text-on-brand" />
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
          </div>
          <div className="space-y-1">
            <SideLink to="/settings" label="Settings" />
          </div>
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <Link href="/" className="text-lg font-semibold text-brand">
            OET Lab
          </Link>
          <div className="flex items-center gap-4">
            <QuickAdd className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand" />
            <Link href="/settings" className="text-sm text-muted">
              Settings
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">{children}</main>

        <nav
          aria-label="Sections"
          className="fixed inset-x-0 bottom-0 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <BottomLink to="/" label="Home" />
          {examSections.map((s) => (
            <BottomLink key={s.id} to={`/${s.id}`} label={s.short} />
          ))}
        </nav>
      </div>
    </div>
  )
}

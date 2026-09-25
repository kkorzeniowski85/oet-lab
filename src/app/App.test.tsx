import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { SECTIONS, TABS } from './sections.ts'

const render = (path: string) => renderToString(<App ssrPath={path} />)

describe('routing', () => {
  it('shows Home at /', () => {
    expect(render('/')).toContain('Preparation for the Occupational English Test')
  })

  it('shows Settings', () => {
    expect(render('/settings')).toContain('Your data stays on this device.')
  })

  it.each(SECTIONS.flatMap((s) => TABS.map((t) => [s.id, t.id, s.name, t.name] as const)))(
    'opens /%s/%s directly',
    (sectionId, tabId, sectionName, tabName) => {
      const html = render(`/${sectionId}/${tabId}`)
      expect(html).toContain(`<h1 class="text-2xl font-semibold">${sectionName}</h1>`)
      expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>${tabName}<`))
      expect(html).not.toContain('Page not found')
    },
  )

  it('rejects an unknown section', () => {
    expect(render('/chemistry/material')).toContain('Page not found')
  })

  it('rejects an unknown tab', () => {
    expect(render('/writing/exam')).toContain('Page not found')
  })

  it('rejects an unknown path', () => {
    expect(render('/a/b/c')).toContain('Page not found')
  })
})

describe('sections', () => {
  it('has four exam sections and two tools, with unique ids', () => {
    expect(SECTIONS.filter((s) => s.exam)).toHaveLength(4)
    expect(SECTIONS.filter((s) => !s.exam)).toHaveLength(2)
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length)
  })
})

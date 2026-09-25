import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { tabsFor } from '../sections/views.tsx'
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

  it.each(
    SECTIONS.flatMap((s) =>
      TABS.filter((t) => tabsFor(s.id).includes(t.id)).map((t) => [s.id, t.id, s.name, t.name] as const),
    ),
  )(
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

  it('has Practice only where there is something to practise', () => {
    expect(tabsFor('writing')).toEqual(['material', 'practice', 'notes'])
    expect(tabsFor('listening')).toEqual(['material', 'notes'])
    expect(render('/listening/practice')).toContain('Page not found')
    expect(render('/listening/material')).not.toContain('>Practice<')
  })

  it('opens Timed writing first in Writing practice, with an address for each letter', () => {
    expect(render('/writing/practice')).toMatch(/aria-current="page"[^>]*>Timed writing</)
    expect(render('/writing/practice/letters/abc')).not.toContain('Page not found')
    expect(render('/writing/practice/gapfill/abc')).toContain('Page not found')
  })

  it('opens gap-fill in Practice', () => {
    const html = render('/vocabulary/practice')
    expect(html).toContain('Fill the gap in real example sentences.')
    expect(html.replaceAll('<!-- -->', '')).toContain('Start 10 questions')
  })

  it('rejects an unknown path', () => {
    expect(render('/a/b/c')).toContain('Page not found')
  })
})

describe('material views', () => {
  it.each([
    ['/writing/material', 'I am writing to refer...'],
    ['/writing/material/criteria', 'Conciseness &amp; Clarity'],
    ['/writing/material/structure', 'A typical referral letter'],
    ['/speaking/material', 'How would you like me to address you?'],
    ['/speaking/material/criteria', 'Clinical communication'],
    ['/speaking/material/roleplay', 'Role-play format'],
    ['/vocabulary/material', 'Everyday British English'],
    ['/listening/material', 'Part A — consultation notes'],
    ['/reading/material', 'Abbreviations are not accepted unless they appear in the texts.'],
    ['/abbreviations/material', 'once daily'],
  ])('%s shows its content', (path, text) => {
    const html = render(path)
    expect(html).toContain(text)
    expect(html).not.toContain('Page not found')
  })

  it('shows sub-views only where a section has more than one', () => {
    expect(render('/writing/material')).toContain('aria-label="Writing material"')
    expect(render('/abbreviations/material')).not.toContain('aria-label="Abbreviations material"')
  })

  it('shows My notes with the fictional-data warning', () => {
    const html = render('/speaking/notes')
    expect(html).toContain('Fictional cases only.')
    expect(html).toContain('New note')
  })

  it('rejects an unknown view', () => {
    expect(render('/writing/material/nope')).toContain('Page not found')
  })

  it('rejects a view on a tab that has none', () => {
    expect(render('/writing/practice/criteria')).toContain('Page not found')
  })
})

describe('sections', () => {
  it('has four exam sections and two tools, with unique ids', () => {
    expect(SECTIONS.filter((s) => s.exam)).toHaveLength(4)
    expect(SECTIONS.filter((s) => !s.exam)).toHaveLength(2)
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length)
  })
})

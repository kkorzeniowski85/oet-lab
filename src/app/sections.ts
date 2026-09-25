export const SECTIONS = [
  { id: 'listening', name: 'Listening', short: 'Listen', blurb: 'Consultation notes, workplace extracts, presentations: what to listen for.', exam: true },
  { id: 'reading', name: 'Reading', short: 'Read', blurb: 'Fast reading of guidelines, short workplace texts and articles.', exam: true },
  { id: 'writing', name: 'Writing', short: 'Write', blurb: 'Referral letters: phrases, model letters, timed practice.', exam: true },
  { id: 'speaking', name: 'Speaking', short: 'Speak', blurb: 'Role-play phrases and practice cards.', exam: true },
  { id: 'vocabulary', name: 'Vocabulary', short: 'Words', blurb: 'Medical terms, hospital talk and everyday British English.', exam: false },
  { id: 'abbreviations', name: 'Abbreviations', short: 'Abbr.', blurb: 'Clinical abbreviations you will meet in the test.', exam: false },
] as const

export const TABS = [
  { id: 'material', name: 'Material' },
  { id: 'practice', name: 'Practice' },
  { id: 'notes', name: 'My notes' },
] as const

export type Section = (typeof SECTIONS)[number]
export type SectionId = Section['id']
export type TabId = (typeof TABS)[number]['id']

export function findSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id)
}

export function isTabId(id: string): id is TabId {
  return TABS.some((t) => t.id === id)
}

export function sectionPath(section: SectionId, tab: TabId = 'material'): string {
  return `/${section}/${tab}`
}

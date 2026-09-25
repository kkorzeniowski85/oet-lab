export type PhraseSection = 'writing' | 'speaking' | 'vocabulary'
export type GuideSection = 'listening' | 'reading' | 'writing' | 'speaking'
export type Kind = 'word' | 'phrase' | 'expression' | 'sentence'
export type Register = 'neutral' | 'informal'

export interface PhraseGroup {
  id: string
  section: PhraseSection
  name: string
  description: string
}

export interface Phrase {
  id: string
  group: string
  en: string
  pl: string
  kind: Kind
  examples: string[]
  synonyms?: string[]
  /** Formal equivalents of an informal expression. */
  formal?: string[]
  pronunciation?: string
  register?: Register
  /** Where the item came from, e.g. a Fiszki source_ref. Reused when sending back to Fiszki. */
  source: string
}

export interface AbbreviationGroup {
  id: string
  name: string
}

export interface Abbreviation {
  id: string
  group: string
  abbr: string
  expansion: string
  example?: string
  source: string
}

export interface Criterion {
  id: string
  subtest: 'writing' | 'speaking'
  /** Speaking only: the two families of criteria. */
  family?: 'linguistic' | 'clinical'
  name: string
  scaleMax: number
  /** Score typically needed for grade B, where the official materials give one. */
  bScore?: number
  summary: string
  checklist: string[]
}

export type GuideBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'fact'; text: string; source: string }
  | { type: 'tip'; text: string }

export interface Guide {
  id: string
  section: GuideSection
  title: string
  blocks: GuideBlock[]
}

export interface Content {
  phraseGroups: PhraseGroup[]
  phrases: Phrase[]
  abbreviationGroups: AbbreviationGroup[]
  abbreviations: Abbreviation[]
  criteria: Criterion[]
  guides: Guide[]
}

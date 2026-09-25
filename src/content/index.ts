import abbreviationGroups from '../../content/abbreviation-groups.json'
import abbreviations from '../../content/abbreviations.json'
import criteria from '../../content/criteria.json'
import guides from '../../content/guides.json'
import phraseGroups from '../../content/phrase-groups.json'
import speaking from '../../content/phrases.speaking.json'
import vocabulary from '../../content/phrases.vocabulary.json'
import writing from '../../content/phrases.writing.json'
import rolePlays from '../../content/roleplays.json'
import writingCases from '../../content/writing-cases.json'
import type {
  Abbreviation,
  AbbreviationGroup,
  Content,
  Criterion,
  Guide,
  GuideSection,
  Phrase,
  PhraseGroup,
  PhraseSection,
  RolePlay,
  WritingCase,
} from './types.ts'

// The JSON shapes are checked by validate.test.ts, which runs before every deploy.
export const CONTENT: Content = {
  phraseGroups: phraseGroups as PhraseGroup[],
  phrases: [...writing, ...speaking, ...vocabulary] as Phrase[],
  abbreviationGroups: abbreviationGroups as AbbreviationGroup[],
  abbreviations: abbreviations as Abbreviation[],
  criteria: criteria as Criterion[],
  guides: guides as Guide[],
  writingCases: writingCases as WritingCase[],
  rolePlays: rolePlays as RolePlay[],
}

export function groupsFor(section: PhraseSection): PhraseGroup[] {
  return CONTENT.phraseGroups.filter((g) => g.section === section)
}

export function phrasesFor(section: PhraseSection): Phrase[] {
  const groups = new Set(groupsFor(section).map((g) => g.id))
  return CONTENT.phrases.filter((p) => groups.has(p.group))
}

export function criteriaFor(subtest: Criterion['subtest']): Criterion[] {
  return CONTENT.criteria.filter((c) => c.subtest === subtest)
}

export function guidesFor(section: GuideSection): Guide[] {
  return CONTENT.guides.filter((g) => g.section === section)
}

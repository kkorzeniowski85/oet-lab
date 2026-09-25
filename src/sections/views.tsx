import type { ReactNode } from 'react'
import type { SectionId, TabId } from '../app/sections.ts'
import AbbreviationList from '../features/abbreviations/AbbreviationList.tsx'
import CriteriaList from '../features/criteria/CriteriaList.tsx'
import GapFill from '../features/gapfill/GapFill.tsx'
import GuideView from '../features/guides/GuideView.tsx'
import PhraseBank from '../features/phrase-bank/PhraseBank.tsx'
import RolePlayPractice from '../features/roleplay/RolePlayPractice.tsx'
import { LetterList, LetterReview } from '../features/timed-writing/Letters.tsx'
import TimedWriting from '../features/timed-writing/TimedWriting.tsx'

export interface View {
  id: string
  name: string
  render: () => ReactNode
  /** Views with their own items (e.g. one letter) take an id from the address. */
  item?: (id: string) => ReactNode
}

/** Sub-views of the Material and Practice tabs; the first one is the default. A missing section hides the tab. */
export const VIEWS: Record<Exclude<TabId, 'notes'>, Partial<Record<SectionId, View[]>>> = {
  material: {
    listening: [{ id: 'guide', name: 'Guide', render: () => <GuideView section="listening" /> }],
    reading: [{ id: 'guide', name: 'Guide', render: () => <GuideView section="reading" /> }],
    writing: [
      { id: 'phrases', name: 'Phrases', render: () => <PhraseBank section="writing" /> },
      { id: 'criteria', name: 'Criteria', render: () => <CriteriaList subtest="writing" /> },
      { id: 'structure', name: 'Letter structure', render: () => <GuideView section="writing" /> },
    ],
    speaking: [
      { id: 'phrases', name: 'Phrases', render: () => <PhraseBank section="speaking" /> },
      { id: 'criteria', name: 'Criteria', render: () => <CriteriaList subtest="speaking" /> },
      { id: 'roleplay', name: 'Role-play format', render: () => <GuideView section="speaking" /> },
    ],
    vocabulary: [{ id: 'phrases', name: 'Phrases', render: () => <PhraseBank section="vocabulary" /> }],
    abbreviations: [{ id: 'list', name: 'Abbreviations', render: () => <AbbreviationList /> }],
  },
  practice: {
    writing: [
      { id: 'timed', name: 'Timed writing', render: () => <TimedWriting /> },
      { id: 'gapfill', name: 'Gap-fill', render: () => <GapFill section="writing" /> },
      { id: 'letters', name: 'My letters', render: () => <LetterList />, item: (id) => <LetterReview id={id} /> },
    ],
    speaking: [
      { id: 'roleplay', name: 'Role-play', render: () => <RolePlayPractice /> },
      { id: 'gapfill', name: 'Gap-fill', render: () => <GapFill section="speaking" /> },
    ],
    vocabulary: [{ id: 'gapfill', name: 'Gap-fill', render: () => <GapFill section="vocabulary" /> }],
  },
}

export function tabsFor(section: SectionId): TabId[] {
  return (['material', 'practice', 'notes'] as const).filter((t) => t === 'notes' || VIEWS[t][section] !== undefined)
}

import type { ReactNode } from 'react'
import type { SectionId } from '../app/sections.ts'
import AbbreviationList from '../features/abbreviations/AbbreviationList.tsx'
import CriteriaList from '../features/criteria/CriteriaList.tsx'
import GuideView from '../features/guides/GuideView.tsx'
import PhraseBank from '../features/phrase-bank/PhraseBank.tsx'

export interface MaterialView {
  id: string
  name: string
  render: () => ReactNode
}

/** Views inside each section's Material tab; the first one is the default. */
export const MATERIAL_VIEWS: Record<SectionId, MaterialView[]> = {
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
}

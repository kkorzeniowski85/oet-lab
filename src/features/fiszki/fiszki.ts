import type { Phrase } from '../../content/types.ts'
import type { CustomPhraseRecord } from '../../data/db.ts'
import { setSetting, useSetting } from '../../data/records.ts'

export const FISZKI_URL = 'https://kkorzeniowski85.github.io/projekt-os-03/'
/** Above this, the shared text gets too long for the share sheet; use a file instead. */
export const SHARE_LIMIT = 60

// Phrases imported from Fiszki keep their original source_ref, so Fiszki recognises them instead of adding copies.
const FROM_FISZKI = /^oet-(core|terminy|frazy|skroty)\//

export interface FiszkiNote {
  front: string
  back: string
  example?: string
  pronunciation?: string
  synonyms?: string[]
  formal?: string[]
  tags: string[]
  kind?: Phrase['kind']
  note_type?: 'basic' | 'basic_reversed'
  source_ref: string
}

const TAGS = ['oet', 'oet-lab']

export function fromPhrase(p: Phrase): FiszkiNote {
  return {
    front: p.en,
    back: p.pl,
    ...(p.examples.length > 0 && { example: p.examples.join('\n') }),
    ...(p.pronunciation && { pronunciation: p.pronunciation }),
    ...(p.synonyms && { synonyms: p.synonyms }),
    ...(p.formal && { formal: p.formal }),
    tags: TAGS,
    kind: p.kind,
    // A whole sentence is recognised, not produced from Polish (Fiszki's own rule).
    note_type: p.kind === 'sentence' ? 'basic' : 'basic_reversed',
    source_ref: FROM_FISZKI.test(p.source) ? p.source : `oet-lab/${p.id}`,
  }
}

/** Your own phrases have no kind; Fiszki guesses it from the text. */
export function fromOwnPhrase(r: CustomPhraseRecord): FiszkiNote {
  return {
    front: r.en,
    back: r.pl,
    ...(r.example && { example: r.example }),
    tags: TAGS,
    source_ref: `oet-lab/mine/${r.id}`,
  }
}

export function fiszkiFile(notes: FiszkiNote[]): { format: 'fiszki/v1'; deck: string; notes: FiszkiNote[] } {
  return { format: 'fiszki/v1', deck: 'OET Lab', notes }
}

const BASKET = 'fiszkiBasket'

/** The phrases picked for Fiszki on this device. */
export function useFiszkiBasket(): { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void; clear: () => void } {
  const ids = useSetting<string[]>(BASKET) ?? []
  return {
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => void setSetting(BASKET, ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    clear: () => void setSetting(BASKET, []),
  }
}

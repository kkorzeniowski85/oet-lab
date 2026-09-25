import { fold } from '../../lib/search.ts'

export interface Gap {
  before: string
  answer: string
  after: string
}

export interface Form {
  text: string
  /** The dictionary form started with "to", so its first word is a verb that may inflect. */
  verbFirst: boolean
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const WORDS_1_TO_3 = "[\\w'’-]+(?:\\s+[\\w'’-]+){0,2}"
const WILDCARD = '…'

// Placeholders in dictionary forms stand for a few words of the real sentence.
const PLACEHOLDERS: Record<string, string> = {
  someone: WORDS_1_TO_3,
  something: "[\\w'’-]+(?:\\s+[\\w'’-]+){0,3}",
  "one's": '(?:my|your|his|her|its|our|their)',
  your: '(?:my|your|his|her|its|our|their)',
  a: '(?:a|an|the)',
  an: '(?:a|an|the)',
  the: '(?:a|an|the)',
  [WILDCARD]: WORDS_1_TO_3,
}

const IRREGULAR: Record<string, string> = {
  go: '(?:go|goes|going|gone|went)',
  get: '(?:get|gets|getting|got|gotten)',
  put: '(?:put|puts|putting)',
  come: '(?:come|comes|coming|came)',
  take: '(?:take|takes|taking|took|taken)',
  give: '(?:give|gives|giving|gave|given)',
  keep: '(?:keep|keeps|keeping|kept)',
  bring: '(?:bring|brings|bringing|brought)',
  break: '(?:break|breaks|breaking|broke|broken)',
  see: '(?:see|sees|seeing|saw|seen)',
  run: '(?:run|runs|running|ran)',
  pull: '(?:pull|pulls|pulling|pulled)',
  have: '(?:have|has|having|had)',
}

/** Dictionary form → the forms that can appear in a sentence ("to be commenced on" → "commenced on"). */
export function phraseForms(phrase: string): Form[] {
  const clean = phrase.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  return clean
    .split(' / ')
    .map((alt) => {
      const verbFirst = /^to /i.test(alt.trim())
      const text = alt
        .trim()
        .replace(/^to be /i, '')
        .replace(/^to /i, '')
        .replace(/\s*(?:\.\.\.|…)?\s*[?.!]*$/, '')
        .replace(/\s*(?:\.\.\.|…)\s*/g, ` ${WILDCARD} `)
        .trim()
      return { text, verbFirst }
    })
    .filter((f) => f.text.length > 0)
}

function wordPattern(word: string, verb: boolean): string {
  const lower = word.toLowerCase()
  if (PLACEHOLDERS[lower]) return PLACEHOLDERS[lower]
  if (verb && IRREGULAR[lower]) return IRREGULAR[lower]
  if (/^[a-z]+$/.test(lower)) {
    // Longer words may inflect (deteriorate → deteriorated); short verbs double their consonant (pop → popping).
    if (lower.length >= 4) return `${escape(lower.replace(/(e|y)$/, ''))}[a-z]*`
    if (verb) return `${lower}(?:${lower.at(-1)})?(?:s|es|ed|d|ing)?`
  }
  return escape(word).replace(/['’]/g, "['’]")
}

function formPattern(form: Form): RegExp {
  // Hyphens separate words ("follow-up" = "follow up"); punctuation is not part of a word.
  const words = form.text
    .split(/[\s-]+/)
    .map((w) => (w === WILDCARD ? w : w.replace(/^[^\w'’…]+|[^\w'’…]+$/g, '')))
    .filter(Boolean)
  const parts = words.map((w, i) => wordPattern(w, form.verbFirst && i === 0))
  return new RegExp(`(?<![\\w-])${parts.join('[\\s,;:—–-]+')}(?![\\w-])`, 'i')
}

/** Finds the phrase in the sentence; null when it cannot be located reliably. */
export function findGap(phrase: string, sentence: string): Gap | null {
  for (const form of phraseForms(phrase)) {
    const m = formPattern(form).exec(sentence)
    if (m && m[0].trim().length > 0) {
      return { before: sentence.slice(0, m.index), answer: m[0], after: sentence.slice(m.index + m[0].length) }
    }
  }
  return null
}

const normalise = (s: string) =>
  fold(s)
    .replace(/[-‐‑–]/g, ' ')
    .replace(/[^\p{L}\p{N}' ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

export type Verdict = 'correct' | 'close' | 'wrong'

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = row[j]
      row[j] = next
    }
  }
  return row[b.length]
}

/** Case, punctuation, hyphens and spacing do not matter; spelling does. "close" = likely a typo. */
export function checkAnswer(given: string, expected: string): Verdict {
  const a = normalise(given)
  const b = normalise(expected)
  if (a === b) return 'correct'
  if (a.length > 0 && distance(a, b) <= Math.max(1, Math.floor(b.length / 8))) return 'close'
  return 'wrong'
}

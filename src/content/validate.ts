import type { Content } from './types.ts'

const PHRASE_SECTIONS = ['writing', 'speaking', 'vocabulary']
const GUIDE_SECTIONS = ['listening', 'reading', 'writing', 'speaking']
const KINDS = ['word', 'phrase', 'expression', 'sentence']
const REGISTERS = ['neutral', 'informal']
const BLOCK_TYPES = ['heading', 'text', 'list', 'fact', 'tip']

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** Returns every problem found; an empty list means the content is usable. */
export function validateContent(c: Content): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  const checkId = (kind: string, id: unknown) => {
    if (!filled(id)) errors.push(`${kind}: missing id`)
    else if (seen.has(id)) errors.push(`${kind} ${id}: duplicate id`)
    else seen.add(id)
  }
  const need = (where: string, field: string, v: unknown) => {
    if (!filled(v)) errors.push(`${where}: missing ${field}`)
  }

  const groupSection = new Map<string, string>()
  for (const g of c.phraseGroups) {
    checkId('phrase group', g.id)
    need(`group ${g.id}`, 'name', g.name)
    need(`group ${g.id}`, 'description', g.description)
    if (!PHRASE_SECTIONS.includes(g.section)) errors.push(`group ${g.id}: unknown section "${g.section}"`)
    groupSection.set(g.id, g.section)
  }

  const used = new Set<string>()
  for (const p of c.phrases) {
    const at = `phrase ${p.id}`
    checkId('phrase', p.id)
    need(at, 'en', p.en)
    need(at, 'pl', p.pl)
    need(at, 'source', p.source)
    if (!groupSection.has(p.group)) errors.push(`${at}: unknown group "${p.group}"`)
    used.add(p.group)
    if (!KINDS.includes(p.kind)) errors.push(`${at}: unknown kind "${p.kind}"`)
    if (p.register !== undefined && !REGISTERS.includes(p.register)) errors.push(`${at}: unknown register "${p.register}"`)
    if (!Array.isArray(p.examples) || p.examples.length === 0) errors.push(`${at}: needs at least one example`)
    else if (!p.examples.every(filled)) errors.push(`${at}: empty example`)
    for (const list of ['synonyms', 'formal'] as const) {
      const v = p[list]
      if (v !== undefined && (v.length === 0 || !v.every(filled))) errors.push(`${at}: empty ${list}`)
    }
  }
  for (const g of c.phraseGroups) if (!used.has(g.id)) errors.push(`group ${g.id}: has no phrases`)

  const abbrGroups = new Set<string>()
  for (const g of c.abbreviationGroups) {
    checkId('abbreviation group', g.id)
    need(`abbreviation group ${g.id}`, 'name', g.name)
    abbrGroups.add(g.id)
  }
  const abbrs = new Set<string>()
  for (const a of c.abbreviations) {
    const at = `abbreviation ${a.id}`
    checkId('abbreviation', a.id)
    need(at, 'abbr', a.abbr)
    need(at, 'expansion', a.expansion)
    need(at, 'source', a.source)
    if (!abbrGroups.has(a.group)) errors.push(`${at}: unknown group "${a.group}"`)
    if (abbrs.has(a.abbr)) errors.push(`${at}: "${a.abbr}" listed twice`)
    abbrs.add(a.abbr)
  }

  for (const k of c.criteria) {
    const at = `criterion ${k.id}`
    checkId('criterion', k.id)
    need(at, 'name', k.name)
    need(at, 'summary', k.summary)
    if (k.subtest !== 'writing' && k.subtest !== 'speaking') errors.push(`${at}: unknown subtest "${k.subtest}"`)
    if (k.subtest === 'speaking' && k.family !== 'linguistic' && k.family !== 'clinical')
      errors.push(`${at}: speaking criteria need a family`)
    if (!(k.scaleMax > 0)) errors.push(`${at}: scaleMax must be positive`)
    if (k.bScore !== undefined && (k.bScore < 0 || k.bScore > k.scaleMax)) errors.push(`${at}: bScore outside the scale`)
    if (!Array.isArray(k.checklist) || k.checklist.length === 0 || !k.checklist.every(filled))
      errors.push(`${at}: needs a checklist`)
  }

  for (const g of c.guides) {
    const at = `guide ${g.id}`
    checkId('guide', g.id)
    need(at, 'title', g.title)
    if (!GUIDE_SECTIONS.includes(g.section)) errors.push(`${at}: unknown section "${g.section}"`)
    if (!Array.isArray(g.blocks) || g.blocks.length === 0) errors.push(`${at}: has no blocks`)
    for (const [i, b] of (g.blocks ?? []).entries()) {
      if (!BLOCK_TYPES.includes(b.type)) errors.push(`${at} block ${i}: unknown type "${b.type}"`)
      else if (b.type === 'list') {
        if (b.items.length === 0 || !b.items.every(filled)) errors.push(`${at} block ${i}: empty list`)
      } else {
        need(`${at} block ${i}`, 'text', b.text)
        if (b.type === 'fact') need(`${at} block ${i}`, 'source', b.source)
      }
    }
  }

  return errors
}

// One-time import of the OET material from the Fiszki app into content/*.json.
// After the import, content/ is the source of truth: the script refuses to overwrite it.
//   node scripts/import-fiszki.mjs <path-to-fiszki/frontend/public/slownik>
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = process.argv[2]
if (!SOURCE) {
  console.error('Usage: node scripts/import-fiszki.mjs <path-to-fiszki/frontend/public/slownik>')
  process.exit(1)
}
const OUT = new URL('../content/', import.meta.url)

// Group assignment for oet-core (c/…) and oet-terminologia (t/…), reviewed by the user.
const GROUPS = {
  'w-purpose': ['c/m101', 'c/m102'],
  'w-history': ['c/m221', 'c/m222', 'c/m223', 'c/m224', 'c/m225'],
  'w-findings': ['t/m11', 'c/m170', 't/m6', 't/m8', 't/m9', 't/m10', 't/m14', 't/m15', 'c/m226', 'c/m227', 'c/m118'],
  'w-management': [
    'c/m112', 'c/m171', 'c/m172', 'c/m173', 'c/m174', 'c/m185', 'c/m186', 'c/m189',
    'c/m180', 'c/m187', 'c/m190', 'c/m228', 'c/m229', 't/m12', 't/m13', 'c/m117',
  ],
  'w-request': ['c/m107', 'c/m114', 'c/m119', 'c/m230'],
  'w-closing': ['c/m106', 'c/m120', 'c/m108', 'c/m113'],
  'w-linking': ['c/m104', 'c/m105', 'c/m109', 'c/m110', 'c/m111', 'c/m115', 'c/m116'],
  's-gathering': ['c/m214'],
  's-explaining': ['c/m207', 'c/m217', 'c/m210', 'c/m213', 'c/m208', 't/m7', 'c/m212', 'c/m209'],
  's-empathy': ['c/m206', 'c/m216', 'c/m219'],
  's-plan': ['c/m218', 'c/m211', 'c/m215'],
  's-closing': ['c/m220'],
  'v-symptoms': [
    122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 136, 137, 138, 139, 140, 141, 142, 143, 144,
    145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165,
    166, 167, 168, 169,
  ].map((n) => `c/m${n}`),
  'v-clinical': [
    'c/m175', 'c/m176', 'c/m177', 'c/m178', 'c/m179', 'c/m181', 'c/m182', 'c/m183', 'c/m184', 'c/m188',
    't/m1', 't/m2', 't/m3', 't/m4', 't/m5', 't/m16', 't/m17',
  ],
  'v-nhs': Array.from({ length: 15 }, (_, i) => `c/m${191 + i}`),
}

const ABBREVIATION_GROUPS = {
  dawkowanie: 'a-dosing',
  badania: 'a-investigations',
  notatki: 'a-notes',
  objawy: 'a-symptoms',
  czas: 'a-time',
  parametry: 'a-observations',
  nhs: 'a-services',
  rozpoznania: 'a-diagnoses',
}

const SECTION_OF = { w: 'writing', s: 'speaking', v: 'vocabulary' }

const splitList = (s) => s.split(' / ').map((x) => x.trim()).filter(Boolean)

// Fiszki glues annotations into `example`: header lines, a blank line, then sentences.
function parseExample(raw, ref) {
  const blank = raw.indexOf('\n\n')
  const head = blank === -1 ? [] : raw.slice(0, blank).split('\n')
  const body = blank === -1 ? raw : raw.slice(blank + 2)
  const out = {}
  for (const line of head) {
    if (line.startsWith('Synonimy:')) out.synonyms = splitList(line.slice('Synonimy:'.length))
    else if (line.startsWith('Formalnie (OET):')) out.formal = splitList(line.slice('Formalnie (OET):'.length))
    else if (/^\/.+\/$/.test(line.trim())) out.pronunciation = line.trim()
    else throw new Error(`${ref}: unexpected annotation line "${line}"`)
  }
  out.examples = body.split('\n').map((s) => s.trim()).filter(Boolean)
  return out
}

const load = (file) => JSON.parse(readFileSync(join(SOURCE, file), 'utf8')).notes

function phrase(note, id, group) {
  const { examples, synonyms, formal, pronunciation } = parseExample(note.example, note.source_ref)
  const informal = note.tags.includes('nieformalne') || note.tags.includes('med-slang')
  return {
    id,
    group,
    en: note.front,
    pl: note.back,
    kind: note.kind,
    examples,
    ...(synonyms && { synonyms }),
    ...(formal && { formal }),
    ...(pronunciation && { pronunciation }),
    ...(informal && { register: 'informal' }),
    source: note.source_ref,
  }
}

const bySection = { writing: [], speaking: [], vocabulary: [] }
const groupOf = new Map(Object.entries(GROUPS).flatMap(([g, refs]) => refs.map((r) => [r, g])))
const unassigned = []

// Short refs match the GROUPS table: oet-core/m101 → c/m101, oet-terminy/m11/on-examination → t/m11.
const cores = [
  ...load('oet-core.json').map((n) => [n, n.source_ref.replace('oet-core/', 'c/')]),
  ...load('oet-terminologia.json').map((n) => [n, 't/' + n.source_ref.split('/')[1]]),
]
const collected = new Map()
for (const [note, short] of cores) {
  const group = groupOf.get(short)
  if (!group) {
    unassigned.push(`${short}  ${note.front}`)
    continue
  }
  const id = short.replace('c/', 'core-').replace('t/', 'term-')
  collected.set(short, phrase(note, id, group))
}
// Keep the order of the GROUPS table, so each group reads in a sensible sequence.
for (const [group, refs] of Object.entries(GROUPS)) {
  for (const r of refs) {
    const p = collected.get(r)
    if (!p) throw new Error(`${r} is assigned to ${group} but missing from the source`)
    bySection[SECTION_OF[group[0]]].push(p)
  }
}

for (const note of load('oet-codziennosc.json'))
  bySection.vocabulary.push(phrase(note, 'everyday-' + note.source_ref.split('/')[1], 'v-everyday'))
for (const note of load('oet-nhs.json'))
  bySection.vocabulary.push(phrase(note, 'ward-' + note.source_ref.split('/')[1], 'v-workplace'))

const abbreviations = load('oet-skroty.json').map((note) => {
  const groups = note.tags.map((t) => ABBREVIATION_GROUPS[t]).filter(Boolean)
  if (groups.length !== 1) throw new Error(`${note.source_ref}: expected one group tag, got ${note.tags.join(',')}`)
  return {
    id: 'abbr-' + note.source_ref.split('/')[1],
    group: groups[0],
    abbr: note.front,
    expansion: note.back,
    ...(note.example && { example: note.example.trim() }),
    source: note.source_ref,
  }
})

if (unassigned.length) {
  console.error('Not assigned to any group:\n  ' + unassigned.join('\n  '))
  process.exit(1)
}

const files = {
  'phrases.writing.json': bySection.writing,
  'phrases.speaking.json': bySection.speaking,
  'phrases.vocabulary.json': bySection.vocabulary,
  'abbreviations.json': abbreviations,
}
for (const name of Object.keys(files)) {
  if (existsSync(new URL(name, OUT))) {
    console.error(`content/${name} already exists; content/ is now the source of truth. Nothing written.`)
    process.exit(1)
  }
}
for (const [name, data] of Object.entries(files)) {
  writeFileSync(new URL(name, OUT), JSON.stringify(data, null, 2) + '\n')
  console.log(`content/${name}: ${data.length}`)
}

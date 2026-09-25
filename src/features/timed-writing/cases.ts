import { CONTENT } from '../../content/index.ts'
import type { CaseNotesSection } from '../../content/types.ts'
import type { CustomCaseRecord, LetterRecord } from '../../data/db.ts'

export interface ResolvedCase {
  title: string
  writer?: string
  task: string
  /** Structured sections for built-in cases, plain text for your own. */
  notes: CaseNotesSection[] | string
  modelLetter?: string
}

export function resolveCase(
  letter: Pick<LetterRecord, 'caseKind' | 'caseId'>,
  customCases: CustomCaseRecord[],
): ResolvedCase | null {
  if (letter.caseKind === 'builtin') return CONTENT.writingCases.find((c) => c.id === letter.caseId) ?? null
  const own = customCases.find((c) => c.id === letter.caseId)
  return own ? { title: own.title, task: own.task, notes: own.notes } : null
}

export function notesAsText(notes: ResolvedCase['notes']): string {
  if (typeof notes === 'string') return notes
  return notes.map((s) => `${s.heading}\n${s.lines.map((l) => `- ${l}`).join('\n')}`).join('\n\n')
}

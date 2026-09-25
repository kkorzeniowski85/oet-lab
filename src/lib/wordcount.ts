/** Words as OET counts them roughly: anything between spaces that contains a letter or digit. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

/** The body of a letter: from the line after "Dear …" to the line before "Yours …", without the "Re:" heading. */
export function letterBody(letter: string): string | null {
  const lines = letter.split('\n')
  const start = lines.findIndex((l) => /^\s*Dear\b/.test(l))
  const end = lines.findIndex((l, i) => i > start && /^\s*Yours\b/.test(l))
  if (start === -1 || end === -1) return null
  return lines
    .slice(start + 1, end)
    .filter((l) => !/^\s*re\s*:/i.test(l))
    .join('\n')
    .trim()
}

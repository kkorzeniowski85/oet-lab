/** Lower-cases and strips diacritics, so "splatanie" finds "splątanie". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
}

/** Every word of the query must appear somewhere in the fields. */
export function matches(query: string, fields: (string | undefined)[]): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = fold(fields.filter(Boolean).join('\n'))
  return words.every((w) => haystack.includes(w))
}

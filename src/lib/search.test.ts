import { describe, expect, it } from 'vitest'
import { fold, matches } from './search.ts'

describe('fold', () => {
  it('removes Polish diacritics, including ł', () => {
    expect(fold('Splątanie, żółć, Łódź')).toBe('splatanie, zolc, lodz')
  })

  it('treats curly and straight apostrophes the same', () => {
    expect(fold('I’ve')).toBe(fold("I've"))
  })
})

describe('matches', () => {
  const fields = ['upon discharge', 'przy wypisie', undefined]

  it('matches English and Polish, ignoring case and diacritics', () => {
    expect(matches('Discharge', fields)).toBe(true)
    expect(matches('wypis', fields)).toBe(true)
  })

  it('requires every word of the query', () => {
    expect(matches('upon wypisie', fields)).toBe(true)
    expect(matches('upon admission', fields)).toBe(false)
  })

  it('matches everything for an empty query', () => {
    expect(matches('   ', fields)).toBe(true)
  })

  it('finds Polish words typed without Polish letters', () => {
    expect(matches('bol promieniujacy', ['radiating pain', 'ból promieniujący'])).toBe(true)
  })
})

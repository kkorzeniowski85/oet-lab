import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Voice = { lang: string; name: string }

function fakeSpeech(voices: Voice[]) {
  const spoken: { text: string; voice?: Voice; lang: string }[] = []
  const synth = {
    getVoices: () => voices,
    cancel: vi.fn(),
    speak: (u: { text: string; voice?: Voice; lang: string }) => spoken.push(u),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  class Utterance {
    text: string
    voice?: Voice
    lang = ''
    rate = 1
    constructor(text: string) {
      this.text = text
    }
  }
  vi.stubGlobal('window', { speechSynthesis: synth })
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  return { spoken, synth }
}

// The module caches the chosen voice, so each test gets a fresh copy.
const load = () => import('./speech.ts')

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe('speak', () => {
  it('prefers a British voice', async () => {
    const { spoken } = fakeSpeech([
      { lang: 'en-US', name: 'US' },
      { lang: 'en-GB', name: 'UK' },
    ])
    ;(await load()).speak('on examination')
    expect(spoken[0].voice?.name).toBe('UK')
  })

  it('falls back to any English voice', async () => {
    const { spoken } = fakeSpeech([
      { lang: 'pl-PL', name: 'PL' },
      { lang: 'en_AU', name: 'AU' },
    ])
    ;(await load()).speak('on examination')
    expect(spoken[0].voice?.name).toBe('AU')
  })

  it('stops the previous phrase before speaking', async () => {
    const { synth } = fakeSpeech([{ lang: 'en-GB', name: 'UK' }])
    ;(await load()).speak('pyrexia')
    expect(synth.cancel).toHaveBeenCalled()
  })

  it('does not read template ellipses aloud', async () => {
    const { spoken } = fakeSpeech([{ lang: 'en-GB', name: 'UK' }])
    ;(await load()).speak('I am writing to refer...')
    expect(spoken[0].text).toBe('I am writing to refer')
  })

  it('does nothing when speech is unavailable', async () => {
    vi.stubGlobal('window', {})
    expect(() => load().then((m) => m.speak('pyrexia'))).not.toThrow()
  })
})

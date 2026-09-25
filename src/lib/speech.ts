// Text-to-speech through the Web Speech API: no server and no audio files.
// Android voices are part of the system, so this works offline too.
// Everything is wrapped in try/catch: the API can exist but be broken, and a
// silent button must never break the screen.
import { useSyncExternalStore } from 'react'

const PREFERRED = 'en-GB'

function available(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// The voice list often arrives asynchronously, so keep the last good choice.
let chosen: SpeechSynthesisVoice | null = null

function englishVoice(): SpeechSynthesisVoice | null {
  if (!available()) return null
  try {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return chosen
    if (!chosen || !voices.includes(chosen)) {
      chosen =
        voices.find((v) => v.lang.replace('_', '-') === PREFERRED) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
        null
    }
    return chosen
  } catch {
    return null
  }
}

/** Drops the ellipses used in templates such as "I am writing to refer…". */
export function speakable(text: string): string {
  return text.replace(/\.\.\.|…/g, ' ').replace(/\s+/g, ' ').trim()
}

export function speak(text: string): void {
  const clean = speakable(text)
  if (!clean || !available()) return
  try {
    // A second tap repeats the phrase instead of queueing it.
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(clean)
    const voice = englishVoice()
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? PREFERRED
    // Slightly slower than default: a model to repeat, not conversational speed.
    utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  } catch {
    // No working speech engine.
  }
}

function subscribe(onChange: () => void): () => void {
  if (!available()) return () => {}
  try {
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onChange)
  } catch {
    return () => {}
  }
}

/** True once an English voice exists on this device. */
export function useEnglishVoice(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => englishVoice() !== null,
    () => false,
  )
}

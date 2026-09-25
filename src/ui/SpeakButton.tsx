import { speak, useEnglishVoice } from '../lib/speech.ts'

/** Renders nothing on devices without an English voice. */
export default function SpeakButton({ text, showLabel = true }: { text: string; showLabel?: boolean }) {
  const ready = useEnglishVoice()
  if (!ready) return null
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={`Listen: ${text}`}
      className={
        'inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-brand hover:bg-brand-soft' +
        (showLabel ? '' : ' min-w-10')
      }
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path
          d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && <span className="text-sm">Listen</span>}
    </button>
  )
}

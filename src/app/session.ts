import { useSyncExternalStore } from 'react'

// Whether a timed letter is open. The update banner stays away from a letter in progress.
let writing = false
const listeners = new Set<() => void>()

export function setWritingSession(active: boolean): void {
  writing = active
  for (const l of listeners) l()
}

export function useWritingSession(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => writing,
    () => false,
  )
}

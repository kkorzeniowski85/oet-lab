import { useEffect, useState } from 'react'

/** Asks the browser not to clear this app's data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

/** undefined while checking or when the browser cannot tell. */
export function usePersistence(): boolean | undefined {
  const [persisted, setPersisted] = useState<boolean>()
  useEffect(() => {
    let alive = true
    navigator.storage
      ?.persisted?.()
      .then((p) => {
        if (alive) setPersisted(p)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return persisted
}

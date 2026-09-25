import { SHARED_FILE_CACHE, SHARED_FILE_KEY } from './shared-file.ts'

export type ShareResult = 'shared' | 'cancelled' | 'unsupported'

/** The system share sheet (Android, Windows). Chrome refuses .json files, so share text files (D4). */
export async function shareFile(file: File, title: string): Promise<ShareResult> {
  try {
    if (!navigator.canShare?.({ files: [file] })) return 'unsupported'
    await navigator.share({ files: [file], title })
    return 'shared'
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

export async function shareText(text: string, title: string): Promise<ShareResult> {
  try {
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ text }))) return 'unsupported'
    await navigator.share({ text, title })
    return 'shared'
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

export function canShareFiles(): boolean {
  try {
    return navigator.canShare?.({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] }) ?? false
  } catch {
    return false
  }
}

/** Picks up the file the service worker kept after "Share → OET Lab". */
export async function takeSharedFile(): Promise<File | null> {
  try {
    const cache = await caches.open(SHARED_FILE_CACHE)
    const response = await cache.match(SHARED_FILE_KEY)
    if (!response) return null
    await cache.delete(SHARED_FILE_KEY)
    const name = decodeURIComponent(response.headers.get('x-file-name') ?? 'shared.txt')
    return new File([await response.blob()], name, { type: response.headers.get('content-type') ?? 'text/plain' })
  } catch {
    return null
  }
}

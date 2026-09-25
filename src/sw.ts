import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { SHARED_FILE_CACHE, SHARED_FILE_KEY } from './lib/shared-file.ts'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// The new version waits until the user taps Reload, so an open letter is never lost.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

// "Share → OET Lab" on Android posts the file here (manifest share_target). Keep it for the page, then open the import screen.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'POST' || !url.pathname.endsWith('/share-target')) return
  event.respondWith(
    (async () => {
      try {
        const file = (await event.request.formData()).get('file')
        if (file instanceof File) {
          const cache = await caches.open(SHARED_FILE_CACHE)
          await cache.put(
            SHARED_FILE_KEY,
            new Response(file, {
              headers: { 'content-type': file.type || 'text/plain', 'x-file-name': encodeURIComponent(file.name) },
            }),
          )
        }
      } catch {
        // The import screen says that no file arrived.
      }
      // 303 so that reloading the page does not post the file again.
      return Response.redirect(new URL('./#/transfer/shared', self.registration.scope).href, 303)
    })(),
  )
})

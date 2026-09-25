import { useRegisterSW } from 'virtual:pwa-register/react'
import { smallButton, textButton } from '../ui/buttons.ts'
import { useWritingSession } from './session.ts'

const HOUR = 60 * 60 * 1000

// An installed app with hash routing never navigates, so it has to ask for updates itself.
function watchForUpdates(registration: ServiceWorkerRegistration) {
  const check = () => {
    if (navigator.onLine) void registration.update()
  }
  setInterval(check, HOUR)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
}

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) watchForUpdates(registration)
    },
  })
  // A reload would interrupt a timed letter; the banner waits until the letter is closed.
  const writing = useWritingSession()

  if (!needRefresh && !offlineReady) return null
  if (needRefresh && writing) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-20 z-10 mx-auto flex max-w-md items-center gap-2 rounded-lg border border-line bg-surface p-3 text-sm shadow-lg md:bottom-6"
    >
      <span className="flex-1">{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
      {needRefresh ? (
        <>
          <button type="button" className={textButton + ' text-muted'} onClick={() => setNeedRefresh(false)}>
            Later
          </button>
          <button type="button" className={smallButton} onClick={() => void updateServiceWorker(true)}>
            Reload
          </button>
        </>
      ) : (
        <button type="button" className={textButton + ' text-brand'} onClick={() => setOfflineReady(false)}>
          OK
        </button>
      )}
    </div>
  )
}

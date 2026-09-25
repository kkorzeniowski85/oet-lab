import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { describeCounts, exportData, fileTooLarge, parseBackup, type BackupFile } from '../../data/backup.ts'
import { USER_STORES } from '../../data/db.ts'
import { totalChanges, type MergeReport, type StoreReport } from '../../data/merge.ts'
import { setSetting } from '../../data/records.ts'
import { applyImport, getSnapshot, previewImport, undoLastChange, type Snapshot } from '../../data/transfer.ts'
import { downloadText } from '../../lib/download.ts'
import { canShareFiles, shareFile, takeSharedFile } from '../../lib/share.ts'
import { primaryButton, secondaryButton, textButton } from '../../ui/buttons.ts'
import { StatusLine } from '../../ui/controls.tsx'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function datePart(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function column(report: MergeReport, field: keyof StoreReport) {
  return Object.fromEntries(USER_STORES.map((s) => [s, report[s][field]])) as Parameters<typeof describeCounts>[0]
}

function ReportLines({ report }: { report: MergeReport }) {
  const lines = [
    ['Added', column(report, 'added')],
    ['Updated', column(report, 'updated')],
    ['Deleted (removed on the other device)', column(report, 'removed')],
    ['Kept (newer here)', column(report, 'kept')],
    ['Already here', column(report, 'unchanged')],
  ] as const
  return (
    <ul className="space-y-0.5 text-sm">
      {lines
        .filter(([, counts]) => describeCounts(counts) !== 'nothing')
        .map(([label, counts]) => (
          <li key={label}>
            <span className="text-muted">{label}: </span>
            {describeCounts(counts)}
          </li>
        ))}
    </ul>
  )
}

function Send() {
  const [status, setStatus] = useState<string | null>(null)
  const shareable = canShareFiles()

  const prepare = async () => {
    const file = await exportData()
    return { file, text: JSON.stringify(file) }
  }
  const markBackedUp = (file: BackupFile) => setSetting('lastBackupAt', file.exportedAt)

  const share = async () => {
    const { file, text } = await prepare()
    const result = await shareFile(new File([text], `oet-lab-progress-${datePart()}.txt`, { type: 'text/plain' }), 'OET Lab progress')
    if (result === 'shared') {
      await markBackedUp(file)
      setStatus('Sent. Open the file in OET Lab on your other device.')
    } else if (result === 'unsupported') setStatus('Sharing is not available here. Use “Download file” instead.')
  }

  const download = async () => {
    const { file, text } = await prepare()
    downloadText(`oet-lab-progress-${datePart()}.json`, text)
    await markBackedUp(file)
    setStatus('Downloaded. Move the file to your other device, for example by email or Google Drive.')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Send your work</h2>
      <p className="text-sm text-muted">
        Makes a file with everything you have done here: notes, own phrases and cases, letters and practice results.
      </p>
      <div className="flex flex-wrap gap-2">
        {shareable && (
          <button type="button" onClick={() => void share()} className={primaryButton}>
            Share…
          </button>
        )}
        <button type="button" onClick={() => void download()} className={shareable ? secondaryButton : primaryButton}>
          Download file
        </button>
      </div>
      <StatusLine message={status} />
    </section>
  )
}

type Pending = { file: BackupFile; name: string; report: MergeReport }

function Receive({ fromShare }: { fromShare: boolean }) {
  const [, navigate] = useLocation()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [done, setDone] = useState<MergeReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const refreshSnapshot = useCallback(() => void getSnapshot().then((s) => setSnapshot(s ?? null)), [])
  useEffect(() => refreshSnapshot(), [done, refreshSnapshot])

  const open = useCallback(async (chosen: File) => {
    setDone(null)
    setError(null)
    const tooLarge = fileTooLarge(chosen)
    if (tooLarge) {
      setError(tooLarge)
      return
    }
    const parsed = parseBackup(await chosen.text())
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setPending({ file: parsed.file, name: chosen.name, report: await previewImport(parsed.file) })
  }, [])

  // A file shared to the app arrives through the service worker; a reload must not look for it again.
  useEffect(() => {
    if (!fromShare) return
    void takeSharedFile().then((f) => {
      navigate('/transfer', { replace: true })
      if (f) void open(f)
      else setError('No shared file was found. Try sharing it again, or choose it below.')
    })
  }, [fromShare, open, navigate])

  const merge = async () => {
    if (!pending) return
    try {
      setDone(await applyImport(pending.file, pending.name))
      setPending(null)
    } catch {
      setError('The file could not be merged. Nothing was changed. Free up storage on this device and try again.')
    }
  }

  const undo = async () => {
    if (!snapshot) return
    const what = snapshot.kind === 'restore' ? 'restore' : 'import'
    if (!window.confirm(`Undo the last ${what}? Everything goes back to how it was before the ${what}, including any changes made since.`))
      return
    try {
      await undoLastChange()
      setDone(null)
      setError(null)
    } catch {
      setError('Undo did not work. Nothing was changed.')
    }
    refreshSnapshot()
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Receive from another device</h2>
      <p className="text-sm text-muted">
        Choose a file sent from OET Lab. Your work here is merged with it: where both devices changed the same thing, the
        newer change wins. Nothing else is removed.
      </p>
      <button type="button" onClick={() => input.current?.click()} className={pending ? secondaryButton : primaryButton}>
        Choose a file
      </button>
      <input
        ref={input}
        type="file"
        accept=".json,.txt,application/json,text/plain"
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0]
          e.target.value = ''
          if (chosen) void open(chosen)
        }}
      />

      <StatusLine message={error} tone="error" />

      {pending && (
        <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <p className="text-sm">
            <span className="font-medium break-words">{pending.name}</span>
            {pending.file.exportedAt && <span className="text-muted"> · made {when(pending.file.exportedAt)}</span>}
          </p>
          {totalChanges(pending.report) === 0 ? (
            <p className="text-sm">Nothing new in this file — this device already has all of it.</p>
          ) : (
            <ReportLines report={pending.report} />
          )}
          <div className="flex gap-2">
            {totalChanges(pending.report) > 0 && (
              <button type="button" onClick={() => void merge()} className={primaryButton}>
                Merge
              </button>
            )}
            <button type="button" onClick={() => setPending(null)} className={textButton + ' text-muted'}>
              {totalChanges(pending.report) > 0 ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div role="status" className="space-y-1 rounded-lg border border-line bg-surface p-4">
          <p className="font-medium text-brand">Merged.</p>
          <ReportLines report={done} />
        </div>
      )}

      {snapshot && (
        <div className="space-y-2 border-t border-line pt-3 text-sm">
          <p className="text-muted">
            Last {snapshot.kind}: {when(snapshot.takenAt)} from <span className="break-words">{snapshot.source}</span>.
          </p>
          <button type="button" onClick={() => void undo()} className={secondaryButton}>
            Undo last {snapshot.kind}
          </button>
        </div>
      )}
    </section>
  )
}

export default function TransferPage({ from }: { from?: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Move your work</h1>
        <p className="mt-1 text-muted">
          Keep your phone and your computer in step by sending a file between them. Nothing goes to a server.
        </p>
      </div>
      <Send />
      <Receive fromShare={from === 'shared'} />
      <p className="text-sm text-muted">
        To replace everything instead of merging, use{' '}
        <Link href="/settings" className="underline">
          Restore from a backup
        </Link>{' '}
        in Settings.
      </p>
    </div>
  )
}

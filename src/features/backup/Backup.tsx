import { useRef, useState } from 'react'
import { Link } from 'wouter'
import { backupDue, backupFileName, exportData, liveCounts, parseBackup, restoreBackup } from '../../data/backup.ts'
import { setSetting, useRecords, useSetting } from '../../data/records.ts'
import { downloadText } from '../../lib/download.ts'

const LAST_BACKUP = 'lastBackupAt'

const longDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

async function downloadBackup(): Promise<void> {
  const file = await exportData()
  downloadText(backupFileName(), JSON.stringify(file, null, 1))
  await setSetting(LAST_BACKUP, file.exportedAt)
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function useHasData(): boolean {
  const notes = useRecords('notes')
  const phrases = useRecords('customPhrases')
  return (notes?.length ?? 0) + (phrases?.length ?? 0) > 0
}

export function BackupPanel() {
  const lastBackupAt = useSetting<string>(LAST_BACKUP)
  const notes = useRecords('notes')
  const phrases = useRecords('customPhrases')
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function restoreFrom(fileToRead: File) {
    const parsed = parseBackup(await fileToRead.text())
    if (!parsed.ok) {
      setMessage({ tone: 'error', text: parsed.error })
      return
    }
    const incoming = liveCounts(parsed.file.data)
    const from = parsed.file.exportedAt ? ` from ${longDate(parsed.file.exportedAt)}` : ''
    const confirmed = window.confirm(
      `Replace all data on this device with this backup${from}?\n\n` +
        `The backup has ${plural(incoming.notes, 'note')} and ${plural(incoming.customPhrases, 'phrase')}.\n` +
        `Your current ${plural(notes?.length ?? 0, 'note')} and ${plural(phrases?.length ?? 0, 'phrase')} will be replaced.`,
    )
    if (!confirmed) return
    await restoreBackup(parsed.file)
    setMessage({ tone: 'ok', text: 'Backup restored.' })
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Backup</h2>
      <p className="text-sm text-muted">
        A backup file holds your notes and your own phrases. Keep it somewhere safe, off this device.
      </p>
      <p className="text-sm">Last backup: {lastBackupAt ? longDate(lastBackupAt) : 'never'}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadBackup().then(() => setMessage({ tone: 'ok', text: 'Backup downloaded.' }))}
          className="rounded-md bg-brand px-4 py-2 font-medium text-on-brand"
        >
          Download backup
        </button>
        <button type="button" onClick={() => input.current?.click()} className="rounded-md border border-line px-4 py-2">
          Restore from a backup…
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0]
            e.target.value = ''
            if (chosen) void restoreFrom(chosen)
          }}
        />
      </div>
      {message && (
        <p role="status" className={'text-sm ' + (message.tone === 'error' ? 'text-red-700 dark:text-red-400' : 'text-brand')}>
          {message.text}
        </p>
      )}
    </section>
  )
}

export function BackupReminder() {
  const lastBackupAt = useSetting<string>(LAST_BACKUP)
  const hasData = useHasData()
  const due = backupDue(lastBackupAt, hasData)
  if (!due) return null
  return (
    <div role="note" className="rounded-lg border border-line bg-surface p-4 text-sm">
      <p>
        Your notes and phrases live only in this browser.{' '}
        {due.days === null ? 'You have not made a backup yet.' : `Your last backup was ${due.days} days ago.`}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void downloadBackup()} className="rounded-md bg-brand px-3 py-1.5 font-medium text-on-brand">
          Download a backup
        </button>
        <Link href="/settings" className="text-muted underline">
          Backup settings
        </Link>
      </div>
    </div>
  )
}

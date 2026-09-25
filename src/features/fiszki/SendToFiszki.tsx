import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { CONTENT } from '../../content/index.ts'
import type { FiszkiExportRecord } from '../../data/db.ts'
import { saveRecord, useRecords } from '../../data/records.ts'
import { downloadText } from '../../lib/download.ts'
import { shareText } from '../../lib/share.ts'
import { primaryButton, secondaryButton, textButton } from '../../ui/buttons.ts'
import { StatusLine } from '../../ui/controls.tsx'
import { FISZKI_URL, SHARE_LIMIT, fiszkiFile, fromOwnPhrase, fromPhrase, useFiszkiBasket, type FiszkiNote } from './fiszki.ts'

const VIA: Record<FiszkiExportRecord['via'], string> = { share: 'shared', download: 'file', copy: 'copied' }
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function SendToFiszki() {
  const basket = useFiszkiBasket()
  const own = useRecords('customPhrases')
  const exports = useRecords('fiszkiExports')
  const [status, setStatus] = useState<string | null>(null)

  const items = basket.ids
    .map((id): { id: string; en: string; pl: string; note: FiszkiNote } | null => {
      const built = CONTENT.phrases.find((p) => p.id === id)
      if (built) return { id, en: built.en, pl: built.pl, note: fromPhrase(built) }
      const mine = own?.find((r) => r.id === id)
      return mine ? { id, en: mine.en, pl: mine.pl, note: fromOwnPhrase(mine) } : null
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)

  // A phrase deleted after it was picked would otherwise sit in the list forever.
  const { prune } = basket
  const missing = own !== undefined && items.length < basket.ids.length
  const keep = items.map((i) => i.id).join(',')
  useEffect(() => {
    if (missing) prune(keep.split(',').filter(Boolean))
  }, [missing, keep, prune])

  const text = JSON.stringify(fiszkiFile(items.map((i) => i.note)), null, 1)

  const sent = async (via: FiszkiExportRecord['via'], message: string) => {
    await saveRecord('fiszkiExports', { itemIds: items.map((i) => i.id), via })
    basket.clear()
    setStatus(message)
  }

  const share = async () => {
    const result = await shareText(text, 'OET Lab phrases')
    if (result === 'shared') await sent('share', 'Sent. Fiszki opens its import screen with these phrases.')
    else if (result === 'unsupported') setStatus('Sharing is not available here. Use “Download file” or “Copy” instead.')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      await sent('copy', 'Copied. In Fiszki, open Import and paste.')
    } catch {
      setStatus('Copying is blocked here. Use “Download file” instead.')
    }
  }

  const clear = () => {
    if (window.confirm(`Clear the list of ${items.length} ${items.length === 1 ? 'phrase' : 'phrases'}?`)) basket.clear()
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Fiszki is your flashcard app with spaced repetition. In any phrase bank, open a phrase and tap “Add to Fiszki list”;
        then send the list from here.{' '}
        <a href={FISZKI_URL} target="_blank" rel="noopener noreferrer" className="text-brand underline">
          Open Fiszki<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>

      <StatusLine message={status} />

      {items.length === 0 ? (
        <p className="text-muted">
          Your Fiszki list is empty.{' '}
          <Link href="/writing/material" className="text-brand underline">
            Browse the Writing phrases
          </Link>
          .
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Your Fiszki list ({items.length} {items.length === 1 ? 'phrase' : 'phrases'})
          </h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-1 text-sm">
                <span className="flex-1 py-1">
                  <span className="font-medium">{i.en}</span>
                  <span lang="pl" className="block text-muted">
                    {i.pl}
                  </span>
                </span>
                <button type="button" onClick={() => basket.toggle(i.id)} className={textButton + ' -mr-2 text-muted'}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void share()} disabled={items.length > SHARE_LIMIT} className={primaryButton}>
              Share to Fiszki
            </button>
            <button
              type="button"
              onClick={() => {
                downloadText(`fiszki-oet-lab-${new Date().toISOString().slice(0, 10)}.json`, text)
                void sent('download', 'Downloaded. In Fiszki, open Import and choose the file.')
              }}
              className={secondaryButton}
            >
              Download file
            </button>
            <button type="button" onClick={() => void copy()} className={secondaryButton}>
              Copy
            </button>
            <button type="button" onClick={clear} className={textButton + ' text-muted'}>
              Clear list
            </button>
          </div>
          <p className="text-xs text-muted">
            On the phone, choose Fiszki in the share menu.
            {items.length > SHARE_LIMIT && ` For more than ${SHARE_LIMIT} phrases, use Download file.`} Phrases Fiszki
            already has are recognised, not duplicated.
          </p>
        </section>
      )}

      {exports && exports.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Sent before</h2>
          <ul className="space-y-1 text-sm text-muted">
            {exports.map((e) => (
              <li key={e.id}>
                {when(e.createdAt)} · {e.itemIds.length} {e.itemIds.length === 1 ? 'phrase' : 'phrases'} · {VIA[e.via]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

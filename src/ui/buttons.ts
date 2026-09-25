// Shared control styles. Every button is at least 44 px tall, so it is easy to hit with a thumb.
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 font-medium text-on-brand disabled:opacity-40'
export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-field bg-surface px-4 disabled:opacity-40'
/** Compact primary for list rows and toolbars. */
export const smallButton =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-on-brand disabled:opacity-40'
/** Looks like a link, hits like a button. Add a colour class (text-brand / text-muted). */
export const textButton = 'inline-flex min-h-11 items-center rounded-md px-2 text-sm'
/** Selected/unselected pill in a group of choices; add the state classes. */
export const chip = 'inline-flex min-h-10 items-center rounded-md px-3 text-sm disabled:opacity-40'
export const chipOn = 'bg-ink text-canvas'
export const chipOff = 'bg-surface text-muted'
export const field = 'w-full rounded-md border border-field bg-surface px-3 py-2 outline-none focus:border-brand'

import { type ReactNode, useEffect, useState } from 'react'

export function Alert({
  tone,
  children,
  dismissible = true,
  onClose,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
  dismissible?: boolean
  onClose?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [children, tone])

  if (dismissed) {
    return null
  }

  const className =
    tone === 'error'
      ? 'whitespace-pre-line rounded-md bg-rose-50 p-3 text-sm text-rose-700'
      : tone === 'success'
        ? 'whitespace-pre-line rounded-md bg-emerald-50 p-3 text-sm text-emerald-700'
        : 'whitespace-pre-line rounded-md bg-sky-50 p-3 text-sm text-sky-700'

  const handleClose = () => {
    if (onClose) {
      onClose()
      return
    }

    setDismissed(true)
  }

  return (
    <div className={`${className} flex items-start justify-between gap-3`}>
      <p className="min-w-0 flex-1">{children}</p>
      {dismissible && (
        <button
          type="button"
          aria-label="Закрыть уведомление"
          className="shrink-0 rounded-sm px-1 text-base leading-none opacity-70 transition hover:opacity-100"
          onClick={handleClose}
        >
          ×
        </button>
      )}
    </div>
  )
}

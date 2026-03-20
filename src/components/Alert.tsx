import { type ReactNode } from 'react'

export function Alert({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const className =
    tone === 'error'
      ? 'whitespace-pre-line rounded-md bg-rose-50 p-3 text-sm text-rose-700'
      : tone === 'success'
        ? 'whitespace-pre-line rounded-md bg-emerald-50 p-3 text-sm text-emerald-700'
        : 'whitespace-pre-line rounded-md bg-sky-50 p-3 text-sm text-sky-700'

  return <p className={className}>{children}</p>
}

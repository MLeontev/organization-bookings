export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition'
          : 'rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800'
      }
    >
      {children}
    </button>
  )
}

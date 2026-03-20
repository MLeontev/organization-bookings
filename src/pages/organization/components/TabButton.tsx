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
          ? 'rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white'
          : 'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700'
      }
    >
      {children}
    </button>
  )
}

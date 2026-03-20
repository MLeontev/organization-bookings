import { type AccessResponse } from '../../../api/orgMembershipApi'
import { formatMembershipStatus } from '../../../utils/statuses'

export function OverviewTab({ access }: { access: AccessResponse | null }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Мой доступ</h3>
      <p className="mt-2 text-sm text-slate-600">Статус членства: {formatMembershipStatus(access?.membershipStatus)}</p>
      <p className="mt-1 text-sm text-slate-700">Роли: {access?.roles.join(', ') || 'Нет'}</p>
      <p className="mt-1 text-sm text-slate-700">Права: {access?.permissions.join(', ') || 'Нет'}</p>
    </section>
  )
}

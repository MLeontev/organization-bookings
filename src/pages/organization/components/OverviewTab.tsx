import { type AccessResponse, type OrganizationRolesResponse } from '../../../api/orgMembershipApi'
import { formatMembershipStatus } from '../../../utils/statuses'
import { formatRoleLabel } from '../../../utils/roles'

export function OverviewTab({
  access,
  organizationRoles,
}: {
  access: AccessResponse | null
  organizationRoles: OrganizationRolesResponse['roles']
}) {
  const accessRoles = access?.roles ?? []

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Мой доступ</h3>
      <p className="text-sm text-slate-600">Статус членства: {formatMembershipStatus(access?.membershipStatus)}</p>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">Роли</p>
        <div className="flex flex-wrap gap-2">
          {accessRoles.length === 0 && <span className="text-sm text-slate-500">Нет</span>}
          {accessRoles.map((roleCode) => (
            <span key={roleCode} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {formatRoleLabel(roleCode, organizationRoles)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

import {
  type OrganizationMember,
  type OrganizationMembersResponse,
  type OrganizationRolesResponse,
} from '../../../api/orgMembershipApi'
import { Can } from '../../../rbac/Can'
import { Alert } from '../../../components/Alert'
import { formatMembershipStatus } from '../../../utils/statuses'

export function MembersTab({
  membersStatus,
  onMembersStatusChange,
  members,
  selectedMemberId,
  myIdentityId,
  accessPermissions,
  memberDetails,
  memberDetailsLoading,
  roles,
  assignRoleCodes,
  revokeRoleCode,
  memberDepartment,
  memberTitle,
  busy,
  onToggleSelectMember,
  onToggleAssignRole,
  onAssignRoles,
  onRevokeRoleCodeChange,
  onRevokeRole,
  onMemberDepartmentChange,
  onMemberTitleChange,
  onSaveProfile,
  onDeactivate,
  onActivate,
  onRemove,
}: {
  membersStatus: string
  onMembersStatusChange: (value: string) => void
  members: OrganizationMembersResponse['members']
  selectedMemberId: string
  myIdentityId: string
  accessPermissions: string[]
  memberDetails: OrganizationMember | null
  memberDetailsLoading: boolean
  roles: OrganizationRolesResponse['roles']
  assignRoleCodes: string[]
  revokeRoleCode: string
  memberDepartment: string
  memberTitle: string
  busy: boolean
  onToggleSelectMember: (membershipId: string) => void
  onToggleAssignRole: (roleCode: string) => void
  onAssignRoles: (membershipId: string) => void
  onRevokeRoleCodeChange: (roleCode: string) => void
  onRevokeRole: (membershipId: string) => void
  onMemberDepartmentChange: (value: string) => void
  onMemberTitleChange: (value: string) => void
  onSaveProfile: (membershipId: string) => void
  onDeactivate: (membershipId: string) => void
  onActivate: (membershipId: string) => void
  onRemove: (membershipId: string) => void
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Участники</h3>
        <select
          value={membersStatus}
          onChange={(event) => onMembersStatusChange(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Active">Активные</option>
          <option value="Deactivated">Деактивированные</option>
          <option value="Removed">Удалённые</option>
        </select>
      </div>

      <Can permission="MEMBERS_LIST" fallback={<Alert tone="info">Нет доступа к списку участников</Alert>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">ФИО</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">Роли</th>
                <th className="py-2">Подробнее</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelected = member.membershipId === selectedMemberId
                const isSelfMember = member.identityId === myIdentityId

                return [
                  <tr key={member.membershipId} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-4">{member.firstName} {member.lastName}</td>
                    <td className="py-2 pr-4">{member.email}</td>
                    <td className="py-2 pr-4">{formatMembershipStatus(member.status)}</td>
                    <td className="py-2 pr-4 text-xs text-slate-600">{member.roles.join(', ') || 'Нет'}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        className={
                          isSelected
                            ? 'rounded-md bg-sky-600 px-3 py-1 text-xs text-white'
                            : 'rounded-md border border-slate-300 px-3 py-1 text-xs'
                        }
                        onClick={() => onToggleSelectMember(member.membershipId)}
                      >
                        Подробнее
                      </button>
                    </td>
                  </tr>,
                  isSelected ? (
                    <tr key={`${member.membershipId}-details`} className="border-b border-slate-100">
                      <td colSpan={5} className="py-3">
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                          {accessPermissions.includes('MEMBERS_READ') && memberDetailsLoading && (
                            <p className="text-sm text-slate-500">Загружаем карточку участника</p>
                          )}

                          {accessPermissions.includes('MEMBERS_READ') && memberDetails && (
                            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                              <p className="mb-1 font-medium text-slate-800">Подробные данные участника</p>
                              <p>Отдел: {memberDetails.department || 'Не указан'}</p>
                              <p>Должность: {memberDetails.title || 'Не указана'}</p>
                              <p>Дата вступления: {memberDetails.joinedAt ? new Date(memberDetails.joinedAt).toLocaleString() : '—'}</p>
                            </div>
                          )}

                          <Can permission="ROLES_ASSIGN">
                            <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                              <p className="text-sm font-medium text-slate-800">Назначить роли</p>
                              <div className="grid gap-2 md:grid-cols-2">
                                {roles.map((role) => (
                                  <label key={role.roleId} className="flex items-start gap-2 rounded-md border border-slate-200 p-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={assignRoleCodes.includes(role.roleCode)}
                                      onChange={() => onToggleAssignRole(role.roleCode)}
                                    />
                                    <span>
                                      <span className="block font-medium text-slate-800">{role.name}</span>
                                      <span className="block text-xs text-slate-500">{role.roleCode}</span>
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <button
                                type="button"
                                disabled={busy || assignRoleCodes.length === 0}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                                onClick={() => onAssignRoles(member.membershipId)}
                              >
                                Назначить роли
                              </button>
                            </div>
                          </Can>

                          <Can permission="ROLES_REVOKE">
                            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                              <select
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={revokeRoleCode}
                                onChange={(e) => onRevokeRoleCodeChange(e.target.value)}
                              >
                                <option value="">Выберите роль для снятия</option>
                                {member.roles.map((roleCode) => (
                                  <option key={roleCode} value={roleCode}>
                                    {roleCode}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={busy || !revokeRoleCode.trim()}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                                onClick={() => onRevokeRole(member.membershipId)}
                              >
                                Снять роль
                              </button>
                            </div>
                          </Can>

                          <Can permission="MEMBERS_UPDATE">
                            <div className="grid gap-2 md:grid-cols-3">
                              <input
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Отдел"
                                value={memberDepartment}
                                onChange={(e) => onMemberDepartmentChange(e.target.value)}
                              />
                              <input
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Должность"
                                value={memberTitle}
                                onChange={(e) => onMemberTitleChange(e.target.value)}
                              />
                              <button
                                type="button"
                                disabled={busy}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                                onClick={() => onSaveProfile(member.membershipId)}
                              >
                                Сохранить профиль
                              </button>
                            </div>
                          </Can>

                          {!isSelfMember && (
                            <div className="flex flex-wrap gap-2">
                              <Can permission="MEMBERS_DEACTIVATE">
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700"
                                  onClick={() => onDeactivate(member.membershipId)}
                                >
                                  Деактивировать
                                </button>
                              </Can>

                              <Can permission="MEMBERS_DEACTIVATE">
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                                  onClick={() => onActivate(member.membershipId)}
                                >
                                  Активировать
                                </button>
                              </Can>

                              <Can permission="MEMBERS_REMOVE">
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                                  onClick={() => onRemove(member.membershipId)}
                                >
                                  Удалить из организации
                                </button>
                              </Can>
                            </div>
                          )}

                          {isSelfMember && (
                            <Alert tone="info">
                              Для вашего аккаунта скрыты действия активации, деактивации и удаления
                            </Alert>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ]
              })}
            </tbody>
          </table>
        </div>
      </Can>
    </section>
  )
}

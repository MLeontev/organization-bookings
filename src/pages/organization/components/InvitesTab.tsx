import {
  type OrganizationInvitationsResponse,
  type OrganizationRolesResponse,
} from '../../../api/orgMembershipApi'
import { Can } from '../../../rbac/Can'
import { Alert } from '../../../components/Alert'
import { formatInvitationStatus } from '../../../utils/statuses'
import { formatRoleLabel } from '../../../utils/roles'

export function InvitesTab({
  invitesStatus,
  onInvitesStatusChange,
  showInviteCreateForm,
  onToggleInviteCreateForm,
  roles,
  inviteRoleCodes,
  onToggleInviteRole,
  inviteExpiresAt,
  onInviteExpiresAtChange,
  busy,
  loading,
  onCreateInvitation,
  createdInviteLink,
  onCopyInviteLink,
  invitations,
  onRevokeInvitation,
}: {
  invitesStatus: string
  onInvitesStatusChange: (value: string) => void
  showInviteCreateForm: boolean
  onToggleInviteCreateForm: () => void
  roles: OrganizationRolesResponse['roles']
  inviteRoleCodes: string[]
  onToggleInviteRole: (roleCode: string) => void
  inviteExpiresAt: string
  onInviteExpiresAtChange: (value: string) => void
  busy: boolean
  loading: boolean
  onCreateInvitation: () => void
  createdInviteLink: string
  onCopyInviteLink: () => void
  invitations: OrganizationInvitationsResponse['invitations']
  onRevokeInvitation: (invitationId: string) => void
}) {
  const inviteStatusOptions: Array<{ value: string; label: string }> = [
    { value: 'Pending', label: 'Ожидают' },
    { value: 'Accepted', label: 'Приняты' },
    { value: 'Revoked', label: 'Отозваны' },
    { value: 'Expired', label: 'Истекли' },
  ]
  const toRoleLabel = (roleCode: string) => formatRoleLabel(roleCode, roles)

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Приглашения</h3>
        <div className="flex flex-wrap gap-2">
          {inviteStatusOptions.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => onInvitesStatusChange(status.value)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                invitesStatus === status.value
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <Can permission="MEMBERS_INVITE_CREATE">
        <div className="space-y-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={onToggleInviteCreateForm}
          >
            {showInviteCreateForm ? 'Скрыть форму' : 'Создать приглашение'}
          </button>

          {showInviteCreateForm && (
            <div className="space-y-3">
              <div className="space-y-2 rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">Роли для приглашения</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {roles.map((role) => (
                    <label key={role.roleId} className="flex items-start gap-2 rounded-md border border-slate-200 p-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={inviteRoleCodes.includes(role.roleCode)}
                        onChange={() => onToggleInviteRole(role.roleCode)}
                      />
                      <span>
                        <span className="block font-medium text-slate-800">{role.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  type="datetime-local"
                  value={inviteExpiresAt}
                  onChange={(e) => onInviteExpiresAtChange(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || inviteRoleCodes.length === 0}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onCreateInvitation}
                >
                  Отправить приглашение
                </button>
              </div>
            </div>
          )}
        </div>
      </Can>

      {createdInviteLink && (
        <div className="space-y-2 rounded-md bg-sky-50 p-3 text-sm text-slate-700">
          <p className="font-medium">Ссылка приглашения:</p>
          <p className="break-all">{createdInviteLink}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={onCopyInviteLink}
            >
              Скопировать ссылку
            </button>
            <a
              href={createdInviteLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Открыть страницу
            </a>
          </div>
        </div>
      )}

      <Can permission="MEMBERS_INVITE_LIST" fallback={<Alert tone="info">Нет доступа к приглашениям</Alert>}>
        {loading && <p className="text-sm text-slate-500">Загружаем приглашения...</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">Срок действия</th>
                <th className="py-2 pr-4">Роли</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => {
                const canRevoke = invitation.status === 'Pending'

                return (
                  <tr key={invitation.invitationId} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-4">{formatInvitationStatus(invitation.status)}</td>
                    <td className="py-2 pr-4">{new Date(invitation.expiresAt).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-xs text-slate-600">
                      {invitation.roleCodes.length > 0 ? invitation.roleCodes.map(toRoleLabel).join(', ') : 'Нет'}
                    </td>
                    <td className="py-2">
                      {canRevoke && (
                        <Can permission="MEMBERS_INVITE_REVOKE">
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded-md border border-rose-300 px-3 py-1 text-xs text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => onRevokeInvitation(invitation.invitationId)}
                          >
                            Отозвать
                          </button>
                        </Can>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Can>
    </section>
  )
}

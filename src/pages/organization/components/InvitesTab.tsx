import {
  type OrganizationInvitationsResponse,
  type OrganizationRolesResponse,
} from '../../../api/orgMembershipApi'
import { Can } from '../../../rbac/Can'
import { Alert } from '../../../components/Alert'
import { formatInvitationStatus } from '../../../utils/statuses'

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
  onCreateInvitation: () => void
  createdInviteLink: string
  onCopyInviteLink: () => void
  invitations: OrganizationInvitationsResponse['invitations']
  onRevokeInvitation: (invitationId: string) => void
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Приглашения</h3>
        <select
          value={invitesStatus}
          onChange={(event) => onInvitesStatusChange(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Pending">Ожидают</option>
          <option value="Accepted">Приняты</option>
          <option value="Revoked">Отозваны</option>
          <option value="Expired">Истекли</option>
        </select>
      </div>

      <Can permission="MEMBERS_INVITE_CREATE">
        <div className="space-y-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
            onClick={onToggleInviteCreateForm}
          >
            {showInviteCreateForm ? 'Скрыть форму приглашения' : 'Создать приглашение'}
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
                        <span className="block text-xs text-slate-500">{role.roleCode}</span>
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
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
            <button type="button" className="rounded-md border border-slate-300 px-3 py-1 text-sm" onClick={onCopyInviteLink}>
              Скопировать ссылку
            </button>
            <a href={createdInviteLink} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-3 py-1 text-sm">
              Открыть страницу
            </a>
          </div>
        </div>
      )}

      <Can permission="MEMBERS_INVITE_LIST" fallback={<Alert tone="info">Нет доступа к приглашениям</Alert>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">Срок действия</th>
                <th className="py-2 pr-4">Роли</th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.invitationId} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-4">{formatInvitationStatus(invitation.status)}</td>
                  <td className="py-2 pr-4">{new Date(invitation.expiresAt).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-xs text-slate-600">{invitation.roleCodes.join(', ') || 'Нет'}</td>
                  <td className="py-2">
                    <Can permission="MEMBERS_INVITE_REVOKE">
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md border border-rose-300 px-3 py-1 text-xs text-rose-700"
                        onClick={() => onRevokeInvitation(invitation.invitationId)}
                      >
                        Отозвать
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Can>
    </section>
  )
}

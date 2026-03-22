import { type PermissionsCatalogResponse, type OrganizationRolesResponse } from '../../../api/orgMembershipApi'
import { Can } from '../../../rbac/Can'
import { Alert } from '../../../components/Alert'
import { type RoleFormErrors } from '../types'

type OrganizationRole = OrganizationRolesResponse['roles'][number]

export function RolesTab({
  busy,
  permissions,
  showRoleForm,
  onToggleRoleForm,
  roleIdForEdit,
  roleCode,
  roleName,
  roleDescription,
  rolePriority,
  roleFormErrors,
  rolePermissionCodes,
  permissionCatalog,
  roles,
  onRoleCodeChange,
  onRoleNameChange,
  onRoleDescriptionChange,
  onRolePriorityChange,
  onClearRoleError,
  onToggleRolePermission,
  onSubmitRole,
  onResetRoleForm,
  onStartEditRole,
  onDeleteRole,
}: {
  busy: boolean
  permissions: string[]
  showRoleForm: boolean
  onToggleRoleForm: () => void
  roleIdForEdit: string
  roleCode: string
  roleName: string
  roleDescription: string
  rolePriority: string
  roleFormErrors: RoleFormErrors
  rolePermissionCodes: string[]
  permissionCatalog: PermissionsCatalogResponse['permissions']
  roles: OrganizationRolesResponse['roles']
  onRoleCodeChange: (value: string) => void
  onRoleNameChange: (value: string) => void
  onRoleDescriptionChange: (value: string) => void
  onRolePriorityChange: (value: string) => void
  onClearRoleError: (field: keyof RoleFormErrors) => void
  onToggleRolePermission: (code: string) => void
  onSubmitRole: () => void
  onResetRoleForm: () => void
  onStartEditRole: (role: OrganizationRole) => void
  onDeleteRole: (roleId: string) => void
}) {
  const canCreateRole = permissions.includes('ROLES_CREATE')
  const canUpdateRole = permissions.includes('ROLES_UPDATE')
  const canDeleteRole = permissions.includes('ROLES_DELETE')

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Роли</h3>

      <Can anyOf={['ROLES_CREATE', 'ROLES_UPDATE']}>
        <div className="space-y-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={onToggleRoleForm}
          >
            {showRoleForm ? 'Скрыть форму' : 'Создать роль'}
          </button>

          {showRoleForm && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="grid gap-2 md:grid-cols-5">
                <input
                  className={`rounded-md border px-3 py-2 text-sm ${roleFormErrors.code ? 'border-rose-400' : 'border-slate-300'}`}
                  placeholder="Код"
                  value={roleCode}
                  onChange={(e) => {
                    onRoleCodeChange(e.target.value)
                    onClearRoleError('code')
                  }}
                />
                <input
                  className={`rounded-md border px-3 py-2 text-sm ${roleFormErrors.name ? 'border-rose-400' : 'border-slate-300'}`}
                  placeholder="Название"
                  value={roleName}
                  onChange={(e) => {
                    onRoleNameChange(e.target.value)
                    onClearRoleError('name')
                  }}
                />
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Описание"
                  value={roleDescription}
                  onChange={(e) => onRoleDescriptionChange(e.target.value)}
                />
                <input
                  className={`rounded-md border px-3 py-2 text-sm ${roleFormErrors.priority ? 'border-rose-400' : 'border-slate-300'}`}
                  placeholder="Приоритет"
                  type="number"
                  value={rolePriority}
                  onChange={(e) => {
                    onRolePriorityChange(e.target.value)
                    onClearRoleError('priority')
                  }}
                  disabled={!!roleIdForEdit}
                />
                <button
                  type="button"
                  disabled={busy || (!roleIdForEdit && !canCreateRole) || (!!roleIdForEdit && !canUpdateRole)}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onSubmitRole}
                >
                  {roleIdForEdit ? 'Сохранить' : 'Создать'}
                </button>
              </div>

              {(roleFormErrors.code || roleFormErrors.name || roleFormErrors.priority || roleFormErrors.permissions) && (
                <Alert tone="error">
                  {[
                    roleFormErrors.code,
                    roleFormErrors.name,
                    roleFormErrors.priority,
                    roleFormErrors.permissions,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </Alert>
              )}

              <div className={`space-y-2 rounded-md border p-3 ${roleFormErrors.permissions ? 'border-rose-400' : 'border-slate-200'}`}>
                <p className="text-sm font-medium text-slate-800">Права роли</p>
                {permissionCatalog.length === 0 && (
                  <p className="text-sm text-slate-500">Каталог прав недоступен</p>
                )}
                {permissionCatalog.length > 0 && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {permissionCatalog.map((permission) => (
                      <label key={permission.code} className="flex items-start gap-2 rounded-md border border-slate-200 p-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={rolePermissionCodes.includes(permission.code)}
                          onChange={() => {
                            onToggleRolePermission(permission.code)
                            onClearRoleError('permissions')
                          }}
                        />
                        <span>
                          <span className="block font-medium text-slate-800">{permission.name}</span>
                          <span className="block text-xs text-slate-500">{permission.code}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {roleIdForEdit && (
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
                  onClick={onResetRoleForm}
                >
                  Отменить редактирование
                </button>
              )}
            </div>
          )}
        </div>
      </Can>

      <Can permission="ROLES_LIST" fallback={<Alert tone="info">Нет доступа к ролям</Alert>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Название</th>
                <th className="py-2 pr-4">Код</th>
                <th className="py-2 pr-4">Тип</th>
                <th className="py-2 pr-4">Приоритет</th>
                <th className="py-2 pr-4">Права</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.roleId} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-4">{role.name}</td>
                  <td className="py-2 pr-4 font-mono">{role.roleCode}</td>
                  <td className="py-2 pr-4">{role.isSystem ? 'Системная' : 'Кастомная'}</td>
                  <td className="py-2 pr-4">{role.priority}</td>
                  <td className="py-2 pr-4 text-xs text-slate-600">{role.permissionCodes.join(', ')}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {!role.isSystem && canUpdateRole && (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => onStartEditRole(role)}
                        >
                          Редактировать
                        </button>
                      )}
                      {!role.isSystem && canDeleteRole && (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => onDeleteRole(role.roleId)}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
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

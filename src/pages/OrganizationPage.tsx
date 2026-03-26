import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import {
  type AccessResponse,
  type OrganizationInvitationsResponse,
  type OrganizationMember,
  type OrganizationMembersResponse,
  type OrganizationRolesResponse,
  type PermissionsCatalogResponse,
  activateMember,
  assignMemberRoles,
  createCustomRole,
  createInvitation,
  deactivateMember,
  deleteCustomRole,
  getMyAccess,
  getMyProfile,
  getOrganizationInvitations,
  getOrganizationMemberById,
  getOrganizationMembers,
  getOrganizationRoles,
  getPermissionsCatalog,
  removeMember,
  revokeInvitation,
  revokeMemberRole,
  updateCustomRole,
  updateMember,
} from '../api/orgMembershipApi'
import { BookingPoliciesTab } from './organization/components/BookingPoiliciesTab'
import { RbacProvider } from '../rbac/RbacContext'
import { InvitesTab } from './organization/components/InvitesTab'
import { MembersTab } from './organization/components/MembersTab'
import { OverviewTab } from './organization/components/OverviewTab'
import { ResourcesTab } from './organization/components/ResourcesTab'
import { RolesTab } from './organization/components/RolesTab'
import { TabButton } from './organization/components/TabButton'
import { type RoleFormErrors } from './organization/types'

type TabKey = 'overview' | 'resources' | 'roles' | 'members' | 'invites' | 'booking-rules'

type OrganizationRole = OrganizationRolesResponse['roles'][number]

function toLocalInputDate(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  const hours = `${value.getHours()}`.padStart(2, '0')
  const minutes = `${value.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function OrganizationPage() {
  const { organizationId = '' } = useParams()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [membersStatus, setMembersStatus] = useState('Active')
  const [invitesStatus, setInvitesStatus] = useState('Pending')

  const [access, setAccess] = useState<AccessResponse | null>(null)
  const [myIdentityId, setMyIdentityId] = useState('')
  const [members, setMembers] = useState<OrganizationMembersResponse['members']>([])
  const [roles, setRoles] = useState<OrganizationRolesResponse['roles']>([])
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionsCatalogResponse['permissions']>([])
  const [invitations, setInvitations] = useState<OrganizationInvitationsResponse['invitations']>([])

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const selectedMember = useMemo(
    () => members.find((member) => member.membershipId === selectedMemberId) ?? null,
    [members, selectedMemberId],
  )

  const [memberDetails, setMemberDetails] = useState<OrganizationMember | null>(null)
  const [memberDetailsLoading, setMemberDetailsLoading] = useState(false)

  const [roleIdForEdit, setRoleIdForEdit] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [rolePriority, setRolePriority] = useState('500')
  const [rolePermissionCodes, setRolePermissionCodes] = useState<string[]>(['MEMBERS_LIST', 'MEMBERS_READ'])
  const [roleFormErrors, setRoleFormErrors] = useState<RoleFormErrors>({})
  const [showRoleForm, setShowRoleForm] = useState(false)

  const [assignRoleCodes, setAssignRoleCodes] = useState<string[]>([])
  const [revokeRoleCode, setRevokeRoleCode] = useState('')
  const [memberDepartment, setMemberDepartment] = useState('')
  const [memberTitle, setMemberTitle] = useState('')

  const [inviteRoleCodes, setInviteRoleCodes] = useState<string[]>(['EMPLOYEE'])
  const [inviteExpiresAt, setInviteExpiresAt] = useState(
    toLocalInputDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)),
  )
  const [createdInviteLink, setCreatedInviteLink] = useState('')
  const [showInviteCreateForm, setShowInviteCreateForm] = useState(false)

  const permissions = useMemo(() => access?.permissions ?? [], [access?.permissions])

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const loadMembers = async (permissionSet = permissions) => {
    if (!organizationId) {
      return
    }

    if (!permissionSet.includes('MEMBERS_LIST')) {
      setMembers([])
      setSelectedMemberId('')
      setMemberDetails(null)
      return
    }

    setMembersLoading(true)
    try {
      const result = await getOrganizationMembers(organizationId, membersStatus)
      setMembers(result.members)

      if (result.members.length === 0 || !result.members.some((member) => member.membershipId === selectedMemberId)) {
        setSelectedMemberId('')
        setMemberDetails(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить список участников')
    } finally {
      setMembersLoading(false)
    }
  }

  const loadInvites = async (permissionSet = permissions) => {
    if (!organizationId) {
      return
    }

    if (!permissionSet.includes('MEMBERS_INVITE_LIST')) {
      setInvitations([])
      return
    }

    setInvitesLoading(true)
    try {
      const result = await getOrganizationInvitations(organizationId, invitesStatus)
      setInvitations(result.invitations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить приглашения')
    } finally {
      setInvitesLoading(false)
    }
  }

  const loadData = async (preserveUi = false) => {
    if (!organizationId) {
      return null
    }

    if (!preserveUi) {
      setLoading(true)
      setError('')
    }

    try {
      const [accessData, myProfile] = await Promise.all([
        getMyAccess(organizationId),
        getMyProfile(),
      ])

      setAccess(accessData)
      setMyIdentityId(myProfile.identityId)

      const canListRoles = accessData.permissions.includes('ROLES_LIST')
      const canManageResources =
        accessData.permissions.includes('RESOURCES_CREATE') ||
        accessData.permissions.includes('RESOURCES_UPDATE') ||
        accessData.permissions.includes('RESOURCES_RULES_MANAGE')
      const canLoadRoles = canListRoles || canManageResources

      const [rolesResult, permissionCatalogResult] = await Promise.allSettled([
        canLoadRoles ? getOrganizationRoles(organizationId, true) : Promise.resolve(null),
        canListRoles ? getPermissionsCatalog(organizationId) : Promise.resolve(null),
      ])

      setRoles(rolesResult.status === 'fulfilled' && rolesResult.value ? rolesResult.value.roles : [])
      setPermissionCatalog(
        permissionCatalogResult.status === 'fulfilled' && permissionCatalogResult.value
          ? permissionCatalogResult.value.permissions
          : [],
      )

      const errors: string[] = []
      if (rolesResult.status === 'rejected' && rolesResult.reason instanceof Error) {
        errors.push(`Роли: ${rolesResult.reason.message}`)
      }
      if (permissionCatalogResult.status === 'rejected' && permissionCatalogResult.reason instanceof Error) {
        errors.push(`Права: ${permissionCatalogResult.reason.message}`)
      }

      if (errors.length > 0) {
        setError(errors.join('\n'))
      }

      return accessData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные организации')
      return null
    } finally {
      if (!preserveUi) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  useEffect(() => {
    void loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, membersStatus, permissions])

  useEffect(() => {
    void loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, invitesStatus, permissions])

  useEffect(() => {
    if (!selectedMember) {
      return
    }

    setMemberDepartment(selectedMember.department ?? '')
    setMemberTitle(selectedMember.title ?? '')
    setRevokeRoleCode(selectedMember.roles[0] ?? '')
    setAssignRoleCodes([])
  }, [selectedMember])

  useEffect(() => {
    if (!selectedMember || !organizationId || !permissions.includes('MEMBERS_READ')) {
      setMemberDetails(null)
      return
    }

    let cancelled = false
    setMemberDetailsLoading(true)

    void getOrganizationMemberById(organizationId, selectedMember.membershipId)
      .then((detail) => {
        if (!cancelled) {
          setMemberDetails(detail)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMemberDetails(null)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить карточку участника')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMemberDetailsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, permissions, selectedMember])

  useEffect(() => {
    if (roles.length === 0) {
      return
    }

    setInviteRoleCodes((prev) => {
      const availableRoleCodes = new Set(roles.map((role) => role.roleCode))
      const filtered = prev.filter((code) => availableRoleCodes.has(code))

      if (filtered.length > 0) {
        return filtered
      }

      return availableRoleCodes.has('EMPLOYEE') ? ['EMPLOYEE'] : []
    })
  }, [roles])

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true)
    clearMessages()

    try {
      await action()
      setSuccess(successMessage)
      const accessData = await loadData(true)
      const nextPermissions = accessData?.permissions ?? permissions
      await Promise.all([
        loadMembers(nextPermissions),
        loadInvites(nextPermissions),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка выполнения действия')
    } finally {
      setBusy(false)
    }
  }

  const resetRoleForm = () => {
    setRoleIdForEdit('')
    setRoleCode('')
    setRoleName('')
    setRoleDescription('')
    setRolePriority('500')
    setRolePermissionCodes(['MEMBERS_LIST', 'MEMBERS_READ'])
    setRoleFormErrors({})
  }

  const toggleCodeInList = (values: string[], code: string) =>
    values.includes(code) ? values.filter((value) => value !== code) : [...values, code]

  const validateRoleForm = () => {
    const errors: RoleFormErrors = {}
    const normalizedCode = roleCode.trim()
    const normalizedName = roleName.trim()
    const normalizedPriority = Number(rolePriority)

    if (!normalizedCode) {
      errors.code = 'Код роли обязателен'
    }

    if (!normalizedName) {
      errors.name = 'Название роли обязательно'
    }

    if (!roleIdForEdit && (!Number.isInteger(normalizedPriority) || normalizedPriority < 0)) {
      errors.priority = 'Приоритет роли не может быть отрицательным'
    }

    if (rolePermissionCodes.length === 0) {
      errors.permissions = 'Нужно указать хотя бы одно право'
    }

    setRoleFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return null
    }

    return {
      code: normalizedCode,
      name: normalizedName,
      description: roleDescription.trim() || null,
      priority: normalizedPriority,
      permissionCodes: rolePermissionCodes,
    }
  }

  const handleRoleSubmit = () => {
    const payload = validateRoleForm()
    if (!payload) {
      return
    }

    if (roleIdForEdit) {
      void runAction(async () => {
        await updateCustomRole(organizationId, roleIdForEdit, {
          code: payload.code,
          name: payload.name,
          description: payload.description,
          permissionCodes: payload.permissionCodes,
        })
        resetRoleForm()
      }, 'Роль обновлена')
      return
    }

    void runAction(async () => {
      await createCustomRole(organizationId, {
        code: payload.code,
        name: payload.name,
        description: payload.description,
        priority: payload.priority,
        permissionCodes: payload.permissionCodes,
      })
      resetRoleForm()
    }, 'Роль создана')
  }

  const handleStartEditRole = (role: OrganizationRole) => {
    setShowRoleForm(true)
    setRoleIdForEdit(role.roleId)
    setRoleCode(role.roleCode)
    setRoleName(role.name)
    setRoleDescription(role.description ?? '')
    setRolePermissionCodes(role.permissionCodes)
    setRoleFormErrors({})
  }

  const handleDeleteRole = (roleId: string) => {
    if (!window.confirm('Удалить эту роль?')) {
      return
    }

    void runAction(async () => {
      await deleteCustomRole(organizationId, roleId)
    }, 'Роль удалена')
  }

  const handleToggleSelectedMember = (membershipId: string) => {
    setSelectedMemberId((prev) => (prev === membershipId ? '' : membershipId))
  }

  const handleAssignMemberRoles = (membershipId: string) => {
    void runAction(async () => {
      await assignMemberRoles(organizationId, membershipId, assignRoleCodes)
      setAssignRoleCodes([])
    }, 'Роли назначены')
  }

  const handleRevokeMemberRole = (membershipId: string) => {
    void runAction(async () => {
      await revokeMemberRole(organizationId, membershipId, revokeRoleCode.trim())
      setRevokeRoleCode('')
    }, 'Роль снята')
  }

  const handleSaveMemberProfile = (membershipId: string) => {
    void runAction(async () => {
      await updateMember(organizationId, membershipId, {
        department: memberDepartment.trim() || null,
        title: memberTitle.trim() || null,
      })
    }, 'Данные участника обновлены')
  }

  const handleDeactivateMember = (membershipId: string) => {
    if (!window.confirm('Деактивировать участника?')) {
      return
    }

    void runAction(async () => {
      await deactivateMember(organizationId, membershipId)
    }, 'Участник деактивирован')
  }

  const handleActivateMember = (membershipId: string) => {
    void runAction(async () => {
      await activateMember(organizationId, membershipId)
    }, 'Участник активирован')
  }

  const handleRemoveMember = (membershipId: string) => {
    if (!window.confirm('Удалить участника из организации?')) {
      return
    }

    void runAction(async () => {
      await removeMember(organizationId, membershipId)
    }, 'Участник удалён')
  }

  const handleCreateInvitation = () => {
    clearMessages()

    if (!inviteExpiresAt.trim()) {
      setError('Укажите срок действия приглашения')
      return
    }

    const inviteExpiresDate = new Date(inviteExpiresAt)
    if (Number.isNaN(inviteExpiresDate.getTime())) {
      setError('Укажите корректную дату срока действия приглашения')
      return
    }

    if (inviteExpiresDate.getTime() <= Date.now()) {
      setError('Срок действия приглашения должен быть в будущем')
      return
    }

    void runAction(async () => {
      const result = await createInvitation(organizationId, {
        roleCodes: inviteRoleCodes,
        expiresAt: inviteExpiresDate.toISOString(),
      })
      setCreatedInviteLink(`${window.location.origin}/invite/${result.invitationToken}`)
    }, 'Приглашение создано')
  }

  const handleRevokeInvitation = (invitationId: string) => {
    if (!window.confirm('Отозвать приглашение?')) {
      return
    }

    void runAction(async () => {
      await revokeInvitation(organizationId, invitationId)
    }, 'Приглашение отозвано')
  }

  const handleCopyInviteLink = async () => {
    if (!createdInviteLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(createdInviteLink)
      setSuccess('Ссылка приглашения скопирована')
    } catch {
      setError('Не удалось скопировать ссылку, скопируйте вручную')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Управление организацией</h2>
        <Link className="inline-block text-sm font-medium text-sky-700 hover:underline" to={`/`}>
          ← Назад на главную
        </Link>
      </div>

      {error && (
        <Alert tone="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {loading && <p className="text-slate-600">Загружаем данные</p>}

      {!loading && (
        <RbacProvider permissions={permissions} roles={access?.roles ?? []}>
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Обзор</TabButton>
            <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')}>Ресурсы</TabButton>
            <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>Роли</TabButton>
            <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>Участники</TabButton>
            <TabButton active={activeTab === 'invites'} onClick={() => setActiveTab('invites')}>Приглашения</TabButton>
            <TabButton active={activeTab === 'booking-rules'} onClick={() => setActiveTab('booking-rules')}>Правила бронирования</TabButton>
          </div>

          {activeTab === 'overview' && <OverviewTab access={access} organizationRoles={roles} />}

          {activeTab === 'resources' && (
            <ResourcesTab
              organizationId={organizationId}
              permissions={permissions}
              roles={roles}
            />
          )}

          {activeTab === 'booking-rules' && (
            <BookingPoliciesTab
                organizationId={organizationId}
              />
          )}

          {activeTab === 'roles' && (
            <RolesTab
              busy={busy}
              permissions={permissions}
              showRoleForm={showRoleForm}
              onToggleRoleForm={() => setShowRoleForm((prev) => !prev)}
              roleIdForEdit={roleIdForEdit}
              roleCode={roleCode}
              roleName={roleName}
              roleDescription={roleDescription}
              rolePriority={rolePriority}
              roleFormErrors={roleFormErrors}
              rolePermissionCodes={rolePermissionCodes}
              permissionCatalog={permissionCatalog}
              roles={roles}
              onRoleCodeChange={setRoleCode}
              onRoleNameChange={setRoleName}
              onRoleDescriptionChange={setRoleDescription}
              onRolePriorityChange={setRolePriority}
              onClearRoleError={(field) => setRoleFormErrors((prev) => ({ ...prev, [field]: undefined }))}
              onToggleRolePermission={(code) => setRolePermissionCodes((prev) => toggleCodeInList(prev, code))}
              onSubmitRole={handleRoleSubmit}
              onResetRoleForm={resetRoleForm}
              onStartEditRole={handleStartEditRole}
              onDeleteRole={handleDeleteRole}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              membersStatus={membersStatus}
              onMembersStatusChange={setMembersStatus}
              members={members}
              selectedMemberId={selectedMemberId}
              myIdentityId={myIdentityId}
              accessPermissions={permissions}
              memberDetails={memberDetails}
              memberDetailsLoading={memberDetailsLoading}
              roles={roles}
              assignRoleCodes={assignRoleCodes}
              revokeRoleCode={revokeRoleCode}
              memberDepartment={memberDepartment}
              memberTitle={memberTitle}
              busy={busy}
              loading={membersLoading}
              onToggleSelectMember={handleToggleSelectedMember}
              onToggleAssignRole={(roleCode) => setAssignRoleCodes((prev) => toggleCodeInList(prev, roleCode))}
              onAssignRoles={handleAssignMemberRoles}
              onRevokeRoleCodeChange={setRevokeRoleCode}
              onRevokeRole={handleRevokeMemberRole}
              onMemberDepartmentChange={setMemberDepartment}
              onMemberTitleChange={setMemberTitle}
              onSaveProfile={handleSaveMemberProfile}
              onDeactivate={handleDeactivateMember}
              onActivate={handleActivateMember}
              onRemove={handleRemoveMember}
            />
          )}

          {activeTab === 'invites' && (
            <InvitesTab
              invitesStatus={invitesStatus}
              onInvitesStatusChange={setInvitesStatus}
              showInviteCreateForm={showInviteCreateForm}
              onToggleInviteCreateForm={() => setShowInviteCreateForm((prev) => !prev)}
              roles={roles}
              inviteRoleCodes={inviteRoleCodes}
              onToggleInviteRole={(roleCode) => setInviteRoleCodes((prev) => toggleCodeInList(prev, roleCode))}
              inviteExpiresAt={inviteExpiresAt}
              onInviteExpiresAtChange={setInviteExpiresAt}
              busy={busy}
              loading={invitesLoading}
              onCreateInvitation={handleCreateInvitation}
              createdInviteLink={createdInviteLink}
              onCopyInviteLink={() => {
                void handleCopyInviteLink()
              }}
              invitations={invitations}
              onRevokeInvitation={handleRevokeInvitation}
            />
          )}
        </RbacProvider>
      )}
    </div>
  )
}

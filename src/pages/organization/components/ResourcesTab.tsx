import { useEffect, useMemo, useState } from 'react'
import { Alert } from '../../../components/Alert'
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
  updateResourceStatus,
  type BookingRules,
  type ResourceItem,
  type ResourceStatus,
  type ResourceType,
} from '../../../api/resourceApi'
import { Can } from '../../../rbac/Can'
import { type OrganizationRolesResponse } from '../../../api/orgMembershipApi'

type ResourceFormState = {
  name: string
  type: ResourceType
  status: ResourceStatus
  officeAddress: string
  floor: string
  description: string
  maxDurationHours: string
  allowedRoles: string[]
}

const DEFAULT_ROLE_CODES = ['ORG_OWNER', 'ORG_ADMIN', 'RESOURCE_ADMIN', 'EMPLOYEE', 'VIEWER']

const emptyForm = (): ResourceFormState => ({
  name: '',
  type: 'meeting_room',
  status: 'available',
  officeAddress: '',
  floor: '',
  description: '',
  maxDurationHours: '4',
  allowedRoles: ['EMPLOYEE', 'RESOURCE_ADMIN', 'ORG_OWNER'],
})

function formatResourceType(type: ResourceType | string) {
  switch (type) {
    case 'meeting_room':
      return 'Переговорная'
    case 'workplace':
      return 'Рабочее место'
    case 'equipment':
      return 'Оборудование'
    case 'office':
      return 'Офис'
    default:
      return type
  }
}

function formatResourceStatus(status: ResourceStatus | string) {
  switch (status) {
    case 'available':
      return 'Доступен'
    case 'temporarily_unavailable':
      return 'Временно недоступен'
    case 'out_of_service':
      return 'Выведен из работы'
    default:
      return status
  }
}

function getStatusBadgeClass(status: ResourceStatus | string) {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-700'
    case 'temporarily_unavailable':
      return 'bg-amber-100 text-amber-700'
    case 'out_of_service':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function toFormState(resource: ResourceItem): ResourceFormState {
  return {
    name: resource.name,
    type: resource.type,
    status: resource.status,
    officeAddress: resource.officeAddress ?? '',
    floor: resource.floor?.toString() ?? '',
    description: resource.description ?? '',
    maxDurationHours: resource.bookingRules.maxDurationHours.toString(),
    allowedRoles: resource.bookingRules.allowedRoles,
  }
}

function normalizeBookingRules(form: ResourceFormState): BookingRules {
  return {
    maxDurationHours: Number(form.maxDurationHours),
    allowedRoles: form.allowedRoles,
  }
}

export function ResourcesTab({
  organizationId,
  permissions,
  roles,
}: {
  organizationId: string
  permissions: string[]
  roles: OrganizationRolesResponse['roles']
}) {
  const canRead = permissions.includes('RESOURCES_LIST') || permissions.includes('RESOURCES_READ')
  const canCreate = permissions.includes('RESOURCES_CREATE')
  const canUpdate = permissions.includes('RESOURCES_UPDATE')
  const canChangeStatus = permissions.includes('RESOURCES_STATUS_CHANGE')
  const canManageRules = permissions.includes('RESOURCES_RULES_MANAGE')

  const roleOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_ROLE_CODES, ...roles.map((role) => role.roleCode)])),
    [roles],
  )

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ResourceStatus>('all')
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<ResourceFormState>(emptyForm)
  const [editingResourceId, setEditingResourceId] = useState('')
  const [editForm, setEditForm] = useState<ResourceFormState>(emptyForm)

  const loadResources = async (filter = statusFilter) => {
    if (!canRead) {
      setResources([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await getResources(organizationId, filter === 'all' ? undefined : filter)
      setResources(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить ресурсы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, statusFilter, canRead])

  const updateForm = (
    mode: 'create' | 'edit',
    patch: Partial<ResourceFormState> | ((prev: ResourceFormState) => ResourceFormState),
  ) => {
    const applyPatch = (prev: ResourceFormState) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }

    if (mode === 'create') {
      setCreateForm(applyPatch)
      return
    }

    setEditForm(applyPatch)
  }

  const validateForm = (form: ResourceFormState) => {
    if (!form.name.trim()) {
      return 'Название ресурса обязательно'
    }

    const maxDurationHours = Number(form.maxDurationHours)
    if (!Number.isInteger(maxDurationHours) || maxDurationHours < 1 || maxDurationHours > 168) {
      return 'Максимальная длительность должна быть целым числом от 1 до 168'
    }

    if (form.allowedRoles.length === 0) {
      return 'Выберите хотя бы одну роль для бронирования'
    }

    if (form.floor.trim()) {
      const floor = Number(form.floor)
      if (!Number.isInteger(floor)) {
        return 'Этаж должен быть целым числом'
      }
    }

    return ''
  }

  const buildCreatePayload = (form: ResourceFormState) => {
    return {
      organizationId,
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      officeAddress: form.officeAddress.trim() || null,
      floor: form.floor.trim() ? Number(form.floor) : null,
      description: form.description.trim() || null,
      bookingRules: normalizeBookingRules(form),
    }
  }

  const buildUpdatePayload = (form: ResourceFormState) => {
    return {
      name: form.name.trim(),
      type: form.type,
      officeAddress: form.officeAddress.trim() || null,
      floor: form.floor.trim() ? Number(form.floor) : null,
      description: form.description.trim() || null,
      bookingRules: canManageRules ? normalizeBookingRules(form) : undefined,
    }
  }

  const handleCreate = async () => {
    const validationError = validateForm(createForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await createResource(buildCreatePayload(createForm))
      setSuccess('Ресурс создан')
      setShowCreateForm(false)
      setCreateForm(emptyForm())
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать ресурс')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (resource: ResourceItem) => {
    setEditingResourceId(resource.id)
    setEditForm(toFormState(resource))
    setError('')
    setSuccess('')
  }

  const handleCancelEdit = () => {
    setEditingResourceId('')
    setEditForm(emptyForm())
  }

  const handleSaveEdit = async () => {
    if (!editingResourceId) {
      return
    }

    const validationError = validateForm(editForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateResource(editingResourceId, buildUpdatePayload(editForm))

      const currentResource = resources.find((resource) => resource.id === editingResourceId)
      if (currentResource && canChangeStatus && currentResource.status !== editForm.status) {
        await updateResourceStatus(editingResourceId, editForm.status)
      }

      setSuccess('Ресурс обновлён')
      setEditingResourceId('')
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить ресурс')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Удалить этот ресурс?')) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteResource(resourceId)
      setSuccess('Ресурс удалён')
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить ресурс')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickStatusChange = async (resourceId: string, status: ResourceStatus) => {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await updateResourceStatus(resourceId, status)
      setSuccess('Статус ресурса обновлён')
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус ресурса')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCount = resources.length
  const availableCount = resources.filter((resource) => resource.status === 'available').length
  const unavailableCount = resources.filter((resource) => resource.status !== 'available').length

  const renderForm = (mode: 'create' | 'edit') => {
    const form = mode === 'create' ? createForm : editForm
    const onPatch = (patch: Partial<ResourceFormState> | ((prev: ResourceFormState) => ResourceFormState)) =>
      updateForm(mode, patch)

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Название</label>
          <input
            value={form.name}
            onChange={(event) => onPatch({ name: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Тип</label>
          <select
            value={form.type}
            onChange={(event) => onPatch({ type: event.target.value as ResourceType })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="meeting_room">Переговорная</option>
            <option value="workplace">Рабочее место</option>
            <option value="equipment">Оборудование</option>
            <option value="office">Офис</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Статус</label>
          <select
            value={form.status}
            onChange={(event) => onPatch({ status: event.target.value as ResourceStatus })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="available">Доступен</option>
            <option value="temporarily_unavailable">Временно недоступен</option>
            <option value="out_of_service">Выведен из работы</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Этаж</label>
          <input
            value={form.floor}
            onChange={(event) => onPatch({ floor: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Например, 3"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Адрес офиса</label>
          <input
            value={form.officeAddress}
            onChange={(event) => onPatch({ officeAddress: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Описание</label>
          <textarea
            value={form.description}
            onChange={(event) => onPatch({ description: event.target.value })}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Макс. длительность бронирования, часов</label>
          <input
            value={form.maxDurationHours}
            onChange={(event) => onPatch({ maxDurationHours: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium text-slate-700">Роли, которым разрешено бронирование</p>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((roleCode) => {
              const checked = form.allowedRoles.includes(roleCode)

              return (
                <label
                  key={roleCode}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                    checked
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onPatch((prev) => ({
                        ...prev,
                        allowedRoles: checked
                          ? prev.allowedRoles.filter((code) => code !== roleCode)
                          : [...prev.allowedRoles, roleCode],
                      }))
                    }
                    className="accent-sky-600"
                  />
                  {roleCode}
                </label>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (!canRead) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Ресурсы</h3>
        <div className="mt-4">
          <Alert tone="info" dismissible={false}>
            У вас нет права на просмотр ресурсов этой организации.
          </Alert>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Ресурсы организации</h3>
            <p className="mt-1 text-sm text-slate-600">
              Поддерживайте актуальные переговорные, рабочие места и оборудование для бронирования.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadResources()}
              disabled={loading || submitting}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
            >
              Обновить
            </button>

            <Can permission="RESOURCES_CREATE">
              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                {showCreateForm ? 'Скрыть форму' : 'Добавить ресурс'}
              </button>
            </Can>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Всего</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalCount}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Доступны</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">{availableCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Недоступны</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900">{unavailableCount}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: 'all' as const, label: 'Все' },
            { value: 'available' as const, label: 'Доступны' },
            { value: 'temporarily_unavailable' as const, label: 'Временно недоступны' },
            { value: 'out_of_service' as const, label: 'Выведены из работы' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                statusFilter === item.value
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {showCreateForm && canCreate && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-slate-900">Новый ресурс</h4>
            <span className="text-xs text-slate-500">Создание и правила бронирования</span>
          </div>

          <div className="mt-4">{renderForm('create')}</div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? 'Сохраняем...' : 'Создать ресурс'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setCreateForm(emptyForm())
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Отмена
            </button>
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-semibold text-slate-900">Список ресурсов</h4>
          {loading && <span className="text-sm text-slate-500">Загружаем...</span>}
        </div>

        {!loading && resources.length === 0 && (
          <p className="text-sm text-slate-500">Ресурсы пока не добавлены.</p>
        )}

        {resources.map((resource) => {
          const isEditing = editingResourceId === resource.id

          return (
            <article key={resource.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-base font-semibold text-slate-900">{resource.name}</h5>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(resource.status)}`}>
                      {formatResourceStatus(resource.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {formatResourceType(resource.type)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p><span className="font-medium text-slate-800">Адрес:</span> {resource.officeAddress || 'Не указан'}</p>
                    <p><span className="font-medium text-slate-800">Этаж:</span> {resource.floor ?? 'Не указан'}</p>
                    <p className="md:col-span-2">
                      <span className="font-medium text-slate-800">Описание:</span> {resource.description || 'Без описания'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Макс. длительность:</span>{' '}
                      {resource.bookingRules.maxDurationHours} ч.
                    </p>
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-800">Разрешённые роли</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resource.bookingRules.allowedRoles.map((roleCode) => (
                          <span key={roleCode} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                            {roleCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Can permission="RESOURCES_UPDATE">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(resource)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                      Изменить
                    </button>
                  </Can>

                  <Can permission="RESOURCES_STATUS_CHANGE">
                    <div className="flex gap-2">
                      {resource.status !== 'available' && (
                        <button
                          type="button"
                          onClick={() => void handleQuickStatusChange(resource.id, 'available')}
                          disabled={submitting}
                          className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                        >
                          Открыть
                        </button>
                      )}
                      {resource.status !== 'temporarily_unavailable' && (
                        <button
                          type="button"
                          onClick={() => void handleQuickStatusChange(resource.id, 'temporarily_unavailable')}
                          disabled={submitting}
                          className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700"
                        >
                          Пауза
                        </button>
                      )}
                    </div>
                  </Can>

                  <Can permission="RESOURCES_DELETE">
                    <button
                      type="button"
                      onClick={() => void handleDelete(resource.id)}
                      disabled={submitting}
                      className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                    >
                      Удалить
                    </button>
                  </Can>
                </div>
              </div>

              {isEditing && canUpdate && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h6 className="text-sm font-semibold text-slate-900">Редактирование ресурса</h6>
                  <div className="mt-4">{renderForm('edit')}</div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      disabled={submitting}
                      className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                    >
                      {submitting ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}

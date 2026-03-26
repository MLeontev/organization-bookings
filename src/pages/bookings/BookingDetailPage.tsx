import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getBookingById, cancelBooking, type BookingGroup } from '../../api/bookingApi'
import { getMyAccess, getMyProfile, getUserByIdentityId, type UserProfileByIdentity } from '../../api/orgMembershipApi'
import { getResources, type ResourceItem } from '../../api/resourceApi'

type DisplayStatus = 'active' | 'expired' | 'cancelled'

function getDisplayStatus(booking: BookingGroup): DisplayStatus {
  if (booking.status === 'Cancelled') return 'cancelled'
  if (booking.endTimeLocal < new Date()) return 'expired'
  return 'active'
}

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const STATUS_LABELS: Record<DisplayStatus, string> = {
  active: 'Активное',
  expired: 'Завершено',
  cancelled: 'Отменено',
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-blue-100 text-blue-600',
  cancelled: 'bg-slate-100 text-slate-500',
}

export function BookingDetailPage() {
  const { organizationId = '', bookingId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [booking, setBooking] = useState<BookingGroup | null>(null)
  const [owner, setOwner] = useState<UserProfileByIdentity | null>(null)
  const [resources, setResources] = useState<Record<string, ResourceItem>>({})
  const [canCancel, setCanCancel] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [data, access, profile] = await Promise.all([
          getBookingById(bookingId, organizationId),
          getMyAccess(organizationId),
          getMyProfile(),
        ])

        if (!mounted) return
        setBooking(data)

        const canManageAny = access.permissions.includes('BOOKINGS_MANAGE_ANY')
        const canCancelOwn = access.permissions.includes('BOOKINGS_CANCEL_OWN')
        const isOwn = data.identityId === profile.identityId
        const ds = getDisplayStatus(data)

        setCanCancel(ds === 'active' && (canManageAny || (canCancelOwn && isOwn)))

        // Загружаем профиль владельца
        try {
          const ownerProfile = await getUserByIdentityId(data.identityId)
          if (mounted) setOwner(ownerProfile)
        } catch {
          // профиль не критичен
        }

        // Загружаем данные ресурсов
        try {
          const allResources = await getResources(organizationId)
          const resourcesMap: Record<string, ResourceItem> = {}
          allResources.forEach(r => {
            resourcesMap[r.id] = r
          })
          if (mounted) setResources(resourcesMap)
        } catch {
          // ресурсы не критичны
        }

      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Не удалось загрузить бронирование')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [bookingId, organizationId])

  const handleCancel = async () => {
    if (!confirm('Отменить бронирование?')) return
    setCancelling(true)
    setError('')
    try {
      await cancelBooking(bookingId, organizationId)
      setBooking(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
      setCanCancel(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отменить бронирование')
    } finally {
      setCancelling(false)
    }
  }

  const ds = booking ? getDisplayStatus(booking) : null

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
              to={`/organizations/${organizationId}/bookings`}
              className="text-sm font-medium text-sky-700 hover:underline"
          >
            ← Назад к списку
          </Link>
          {canCancel && (
              <button
                  onClick={() => void handleCancel()}
                  disabled={cancelling}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {cancelling ? 'Отменяем...' : 'Отменить бронирование'}
              </button>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {loading && <p className="text-slate-600">Загружаем данные...</p>}

        {!loading && !booking && !error && (
            <p className="text-slate-600">Бронирование не найдено</p>
        )}

        {!loading && booking && ds && (
            <div className="space-y-4">
              {/* Основная инфо */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[ds]}`}>
                {STATUS_LABELS[ds]}
              </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Период</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDate(booking.startTimeLocal)} — {formatDate(booking.endTimeLocal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Создано</p>
                    <p className="mt-1 text-sm text-slate-700">{formatDate(new Date(booking.createdAt))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Владелец</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {owner
                          ? `${owner.firstName} ${owner.lastName} · ${owner.email}`
                          : booking.identityId}
                    </p>
                  </div>
                </div>
              </section>

              {/* Ресурсы */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Ресурсы
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {booking.bookings.length}
              </span>
                </h3>
                <div className="space-y-3">
                  {booking.bookings.map(item => {
                    const res = resources[item.resourceId]
                    if (!res) return (
                        <div key={item.id} className="p-3 border rounded-lg bg-slate-50 text-sm text-slate-700 font-mono">
                          {item.resourceId} (информация недоступна)
                        </div>
                    )
                    return (
                        <div
                            key={item.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-1 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-800">{res.name} ({res.type})</div>
                            <span className={`text-xs rounded-full px-2 py-0.5 ${
                                item.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-500'
                            }`}>
                        {item.status === 'Active' ? 'Активен' : 'Отменён'}
                      </span>
                          </div>
                          {res.officeAddress && (
                              <div className="text-xs text-slate-500">
                                Адрес: {res.officeAddress}{res.floor !== null ? `, этаж ${res.floor}` : ''}
                              </div>
                          )}
                          {res.description && (
                              <div className="text-xs text-slate-500">Описание: {res.description}</div>
                          )}
                          <div className="text-xs text-slate-500">
                            Статус ресурса: {res.status === 'available' ? 'Доступен' : res.status === 'temporarily_unavailable' ? 'Временно недоступен' : 'Вне сервиса'}
                          </div>
                          {res.bookingRules && (
                              <div className="text-xs text-slate-500">
                                Макс. длительность: {res.bookingRules.maxDurationHours} ч. · Разрешённые роли: {res.bookingRules.allowedRoles.join(', ')}
                              </div>
                          )}
                        </div>
                    )
                  })}
                </div>
              </section>

              {/* Политики */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-3">Применённые политики</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Макс. длительность</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                      {booking.appliedPolicy.maxDurationHours} ч.
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Лимит броней на пользователя</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                      {booking.appliedPolicy.maxBookingsPerUser}
                    </p>
                  </div>
                </div>
              </section>
            </div>
        )}
      </div>
  )
}
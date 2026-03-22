import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getBookings, cancelBooking, type BookingGroup } from '../../api/bookingApi'
import {getMyAccess, getMyProfile} from '../../api/orgMembershipApi'

type DisplayStatus = 'active' | 'expired' | 'cancelled'
type StatusFilter = 'all' | DisplayStatus

function getDisplayStatus(booking: BookingGroup): DisplayStatus {
  if (booking.status === 'Cancelled') return 'cancelled'
  if (new Date(booking.endTime) < new Date()) return 'expired'
  return 'active'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function sortBookings(bookings: BookingGroup[]): BookingGroup[] {
  return [...bookings].sort((a, b) => {
    const sa = getDisplayStatus(a)
    const sb = getDisplayStatus(b)
    if (sa === 'active' && sb === 'active')
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    if (sa !== 'active' && sb !== 'active')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sa === 'active') return -1
    return 1
  })
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

export function BookingsPage() {
  const { organizationId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<BookingGroup[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [canManageAny, setCanManageAny] = useState(false)
  const [myIdentityId, setMyIdentityId] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [data, access, profile] = await Promise.all([
          getBookings(organizationId),
          getMyAccess(organizationId),
          getMyProfile(),
        ])
        if (mounted) {
          setBookings(data)
          setCanManageAny(access.permissions.includes('BOOKINGS_MANAGE_ANY'))
          setMyIdentityId(profile.identityId)
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Не удалось загрузить бронирования')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [organizationId])

  const handleCancel = async (id: string) => {
    if (!confirm('Отменить бронирование?')) return
    setCancellingId(id)
    setError('')
    try {
      await cancelBooking(id, organizationId)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отменить бронирование')
    } finally {
      setCancellingId(null)
    }
  }

  const canCancel = (booking: BookingGroup) => {
    if (getDisplayStatus(booking) !== 'active') return false
    if (canManageAny) return true
    return booking.identityId === myIdentityId
  }

  const filtered = sortBookings(
    statusFilter === 'all'
      ? bookings
      : bookings.filter(b => getDisplayStatus(b) === statusFilter)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-sm font-medium text-sky-700 hover:underline">
          ← Назад на главную
        </Link>
        <Link
          to={`/organizations/${organizationId}/bookings/new`}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Новое бронирование
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Бронирования</h2>
            {canManageAny && (
              <p className="mt-0.5 text-xs text-slate-500">Вы видите все брони организации</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'expired', 'cancelled'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  statusFilter === s
                    ? 'bg-sky-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {s === 'all' ? 'Все' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {loading && <p className="text-slate-600">Загружаем данные...</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-slate-600">Бронирований нет</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(booking => {
              const ds = getDisplayStatus(booking)
              const isOwn = booking.identityId === myIdentityId
              return (
                <div
                  key={booking.id}
                  className={`rounded-lg border p-4 ${
                    ds === 'active' ? 'border-slate-200' : 'border-slate-100 bg-slate-50 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ds]}`}>
                          {STATUS_LABELS[ds]}
                        </span>
                        <span className="text-sm text-slate-500">
                          {booking.bookings.length} {
                            booking.bookings.length === 1 ? 'ресурс' :
                            booking.bookings.length < 5 ? 'ресурса' : 'ресурсов'
                          }
                        </span>
                        {canManageAny && !isOwn && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
                            Чужая
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">{formatDate(booking.startTime)}</span>
                        <span className="mx-2 text-slate-400">—</span>
                        <span className="font-medium">{formatDate(booking.endTime)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {booking.bookings.map(item => (
                          <span
                            key={item.id}
                            className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                          >
                            {item.resourceId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {canCancel(booking) && (
                      <button
                        onClick={() => void handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? 'Отменяем...' : 'Отменить'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

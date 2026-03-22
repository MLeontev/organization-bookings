import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getMyOrganizations } from '../../api/orgMembershipApi'
import { getMyBookings, cancelBooking, type BookingGroup } from '../../api/bookingApi'

type OrgBookings = {
  organizationId: string
  index: number
  bookings: BookingGroup[]
  loading: boolean
  error: string
}

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

    // Активные — по startTime по возрастанию (ближайшие первые)
    if (sa === 'active' && sb === 'active')
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()

    // Отменённые и истёкшие — по createdAt по убыванию (последние первые)
    if (sa !== 'active' && sb !== 'active')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

    // Активные выше остальных
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

export function MyBookingsPage() {
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState('')
  const [orgBookings, setOrgBookings] = useState<OrgBookings[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setOrgsLoading(true)
      setOrgsError('')
      try {
        const { organizations } = await getMyOrganizations('Active')
        if (!mounted) return

        const initial: OrgBookings[] = organizations.map((org, i) => ({
          organizationId: org.organizationId,
          index: i + 1,
          bookings: [],
          loading: true,
          error: '',
        }))
        setOrgBookings(initial)

        await Promise.all(
          organizations.map(async (org) => {
            try {
              const data = await getMyBookings(org.organizationId)
              if (!mounted) return
              setOrgBookings(prev =>
                prev.map(o =>
                  o.organizationId === org.organizationId
                    ? { ...o, bookings: data, loading: false }
                    : o
                )
              )
            } catch (err) {
              if (!mounted) return
              setOrgBookings(prev =>
                prev.map(o =>
                  o.organizationId === org.organizationId
                    ? { ...o, loading: false, error: err instanceof Error ? err.message : 'Ошибка' }
                    : o
                )
              )
            }
          })
        )
      } catch (err) {
        if (mounted) setOrgsError(err instanceof Error ? err.message : 'Не удалось загрузить организации')
      } finally {
        if (mounted) setOrgsLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [])

  const handleCancel = async (bookingId: string, organizationId: string) => {
    if (!confirm('Отменить бронирование?')) return
    setCancellingId(bookingId)
    try {
      await cancelBooking(bookingId, organizationId)
      setOrgBookings(prev =>
        prev.map(o =>
          o.organizationId === organizationId
            ? {
                ...o,
                bookings: o.bookings.map(b =>
                  b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b
                ),
              }
            : o
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось отменить бронирование')
    } finally {
      setCancellingId(null)
    }
  }

  const filterBookings = (bookings: BookingGroup[]) => {
    if (statusFilter === 'all') return sortBookings(bookings)
    return sortBookings(bookings.filter(b => getDisplayStatus(b) === statusFilter))
  }

  const totalActive = orgBookings.reduce(
    (sum, o) => sum + o.bookings.filter(b => getDisplayStatus(b) === 'active').length,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm font-medium text-sky-700 hover:underline">
          ← Назад на главную
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Все мои бронирования</h2>
          {totalActive > 0 && (
            <p className="mt-0.5 text-sm text-slate-500">
              {totalActive} активных {totalActive === 1 ? 'бронирование' : totalActive < 5 ? 'бронирования' : 'бронирований'}
            </p>
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

      {orgsError && <Alert tone="error">{orgsError}</Alert>}
      {orgsLoading && <p className="text-slate-600">Загружаем данные...</p>}

      {!orgsLoading && !orgsError && orgBookings.length === 0 && (
        <p className="text-slate-600">Вы не состоите ни в одной организации</p>
      )}

      {orgBookings.map(org => {
        const filtered = filterBookings(org.bookings)
        if (!org.loading && !org.error && filtered.length === 0 && statusFilter !== 'all') return null

        return (
          <section key={org.organizationId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">Организация {org.index}</h3>
              <Link
                to={`/organizations/${org.organizationId}/bookings/new`}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                + Забронировать
              </Link>
            </div>

            {org.error && <Alert tone="error">{org.error}</Alert>}
            {org.loading && <p className="text-sm text-slate-500">Загружаем...</p>}

            {!org.loading && !org.error && filtered.length === 0 && (
              <p className="text-sm text-slate-500">Бронирований нет</p>
            )}

            {!org.loading && !org.error && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map(booking => {
                  const ds = getDisplayStatus(booking)
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

                        {ds === 'active' && (
                          <button
                            onClick={() => void handleCancel(booking.id, org.organizationId)}
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
        )
      })}
    </div>
  )
}

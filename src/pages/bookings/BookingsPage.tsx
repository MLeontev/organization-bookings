import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getBookings, type BookingGroup } from '../../api/bookingApi'

type DisplayStatus = 'active' | 'expired' | 'cancelled'
type StatusFilter = 'all' | DisplayStatus

function getDisplayStatus(booking: BookingGroup): DisplayStatus {
  if (booking.status === 'Cancelled') return 'cancelled'
  if (booking.endTimeLocal < new Date()) return 'expired'
  return 'active'
}

function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function sortBookings(bookings: BookingGroup[]): BookingGroup[] {
  return [...bookings].sort((a, b) => {
    const sa = getDisplayStatus(a)
    const sb = getDisplayStatus(b)
    if (sa === 'active' && sb === 'active')
      return a.startTimeLocal.getTime() - b.startTimeLocal.getTime()
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

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getBookings(organizationId)
        if (mounted) setBookings(data)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Не удалось загрузить бронирования')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [organizationId])

  const filtered = sortBookings(
      statusFilter === 'all'
          ? bookings
          : bookings.filter(b => getDisplayStatus(b) === statusFilter)
  )

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-medium text-sky-700 hover:underline">
            ← На главную
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
            <h2 className="text-xl font-semibold text-slate-900">Бронирования</h2>
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
              <div className="space-y-2">
                {filtered.map(booking => {
                  const ds = getDisplayStatus(booking)
                  return (
                      <Link
                          key={booking.id}
                          to={`/organizations/${organizationId}/bookings/${booking.id}`}
                          className={`flex items-center justify-between rounded-lg border p-4 transition hover:border-sky-300 hover:bg-sky-50 ${
                              ds === 'active' ? 'border-slate-200' : 'border-slate-100 bg-slate-50 opacity-70'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ds]}`}>
                      {STATUS_LABELS[ds]}
                    </span>
                          <span className="text-sm text-slate-700">
                      {formatDate(booking.startTimeLocal)} — {formatDate(booking.endTimeLocal)}
                    </span>
                          <span className="text-sm text-slate-400">
                      {booking.bookings.length}{' '}
                            {booking.bookings.length === 1
                                ? 'ресурс'
                                : booking.bookings.length < 5
                                    ? 'ресурса'
                                    : 'ресурсов'}
                    </span>
                        </div>
                        <span className="text-sm text-sky-600">Подробнее →</span>
                      </Link>
                  )
                })}
              </div>
          )}
        </section>
      </div>
  )
}
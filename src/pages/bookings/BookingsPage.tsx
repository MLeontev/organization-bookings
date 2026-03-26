import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getBookings, type BookingGroup } from '../../api/bookingApi'
import { getUserByIdentityId, type UserProfileByIdentity } from '../../api/orgMembershipApi'
import { BookingRow } from './components/BookingRow'

type StatusFilter = 'all' | 'active' | 'expired' | 'cancelled'

export function BookingsPage() {
  const { organizationId = '' } = useParams()
  const [bookings, setBookings] = useState<BookingGroup[]>([])
  const [users, setUsers] = useState<Record<string, UserProfileByIdentity>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // сортировка
  const getDisplayStatus = (booking: BookingGroup): StatusFilter => {
    if (booking.status === 'Cancelled') return 'cancelled'
    if (booking.endTimeLocal < new Date()) return 'expired'
    return 'active'
  }

  const sortBookings = (bookings: BookingGroup[]) => {
    return [...bookings].sort((a, b) => {
      const sa = getDisplayStatus(a)
      const sb = getDisplayStatus(b)
      if (sa === 'active' && sb === 'active') return a.startTimeLocal.getTime() - b.startTimeLocal.getTime()
      if (sa !== 'active' && sb !== 'active') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sa === 'active') return -1
      return 1
    })
  }

  // загрузка бронирований и владельцев
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getBookings(organizationId)
        if (!mounted) return
        setBookings(data)

        // уникальные identityId
        const uniqueIds = Array.from(new Set(data.map(b => b.identityId)))
        const userEntries = await Promise.all(
            uniqueIds.map(async id => {
              try {
                const user = await getUserByIdentityId(id)
                return [id, user] as const
              } catch {
                return [id, { id, identityId: id, firstName: 'Неизвестно', lastName: '' }] as const
              }
            })
        )
        if (mounted) setUsers(Object.fromEntries(userEntries))
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Не удалось загрузить бронирования')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [organizationId])

  const filtered = sortBookings(
      statusFilter === 'all' ? bookings : bookings.filter(b => getDisplayStatus(b) === statusFilter)
  )

  const handleCancel = async (bookingId: string) => {
    // Пример отмены (подключи cancelBooking из api)
    setCancellingId(bookingId)
    try {
      // await cancelBooking(bookingId, organizationId)
      alert(`Бронь ${bookingId} отменена`) // заглушка
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    } catch {
      alert('Ошибка при отмене')
    } finally {
      setCancellingId(null)
    }
  }

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
                    {s === 'all' ? 'Все' : s === 'active' ? 'Активное' : s === 'expired' ? 'Завершено' : 'Отменено'}
                  </button>
              ))}
            </div>
          </div>

          {error && <Alert tone="error">{error}</Alert>}
          {loading && <p className="text-slate-600">Загружаем данные...</p>}
          {!loading && !error && filtered.length === 0 && <p className="text-slate-600">Бронирований нет</p>}

          {!loading && !error && filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map(booking => (
                    <BookingRow
                        key={booking.id}
                        booking={booking}
                        organizationId={organizationId}
                        owner={users[booking.identityId]}
                        onCancel={handleCancel}
                        cancelling={cancellingId === booking.id}
                    />
                ))}
              </div>
          )}
        </section>
      </div>
  )
}
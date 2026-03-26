import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getMyOrganizations } from '../../api/orgMembershipApi'
import { getMyBookings, type BookingGroup } from '../../api/bookingApi'
import { getOrganization } from '../../api/organizationsApi'
import keycloak from '../../keycloak'
import {BookingRow} from "./components/BookingRow.tsx";

type OrgBookings = {
  organizationId: string
  organizationName: string
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


export function MyBookingsPage() {
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [orgsError, setOrgsError] = useState('')
  const [orgBookings, setOrgBookings] = useState<OrgBookings[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setOrgsLoading(true)
      setOrgsError('')
      try {
        const { organizations } = await getMyOrganizations('Active')
        if (!mounted) return

        let accessToken = keycloak.token ?? null
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30)
            accessToken = keycloak.token ?? accessToken
          } catch {
            // игнорируем, используем текущий токен или fallback-имя организации
          }
        }

        const initial: OrgBookings[] = organizations.map((org, i) => ({
          organizationId: org.organizationId,
          organizationName: `Организация ${i + 1}`,
          index: i + 1,
          bookings: [],
          loading: true,
          error: '',
        }))
        setOrgBookings(initial)

        await Promise.all(
          organizations.map(async (org, index) => {
            const [bookingsResult, organizationResult] = await Promise.allSettled([
              getMyBookings(org.organizationId),
              accessToken
                ? getOrganization(accessToken, org.organizationId)
                : Promise.resolve(null),
            ])

            if (!mounted) return

            setOrgBookings(prev =>
              prev.map(o => {
                if (o.organizationId !== org.organizationId) {
                  return o
                }

                const resolvedName =
                  organizationResult.status === 'fulfilled' && organizationResult.value
                    ? organizationResult.value.data.name
                    : o.organizationName || `Организация ${index + 1}`

                if (bookingsResult.status === 'fulfilled') {
                  return {
                    ...o,
                    organizationName: resolvedName,
                    bookings: bookingsResult.value,
                    loading: false,
                  }
                }

                return {
                  ...o,
                  organizationName: resolvedName,
                  loading: false,
                  error: bookingsResult.reason instanceof Error ? bookingsResult.reason.message : 'Ошибка',
                }
              })
            )
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
              <h3 className="font-semibold text-slate-900">{org.organizationName}</h3>
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
                {filtered.map(booking => (
                    <BookingRow
                        key={booking.id}
                        booking={booking}
                        organizationId={org.organizationId}
                    />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

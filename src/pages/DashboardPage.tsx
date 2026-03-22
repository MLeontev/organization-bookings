import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { getMyOrganizations, getMyProfile, type UserOrganizationsResponse, type UserProfile } from '../api/orgMembershipApi'
import { formatMembershipStatus } from '../utils/statuses'

export function DashboardPage() {
  const statusOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'Все статусы' },
    { value: 'Active', label: 'Активные' },
    { value: 'Deactivated', label: 'Деактивированные' },
    { value: 'Removed', label: 'Удалённые' },
  ]

  const [profileLoading, setProfileLoading] = useState(true)
  const [organizationsLoading, setOrganizationsLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [organizationsError, setOrganizationsError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organizations, setOrganizations] = useState<UserOrganizationsResponse['organizations']>([])
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError('')
      try {
        const myProfile = await getMyProfile()

        if (!mounted) {
          return
        }

        setProfile(myProfile)
      } catch (err) {
        if (mounted) {
          setProfileError(err instanceof Error ? err.message : 'Не удалось загрузить профиль')
        }
      } finally {
        if (mounted) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadOrganizations = async () => {
      setOrganizationsLoading(true)
      setOrganizationsError('')
      try {
        const myOrganizations = await getMyOrganizations(statusFilter || undefined)

        if (!mounted) {
          return
        }

        setOrganizations(myOrganizations.organizations)
      } catch (err) {
        if (mounted) {
          setOrganizationsError(err instanceof Error ? err.message : 'Не удалось загрузить организации')
        }
      } finally {
        if (mounted) {
          setOrganizationsLoading(false)
        }
      }
    }

    void loadOrganizations()

    return () => {
      mounted = false
    }
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Мой профиль</h2>
        {profileError && (
          <div className="mt-3">
            <Alert tone="error" onClose={() => setProfileError('')}>
              {profileError}
            </Alert>
          </div>
        )}
        {profileLoading && <p className="mt-3 text-slate-600">Загружаем данные</p>}
        {!profileLoading && profile && (
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>
              <span className="font-medium">Имя:</span> {profile.firstName} {profile.lastName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {profile.email}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Мои организации</h2>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status.value || 'all'}
                type="button"
                onClick={() => setStatusFilter(status.value)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  statusFilter === status.value
                    ? 'bg-sky-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {organizationsError && (
          <Alert tone="error" onClose={() => setOrganizationsError('')}>
            {organizationsError}
          </Alert>
        )}

        {organizationsLoading && <p className="text-slate-600">Загружаем данные</p>}

        {!organizationsLoading && !organizationsError && organizations.length === 0 && (
          <p className="text-slate-600">Организаций пока нет</p>
        )}

        {!organizationsLoading && !organizationsError && organizations.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {organizations.map((organization, index) => (
                <div
                    key={organization.membershipId}
                    className="rounded-lg border border-slate-200 p-4 transition hover:border-sky-400 hover:bg-sky-50"
                >
                  <p className="font-semibold text-slate-900">Организация {index + 1}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Статус членства: {formatMembershipStatus(organization.status)}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link
                        to={`/organizations/${organization.organizationId}`}
                        className="text-sm text-sky-600 hover:underline"
                    >
                      Управление
                    </Link>
                    <Link
                        to={`/organizations/${organization.organizationId}/bookings`}
                        className="text-sm text-sky-600 hover:underline"
                    >
                      Бронирования
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

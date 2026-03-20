import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { getMyOrganizations, getMyProfile, type UserOrganizationsResponse, type UserProfile } from '../api/orgMembershipApi'
import { formatMembershipStatus } from '../utils/statuses'

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organizations, setOrganizations] = useState<UserOrganizationsResponse['organizations']>([])
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [myProfile, myOrganizations] = await Promise.all([
          getMyProfile(),
          getMyOrganizations(statusFilter || undefined),
        ])

        if (!mounted) {
          return
        }

        setProfile(myProfile)
        setOrganizations(myOrganizations.organizations)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Мой профиль</h2>
        {loading && <p className="mt-3 text-slate-600">Загружаем данные</p>}
        {!loading && profile && (
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
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Все статусы</option>
            <option value="Active">Активные</option>
            <option value="Deactivated">Деактивированные</option>
            <option value="Removed">Удалённые</option>
          </select>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {!loading && !error && organizations.length === 0 && (
          <p className="text-slate-600">Организаций пока нет</p>
        )}

        {!loading && !error && organizations.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {organizations.map((organization, index) => (
              <Link
                key={organization.membershipId}
                to={`/organizations/${organization.organizationId}`}
                className="block rounded-lg border border-slate-200 p-4 transition hover:border-sky-400 hover:bg-sky-50"
              >
                <p className="font-semibold text-slate-900">Организация {index + 1}</p>
                <p className="mt-1 text-sm text-slate-600">Статус членства: {formatMembershipStatus(organization.status)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

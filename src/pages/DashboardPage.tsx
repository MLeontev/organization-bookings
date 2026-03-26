import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { getMyOrganizations, getMyProfile, type UserProfile } from '../api/orgMembershipApi'
import { deleteOrganization, getOrganization, type Organization } from '../api/organizationsApi';
import keycloak from '../keycloak';
import { Can } from '../rbac/Can'

type MembershipStatus = 'Active' | 'Deactivated' | 'Removed'

type DashboardOrganization = Organization & {
  membershipStatus: MembershipStatus
  membershipId: string
}

export function DashboardPage() {
  const statusOptions: Array<{ value: 'active' | 'archived' | ''; label: string }> = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'archived', label: 'Деактивированные' },
  ];

  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<DashboardOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | ''>('');

  // Берём токен после инициализации Keycloak
  useEffect(() => {
    if (keycloak.token) {
      setToken(keycloak.token);
    }
    console.log(keycloak.tokenParsed)
  }, [keycloak.token]);

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

  // Загружаем организации, в которых состоит пользователь, затем получаем их названия по organizationId
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!token) return;

      setLoading(true);
      setError('');

      try {
        const { organizations: memberships } = await getMyOrganizations();

        const actualMemberships = memberships.filter(
          (membership) => membership.status !== 'Removed',
        );

        const orgResults = await Promise.allSettled(
          actualMemberships.map(async (membership) => {
            const response = await getOrganization(token, membership.organizationId);

            return {
              ...response.data,
              membershipStatus: membership.status,
              membershipId: membership.membershipId,
            } as DashboardOrganization;
          }),
        );

        const loadedOrganizations = orgResults
          .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));

        const filteredOrganizations = statusFilter
          ? loadedOrganizations.filter((org) => org.status === statusFilter)
          : loadedOrganizations;

        setOrganizations(filteredOrganizations);

        const failedCount = orgResults.filter((result) => result.status === 'rejected').length;
        if (failedCount > 0) {
          setError(`Не удалось загрузить ${failedCount} организаций`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить организации');
      } finally {
        setLoading(false);
      }
    };

    void loadOrganizations();
  }, [statusFilter, token]);

  const handleDeactivate = async (orgId: string) => {
    if (!confirm('Точно деактивировать организацию?')) return

    try {
      await deleteOrganization(keycloak.token!, orgId)

      // обновляем UI
      setOrganizations(prev =>
        prev.map(org =>
          org.id === orgId
            ? { ...org, status: 'archived' }
            : org
        )
      )
    } catch (err) {
      alert('Ошибка при деактивации организации')
    }
  }

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
        <h2 className="text-xl font-semibold text-slate-900">Мои организации</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          {statusOptions.map(status => (
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

        {error && (
          <div className="mt-3">
            <Alert tone="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {loading && <p className="mt-3 text-slate-600">Загружаем данные</p>}

        {!loading && !error && organizations.length === 0 && (
          <p className="mt-3 text-slate-600">Организаций пока нет</p>
        )}

        {!loading && !error && organizations.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            {organizations.map(org => (
              <div
                key={org.id}
                className="rounded-lg border border-slate-200 p-4 transition hover:border-sky-400 hover:bg-sky-50"
              >
                <p className="font-semibold text-slate-900">{org.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Статус: {org.status === 'active' ? 'Активна' : 'Деактивирована'}
                </p>
                <div className="mt-3 flex gap-3 items-center">
                  <Link
                    to={`/organizations/${org.id}`}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    Управление
                  </Link>

                  <Link
                    to={`/organizations/${org.id}/bookings`}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    Бронирования
                  </Link>

                  <Can permission="POLICIES_LIST">
                    <button
                      onClick={() => handleDeactivate(org.id)}
                      disabled={org.status !== 'active'}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Деактивировать
                    </button>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

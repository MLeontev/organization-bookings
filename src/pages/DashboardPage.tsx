import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import type { Organization } from '../api/organizationsApi';
import { getAllOrganizations, getDeactivatedOrganizations } from '../api/organizationsApi';
import keycloak from '../keycloak';

export function DashboardPage() {
  const statusOptions: Array<{ value: 'active' | 'archived' | ''; label: string }> = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'archived', label: 'Деактивированные' },
  ];

  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | ''>('');

  // Берём токен после инициализации Keycloak
  useEffect(() => {
    if (keycloak.token) {
      setToken(keycloak.token);
    }
  }, [keycloak.token]);

  // Загружаем организации при смене фильтра или когда есть токен
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!token) return;

      setLoading(true);
      setError('');

      try {
        let response;
        if (statusFilter === 'archived') {
          response = await getDeactivatedOrganizations(token);
        } else {
          response = await getAllOrganizations(token);
        }

        const orgs: Organization[] = Array.isArray(response.data) ? response.data : [];
        if (statusFilter && statusFilter !== 'archived') {
          // для фильтра "active", фильтруем, если нужно
          setOrganizations(orgs.filter(org => org.status === statusFilter));
        } else {
          setOrganizations(orgs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить организации');
      } finally {
        setLoading(false);
      }
    };

    void loadOrganizations();
  }, [statusFilter, token]);

  return (
    <div className="space-y-6">
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
                <div className="mt-3 flex gap-3">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
import { useState, useEffect } from 'react'
import { Alert } from '../../../components/Alert'
import { Can } from '../../../rbac/Can'
import {
  getBookingPolicy,
  updateBookingPolicy,
  type BookingPolicy,
} from '../../../api/organizationsApi'
import keycloak from '../../../keycloak';

export function BookingPoliciesTab({
  organizationId,
}: {
  organizationId: string
}) {
  const [policies, setPolicies] = useState<BookingPolicy | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

useEffect(() => {
  if (!keycloak.token) return;

  let mounted = true;
  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getBookingPolicy(keycloak.token!, organizationId)
      if (mounted) {
        setPolicies({
          id: res.data.id,
          organization_id: res.data.organization_id,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
          max_active_bookings_per_user: res.data.max_active_bookings_per_user,
          booking_window_days: res.data.booking_window_days,
          max_booking_duration_min: res.data.max_booking_duration_min,
        })
      }
    } catch (err) {
      if (mounted)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить политики')
    } finally {
      if (mounted) setLoading(false)
    }
  }
  void load()
  return () => { mounted = false }
}, [keycloak.token, organizationId])

  const handleSave = async () => {
    if (!policies) return
    setSaving(true)
    setError('')
    try {
      await updateBookingPolicy(keycloak.token!, organizationId, policies)
      alert('Политики успешно сохранены')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить политики')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Загружаем политики...</p>
  if (!policies) return <p className="text-sm text-slate-500">Политики не найдены</p>

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Политики бронирования</h3>
      {error && <Alert tone="error">{error}</Alert>}

      <Can
        permission="POLICIES_LIST"
        fallback={<Alert tone="info">Нет доступа к просмотру правил бронирования</Alert>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Максимальное количество бронирований
            </label>
            <input
              type="number"
              value={policies.max_active_bookings_per_user}
              onChange={(e) =>
                setPolicies({ ...policies, max_active_bookings_per_user: +e.target.value })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Насколько вперёд можно создавать бронирования (дни)
            </label>
            <input
              type="number"
              value={policies.booking_window_days}
              onChange={(e) =>
                setPolicies({ ...policies, booking_window_days: +e.target.value })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Максимальная длительность одного бронирования (минуты)
            </label>
            <input
              type="number"
              value={policies.max_booking_duration_min}
              onChange={(e) =>
                setPolicies({ ...policies, max_booking_duration_min: +e.target.value })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Проверка доступа на редактирование */}
          <Can permission="POLICIES_MANAGE">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-md bg-sky-600 px-4 py-2 text-white text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </Can>
        </div>
      </Can>
    </section>
  )
}
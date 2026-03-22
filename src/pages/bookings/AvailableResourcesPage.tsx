import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getAvailableResources, createBooking, type AvailableResource } from '../../api/bookingApi'

function resourceTypeLabel(type: string) {
  switch (type) {
    case 'meeting_room': return 'Переговорная'
    case 'workspace': return 'Рабочее место'
    case 'equipment': return 'Оборудование'
    default: return type
  }
}

export function AvailableResourcesPage() {
  const { organizationId = '' } = useParams()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resources, setResources] = useState<AvailableResource[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!from || !to) { setError('Укажите период'); return }
    if (new Date(from) >= new Date(to)) { setError('Начало должно быть раньше конца'); return }
    setLoading(true)
    setError('')
    setSuccess('')
    setResources(null)
    setSelected(new Set())
    try {
      const data = await getAvailableResources(
        organizationId,
        new Date(from).toISOString(),
        new Date(to).toISOString(),
      )
      setResources(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить ресурсы')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBook = async () => {
    if (selected.size === 0) { setError('Выберите хотя бы один ресурс'); return }
    setBooking(true)
    setError('')
    setSuccess('')
    try {
      const result = await createBooking({
        organizationId,
        resourceIds: Array.from(selected),
        startTime: new Date(from).toISOString(),
        endTime: new Date(to).toISOString(),
      })
      const count = result.bookings.length
      setSuccess(`Забронировано ${count} ${count === 1 ? 'ресурс' : count < 5 ? 'ресурса' : 'ресурсов'}`)
      setResources(prev => prev?.filter(r => !selected.has(r.id)) ?? null)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать бронирование')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/bookings`}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Назад к бронированиям
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Новое бронирование</h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Начало</label>
            <input
              type="datetime-local"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Конец</label>
            <input
              type="datetime-local"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void handleSearch()}
              disabled={loading}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Ищем...' : 'Найти свободные'}
            </button>
          </div>
        </div>

        {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
        {success && <div className="mt-3"><Alert tone="success">{success}</Alert></div>}

        {resources !== null && resources.length === 0 && (
          <p className="mt-4 text-slate-600">Свободных ресурсов на это время нет</p>
        )}

        {resources !== null && resources.length > 0 && (
          <>
            <p className="mt-4 text-sm text-slate-500">
              Найдено {resources.length} {resources.length === 1 ? 'ресурс' : resources.length < 5 ? 'ресурса' : 'ресурсов'}. Выберите нужные.
            </p>

            <div className="mt-3 space-y-2">
              {resources.map(resource => (
                <label
                  key={resource.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                    selected.has(resource.id)
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(resource.id)}
                    onChange={() => toggleSelect(resource.id)}
                    className="h-4 w-4 accent-sky-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{resource.name}</p>
                    <p className="text-sm text-slate-500">{resourceTypeLabel(resource.type)}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => void handleBook()}
                disabled={booking || selected.size === 0}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {booking ? 'Бронируем...' : `Забронировать${selected.size > 0 ? ` (${selected.size})` : ''}`}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Сбросить выбор
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

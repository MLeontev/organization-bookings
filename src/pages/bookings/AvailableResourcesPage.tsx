import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { getResourcesSchedule, createBooking, type ResourceSchedule } from '../../api/bookingApi'

function resourceTypeLabel(type: string) {
  switch (type) {
    case 'meeting_room': return 'Переговорная'
    case 'workspace': return 'Рабочее место'
    case 'equipment': return 'Оборудование'
    default: return type
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AvailableResourcesPage() {
  const { organizationId = '' } = useParams()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [schedule, setSchedule] = useState<ResourceSchedule[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const doSearch = async (fromStr: string, toStr: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setSchedule(null)
    setSelected(new Set())
    setExpandedId(null)
    try {
      const data = await getResourcesSchedule(organizationId, fromStr, toStr)
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!from || !to) { setError('Укажите период'); return }
    if (new Date(from) >= new Date(to)) { setError('Начало должно быть раньше конца'); return }
    await doSearch(from + ':00', to + ':00')
  }

  const handleQuickSearch = async (days: number) => {
    const fromDate = new Date()
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + days)
    const fromLocal = toLocalInput(fromDate)
    const toLocal = toLocalInput(toDate)
    setFrom(fromLocal)
    setTo(toLocal)
    await doSearch(fromLocal + ':00', toLocal + ':00')
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
    if (!from || !to) { setError('Укажите период для бронирования'); return }
    setBooking(true)
    setError('')
    setSuccess('')
    try {
      const result = await createBooking({
        organizationId,
        resourceIds: Array.from(selected),
        startTime: from + ':00',
        endTime: to + ':00',
      })
      const count = result.bookings.length
      setSuccess(`Забронировано ${count} ${count === 1 ? 'ресурс' : count < 5 ? 'ресурса' : 'ресурсов'}`)
      setSchedule(prev => prev?.map(r =>
        selected.has(r.id) ? { ...r, isAvailableForPeriod: false } : r
      ) ?? null)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать бронирование')
    } finally {
      setBooking(false)
    }
  }

  const available = schedule?.filter(r => r.isAvailableForPeriod) ?? []
  const busy = schedule?.filter(r => !r.isAvailableForPeriod) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/organizations/${organizationId}/bookings`}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Назад к бронированиям
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Расписание и бронирование</h2>

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
              {loading ? 'Загружаем...' : 'Показать'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-sm text-slate-500">Быстрый просмотр:</span>
          {[
            { label: 'Сегодня', days: 1 },
            { label: '3 дня', days: 3 },
            { label: '7 дней', days: 7 },
            { label: '14 дней', days: 14 },
          ].map(({ label, days }) => (
            <button
              key={days}
              onClick={() => void handleQuickSearch(days)}
              disabled={loading}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
        {success && <div className="mt-3"><Alert tone="success">{success}</Alert></div>}
      </section>

      {schedule !== null && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Свободны на весь период
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {available.length}
                </span>
              </h3>
              {selected.size > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Сбросить
                  </button>
                  <button
                    onClick={() => void handleBook()}
                    disabled={booking}
                    className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    {booking ? 'Бронируем...' : `Забронировать (${selected.size})`}
                  </button>
                </div>
              )}
            </div>

            {available.length === 0 && (
              <p className="text-sm text-slate-500">Нет свободных ресурсов на весь период</p>
            )}

            <div className="space-y-2">
              {available.map(resource => (
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
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Свободен
                  </span>
                </label>
              ))}
            </div>
          </section>

          {busy.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">
                Занят в течение периода
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {busy.length}
                </span>
              </h3>

              <div className="space-y-2">
                {busy.map(resource => (
                  <div key={resource.id} className="rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setExpandedId(prev => prev === resource.id ? null : resource.id)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{resource.name}</p>
                        <p className="text-sm text-slate-500">{resourceTypeLabel(resource.type)}</p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                        Занят
                      </span>
                      <span className="text-xs text-slate-400">
                        {expandedId === resource.id ? '▲' : '▼'}
                      </span>
                    </button>

                    {expandedId === resource.id && (
                      <div className="border-t border-slate-100 px-4 py-3">
                        {resource.busySlots.length === 0 ? (
                          <p className="text-xs text-slate-500">Нет данных о занятости</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="mb-2 text-xs font-medium text-slate-600">Занятые периоды:</p>
                            {resource.busySlots.map((slot, i) => (
                              <p key={i} className="text-xs text-slate-600">
                                {formatDate(slot.startTime)} — {formatDate(slot.endTime)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

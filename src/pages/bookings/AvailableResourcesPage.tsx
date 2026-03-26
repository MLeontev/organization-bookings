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

function localToUTC(dateStr: string) {
  const localDate = new Date(dateStr)
  return localDate.toISOString() // вернёт ISO в UTC
}

// Форматирование локальной даты для отображения
function formatDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Конвертируем Date в value для <input type="datetime-local">
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())

  const doSearch = async (fromStr: string, toStr: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setSchedule(null)
    setSelected(new Set())
    setExpandedCategories(new Set())
    setExpandedResources(new Set())
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

  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const toggleResource = (id: string) => {
    setExpandedResources(prev => {
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
        startTime: localToUTC(from),
        endTime: localToUTC(to),
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

  const groupByType = (resources: ResourceSchedule[]) => {
    return resources.reduce<Record<string, ResourceSchedule[]>>((acc, res) => {
      const type = res.type || 'other'
      if (!acc[type]) acc[type] = []
      acc[type].push(res)
      return acc
    }, {})
  }

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
            {[{ label: 'Сегодня', days: 1 }, { label: '3 дня', days: 3 }, { label: '7 дней', days: 7 }, { label: '14 дней', days: 14 }].map(({ label, days }) => (
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
              {/* Доступные ресурсы по категориям */}
              {Object.entries(groupByType(available)).map(([type, resources]) => (
                  <section key={type} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <button
                        type="button"
                        onClick={() => toggleCategory(type)}
                        className="flex w-full items-center justify-between rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <span>{resourceTypeLabel(type)}</span>
                      <span className="text-xs text-slate-500">{resources.length} ресурсов</span>
                    </button>
                    {expandedCategories.has(type) && (
                        <div className="mt-2 space-y-2">
                          {resources.map(resource => (
                              <label
                                  key={resource.id}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${selected.has(resource.id) ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <input
                                    type="checkbox"
                                    checked={selected.has(resource.id)}
                                    onChange={() => toggleSelect(resource.id)}
                                    className="h-4 w-4 accent-sky-600"
                                />
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Свободен</span>
                              </label>
                          ))}
                        </div>
                    )}
                  </section>
              ))}

              {/* Занятые ресурсы по категориям */}
              {Object.entries(groupByType(busy)).map(([type, resources]) => (
                  <section key={type} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <button
                        type="button"
                        onClick={() => toggleCategory(`busy-${type}`)}
                        className="flex w-full items-center justify-between rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <span>{resourceTypeLabel(type)} (занятые)</span>
                      <span className="text-xs text-slate-500">{resources.length} ресурсов</span>
                    </button>
                    {expandedCategories.has(`busy-${type}`) && (
                        <div className="mt-2 space-y-2">
                          {resources.map(resource => (
                              <div key={resource.id} className="rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => toggleResource(resource.id)}
                                    className="flex w-full items-center justify-between p-4 text-left"
                                >
                                  <div>
                                    <p className="font-medium text-slate-900">{resource.name}</p>
                                    <p className="text-xs text-slate-500">{resourceTypeLabel(resource.type)}</p>
                                  </div>
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">Занят</span>
                                  <span className="text-xs text-slate-400">{expandedResources.has(resource.id) ? '▲' : '▼'}</span>
                                </button>
                                {expandedResources.has(resource.id) && (
                                    <div className="border-t border-slate-100 px-4 py-3 space-y-1">
                                      {resource.busySlots.length === 0 ? (
                                          <p className="text-xs text-slate-500">Нет данных о занятости</p>
                                      ) : resource.busySlots.map((slot, i) => (
                                          <p key={i} className="text-xs text-slate-600">
                                            {formatDate(new Date(slot.startTime))} — {formatDate(new Date(slot.endTime))}
                                          </p>
                                      ))}
                                    </div>
                                )}
                              </div>
                          ))}
                        </div>
                    )}
                  </section>
              ))}

              {/* Кнопка бронирования */}
              {selected.size > 0 && (
                  <div className="flex justify-end gap-3">
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
            </>
        )}
      </div>
  )
}
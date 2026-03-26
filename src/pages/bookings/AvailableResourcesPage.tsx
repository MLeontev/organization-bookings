import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ResourceTimelineRow } from './components/ResourceTimelineRow'
import { BookingModal } from './components/BookingModal'

import {
  getResourcesSchedule,
  createBooking,
  type ResourceSchedule,
} from '../../api/bookingApi'

import {
  getResources,
  type ResourceItem
} from '../../api/resourceApi'

// категории
const typeMap: Record<string, string> = {
  all: 'Все',
  meeting_room: 'Переговорные',
  workplace: 'Рабочие места',
  equipment: 'Оборудование',
  office: 'Офисы',
}

export function AvailableResourcesPage() {
  const { organizationId = '' } = useParams()

  const [fromView, setFromView] = useState<Date | null>(null)
  const [toView, setToView] = useState<Date | null>(null)
  const [schedule, setSchedule] = useState<ResourceSchedule[] | null>(null)

  const [resourcesMap, setResourcesMap] = useState<Record<string, ResourceItem>>({})
  const [types, setTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState('all')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [booking, setBooking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // загрузка ресурсов
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getResources(organizationId)
        const uniqueTypes = Array.from(new Set(res.map(r => r.type)))
        setTypes(['all', ...uniqueTypes])

        const map: Record<string, ResourceItem> = {}
        res.forEach(r => (map[r.id] = r))
        setResourcesMap(map)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [organizationId])

  const doSearch = async (from: Date, to: Date) => {
    if (!from || !to) return
    setLoading(true)
    setError('')
    setSchedule(null)
    setSelected(new Set())

    try {
      const data = await getResourcesSchedule(
          organizationId,
          from.toISOString(),
          to.toISOString()
      )
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickView = (days: number) => {
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + days)
    setFromView(now)
    setToView(future)
    void doSearch(now, future)
  }

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : null
    if (field === 'from') setFromView(date)
    else setToView(date)

    if (date && fromView && toView) {
      void doSearch(field === 'from' ? date : fromView, field === 'to' ? date : toView)
    } else if (fromView && toView) {
      void doSearch(fromView, toView)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleModalConfirm = async (start: Date, end: Date) => {
    if (selected.size === 0) {
      setError('Выберите ресурсы')
      return
    }

    setBooking(true)
    setError('')
    setSuccess('')
    setModalOpen(false)

    try {
      const result = await createBooking({
        organizationId,
        resourceIds: Array.from(selected),
        startTime: start,
        endTime: end,
      })

      setSuccess(
          `Забронировано ${result.bookings.length} ${
              result.bookings.length === 1 ? 'ресурс' : 'ресурсов'
          }`
      )

      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка бронирования')
    } finally {
      setBooking(false)
    }
  }

  const filtered =
      selectedType === 'all'
          ? schedule
          : schedule?.filter(r => r.type === selectedType)

  return (
      <div className="space-y-6">

        {/* Навигация */}
        <Link
            to={`/organizations/${organizationId}/bookings`}
            className="text-sm font-medium text-sky-700 hover:underline"
        >
          ← Назад к бронированиям
        </Link>

        {/* Фильтры */}
        <section className="rounded-2xl bg-white/90 p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Просмотр ресурсов</h2>

          {/* быстрые кнопки периодов */}
          <div className="flex flex-wrap gap-2">
            {[1, 3, 7, 14].map(d => (
                <button
                    key={d}
                    onClick={() => handleQuickView(d)}
                    className="rounded-full border border-gray-300 bg-white px-4 py-1 text-sm text-slate-700 hover:bg-gray-50 transition-shadow shadow-sm"
                >
                  {d} дн
                </button>
            ))}
          </div>

          {/* календарик и кнопка сброса */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">С:</label>
              <input
                  type="date"
                  value={fromView ? fromView.toISOString().split('T')[0] : ''}
                  onChange={e => handleDateChange('from', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <label className="text-sm font-medium">По:</label>
              <input
                  type="date"
                  value={toView ? toView.toISOString().split('T')[0] : ''}
                  onChange={e => handleDateChange('to', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>

          </div>

          {/* фильтр по типу */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium">Категория:</span>
            <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {types.map(t => (
                  <option key={t} value={t}>
                    {typeMap[t] || t}
                  </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-slate-700 hover:bg-gray-50 transition-shadow shadow-sm"
            >
              Сбросить выбор ресурсов
            </button>
            {/* Кнопка бронирования */}
            <div className="flex justify-end">
              <button
                  onClick={() => setModalOpen(true)}
                  disabled={selected.size === 0 || booking}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
              >
                {booking && (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {booking ? 'Бронируем...' : 'Забронировать'}
              </button>
            </div>
          </div>


          {loading && <div className="text-sm text-slate-500 mt-1">Загрузка...</div>}
        </section>

        {/* уведомления */}
        <div className="space-y-2">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
        </div>


        {/* Таймлайн */}
        {filtered && fromView && toView && (
            <section className="rounded-2xl bg-white/95 p-5 shadow-sm space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Расписание ресурсов
              </h3>

              {filtered.map(r => {
                const res = resourcesMap[r.id]

                return (
                    <div key={r.id} className="space-y-1">

                      {/* Инфа о ресурсе */}
                      {res && (
                          <div className="text-xs text-slate-500 px-1">
                            <span className="font-medium">{res.name}</span> • {res.type}
                            {res.officeAddress && ` • ${res.officeAddress}`}
                            {res.floor !== null && ` • этаж ${res.floor}`}
                            {res.description && ` • ${res.description}`}
                            {res.status && ` • Статус: ${res.status}`}
                          </div>
                      )}

                      <ResourceTimelineRow
                          resource={res}
                          name={r.name}
                          slots={r.busySlots.map(s => ({
                            start: s.startTimeLocal!,
                            end: s.endTimeLocal!,
                          }))}
                          selected={selected.has(r.id)}
                          onClick={() => toggleSelect(r.id)}
                          from={fromView}
                          to={toView}
                      />
                    </div>
                )
              })}
            </section>
        )}

        <BookingModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleModalConfirm}
        />
      </div>
  )
}
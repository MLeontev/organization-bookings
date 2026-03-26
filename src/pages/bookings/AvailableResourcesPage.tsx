import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/Alert'
import { ResourceTimelineRow } from './components/ResourceTimelineRow.tsx'
import { BookingModal } from './components/BookingModal.tsx'
import {
  getResourcesSchedule,
  createBooking,
  type ResourceSchedule,
} from '../../api/bookingApi'
import { getResources } from '../../api/resourceApi'

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Русские категории
const typeMap: Record<string, string> = {
  all: 'Все',
  meeting_room: 'Переговорные',
  workplace: 'Рабочие места',
  equipment: 'Оборудование',
  office: 'Офисы',
}

export function AvailableResourcesPage() {
  const { organizationId = '' } = useParams()

  // Таймлайн и фильтры
  const [fromView, setFromView] = useState<Date | null>(null)
  const [toView, setToView] = useState<Date | null>(null)
  const [schedule, setSchedule] = useState<ResourceSchedule[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [types, setTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState('all')

  // Бронирование
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [booking, setBooking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Уведомления
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Загрузка уникальных типов ресурсов
  useEffect(() => {
    const fetchResourceTypes = async () => {
      try {
        const res = await getResources(organizationId)
        const uniqueTypes = Array.from(new Set(res.map(r => r.type)))
        setTypes(['all', ...uniqueTypes])
      } catch (err) {
        console.error(err)
      }
    }
    fetchResourceTypes()
  }, [organizationId])

  const doSearch = async (fromStr: string, toStr: string) => {
    setLoading(true)
    setError('')
    setSchedule(null)
    setSelected(new Set())

    try {
      const data = await getResourcesSchedule(organizationId, fromStr, toStr)
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание')
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
    void doSearch(toLocalInput(now) + ':00', toLocalInput(future) + ':00')
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
      setError('Выберите ресурсы для бронирования')
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
        startTime: start, // Date
        endTime: end,     // Date
      })

      setSuccess(
          `Забронировано ${result.bookings.length} ${
              result.bookings.length === 1
                  ? 'ресурс'
                  : result.bookings.length < 5
                      ? 'ресурса'
                      : 'ресурсов'
          }`
      )
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка бронирования')
    } finally {
      setBooking(false)
    }
  }

  const defaultPeriods = [1, 3, 7, 14, 30]
  const filteredSchedule = selectedType === 'all' ? schedule : schedule?.filter(r => r.type === selectedType)

  return (
      <div className="space-y-6">
        <Link to={`/organizations/${organizationId}/bookings`} className="text-sm font-medium text-sky-700 hover:underline">
          ← Назад к бронированиям
        </Link>

        {/* Просмотр ресурсов */}
        <section className="rounded-2xl bg-white/95 p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Просмотр ресурсов</h2>

          <div className="flex flex-wrap gap-2">
            {defaultPeriods.map(d => (
                <button
                    key={d}
                    onClick={() => handleQuickView(d)}
                    className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-sm text-slate-700 hover:bg-sky-50 hover:border-sky-300 transition"
                >
                  {d} дн
                </button>
            ))}
          </div>

          {types.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <label className="font-medium text-slate-700">Категория:</label>
                <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="border border-slate-300 rounded-md px-2 py-1 text-slate-700 shadow-sm hover:border-sky-300 transition"
                >
                  {types.map(t => (
                      <option key={t} value={t}>{typeMap[t] || t}</option>
                  ))}
                </select>
              </div>
          )}

          {loading && <div className="text-sm text-slate-500 mt-2">Загружаем расписание...</div>}
          {error && <Alert tone="error">{error}</Alert>}
        </section>

        {/* Таймлайн */}
        {filteredSchedule && fromView && toView && (
            <section className="rounded-2xl bg-white/95 p-5 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Расписание ресурсов</h3>
              <div className="space-y-3">
                {filteredSchedule.map(resource => (
                    <ResourceTimelineRow
                        key={resource.id}
                        name={resource.name}
                        slots={resource.busySlots.map(s => ({
                          start: s.startTimeLocal,
                          end: s.endTimeLocal,
                        }))}
                        selected={selected.has(resource.id)}
                        onClick={() => toggleSelect(resource.id)}
                        from={fromView}
                        to={toView}
                    />
                ))}
              </div>
            </section>
        )}

        {/* Бронирование */}
        <section className="rounded-2xl bg-white/95 p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Бронирование ресурсов</h2>
          <div className="flex flex-wrap gap-3">
            <button
                onClick={() => setModalOpen(true)}
                disabled={selected.size === 0 || booking}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50 transition"
            >
              {booking ? 'Бронируем...' : 'Открыть модалку бронирования'}
            </button>
          </div>
          {success && <Alert tone="success">{success}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
        </section>

        {/* Модальное окно */}
        <BookingModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleModalConfirm}
        />
      </div>
  )
}
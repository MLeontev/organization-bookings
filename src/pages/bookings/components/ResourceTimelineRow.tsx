import { useState } from 'react'
import { type ResourceItem } from '../../../api/resourceApi'

type Slot = { start: Date; end: Date }

type Props = {
    resource?: ResourceItem
    name: string
    slots: Slot[]
    selected: boolean
    onClick: () => void
    from: Date
    to: Date
}

const typeMap: Record<string, string> = {
    meeting_room: 'Переговорная',
    workplace: 'Рабочее место',
    equipment: 'Оборудование',
    office: 'Офис',
}

const statusMap: Record<string, string> = {
    available: 'Доступен',
    temporarily_unavailable: 'Временно недоступен',
    out_of_service: 'Вне сервиса',
}

export function ResourceTimelineRow({
                                        resource,
                                        name,
                                        slots,
                                        selected,
                                        onClick,
                                        from,
                                        to,
                                    }: Props) {
    const total = to.getTime() - from.getTime()
    const [hover, setHover] = useState<Slot | null>(null)

    const formatDateTime = (d: Date) =>
        `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1)
            .toString()
            .padStart(2, '0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes()
            .toString()
            .padStart(2,'0')}`

    // генерируем сетку каждые 30 минут
    const ticks: Date[] = []
    const tickInterval = 30 * 60 * 1000 // 30 минут
    for (let t = from.getTime(); t <= to.getTime(); t += tickInterval) {
        ticks.push(new Date(t))
    }

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border p-4 transition cursor-pointer shadow-sm ${
                selected ? 'bg-sky-50 border-sky-400' : 'bg-white hover:border-slate-300'
            }`}
        >
            {/* Верхняя инфа */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-semibold text-slate-900">{name}</div>
                    {resource && (
                        <div className="text-xs text-slate-500 mt-1">
                            {typeMap[resource.type] || resource.type}
                            {resource.officeAddress && ` • ${resource.officeAddress}`}
                            {resource.floor !== null && ` • этаж ${resource.floor}`}
                        </div>
                    )}
                </div>
                {resource && (
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            resource.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : resource.status === 'temporarily_unavailable'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                        {statusMap[resource.status] || resource.status}
                    </span>
                )}
            </div>

            {/* описание */}
            {resource?.description && (
                <div className="text-xs text-slate-500 mb-2 line-clamp-2">{resource.description}</div>
            )}

            {/* правила */}
            {resource?.bookingRules && (
                <div className="text-xs text-slate-500 mb-2">
                    Макс: {resource.bookingRules.maxDurationHours} ч • Роли:{' '}
                    {resource.bookingRules.allowedRoles.join(', ')}
                </div>
            )}

            {/* Таймлайн */}
            <div className="relative h-10 bg-slate-200 rounded overflow-visible">
                {/* сетка */}
                {ticks.map((tick, i) => {
                    const left = ((tick.getTime() - from.getTime()) / total) * 100
                    return (
                        <div
                            key={i}
                            className="absolute top-0 h-full w-px bg-slate-300/50"
                            style={{ left: `${left}%` }}
                        />
                    )
                })}

                {/* занятые слоты */}
                {slots.map((s, i) => {
                    let start = ((s.start.getTime() - from.getTime()) / total) * 100
                    let end = ((s.end.getTime() - from.getTime()) / total) * 100

                    if (start < 0) start = 0
                    if (end > 100) end = 100

                    const width = end - start
                    if (width <= 0) return null

                    return (
                        <div
                            key={i}
                            className="absolute h-full bg-red-400/80 hover:bg-red-500 transition pointer-events-auto"
                            style={{ left: `${start}%`, width: `${width}%` }}
                            onMouseEnter={() => setHover(s)}
                            onMouseLeave={() => setHover(null)}
                        />
                    )
                })}

                {/* Tooltip */}
                {hover && (
                    <div
                        className="absolute z-30 text-xs bg-black text-white px-2 py-1 rounded shadow pointer-events-none"
                        style={{
                            left: `${((hover.start.getTime() - from.getTime()) / total +
                                (hover.end.getTime() - hover.start.getTime()) / (2 * total)) * 100}%`,
                            transform: 'translateX(-50%)',
                            top: '-28px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {formatDateTime(hover.start)} — {formatDateTime(hover.end)}
                    </div>
                )}
            </div>
        </div>
    )
}
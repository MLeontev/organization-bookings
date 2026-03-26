import { useState } from 'react'

type Slot = { start: Date; end: Date }

type RowProps = {
    name: string
    slots: Slot[]
    selected: boolean
    onClick: () => void
    from: Date
    to: Date
    tickCount?: number
}

export function ResourceTimelineRow({
                                        name,
                                        slots,
                                        selected,
                                        onClick,
                                        from,
                                        to,
                                        tickCount = 10,
                                    }: RowProps) {
    const totalMs = to.getTime() - from.getTime()
    const [hoveredSlot, setHoveredSlot] = useState<Slot | null>(null)

    // Генерация насечек
    const ticks: { left: number; label: string }[] = []
    for (let i = 0; i <= tickCount; i++) {
        const currentMs = from.getTime() + (totalMs * i) / tickCount
        const tickTime = new Date(currentMs)
        const left = (i / tickCount) * 100
        const label = `${tickTime.getDate().toString().padStart(2,'0')}.${
            (tickTime.getMonth()+1).toString().padStart(2,'0')
        } ${tickTime.getHours().toString().padStart(2,'0')}:00`
        ticks.push({ left, label })
    }

    // Форматирование для tooltip
    const format = (d: Date) =>
        `${d.getDate().toString().padStart(2,'0')}.${
            (d.getMonth()+1).toString().padStart(2,'0')
        } ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`

    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer rounded-lg border p-3 transition ${
                selected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
            {/* Заголовок */}
            <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-900">{name}</span>
                {selected && <span className="text-xs text-sky-600">выбрано</span>}
            </div>

            {/* Таймлайн */}
            <div className="relative h-12 bg-slate-100 rounded">
                {/* Насечки */}
                {ticks.map((tick, i) => {
                    const isMajor = i % 3 === 0 || i === 0 || i === ticks.length - 1
                    let translateX = '-50%'
                    if (i === 0) translateX = '0'
                    if (i === ticks.length - 1) translateX = '-100%'

                    return (
                        <div key={i} className="absolute top-0 h-full" style={{ left: `${tick.left}%` }}>
                            <div className={`border-l ${isMajor ? 'h-6 border-slate-600' : 'h-3 border-slate-400'}`} />
                            {isMajor && (
                                <div
                                    className="absolute top-6 text-xs text-slate-700 whitespace-nowrap"
                                    style={{ left: `${tick.left}%`, transform: `translateX(${translateX})` }}
                                >
                                    {tick.label}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Слоты */}
                {slots.map((slot, i) => {
                    let slotStartPercent = ((slot.start.getTime() - from.getTime()) / totalMs) * 100
                    let slotEndPercent = ((slot.end.getTime() - from.getTime()) / totalMs) * 100

                    if (slotStartPercent < 0) slotStartPercent = 0
                    if (slotEndPercent > 100) slotEndPercent = 100

                    const slotWidthPercent = slotEndPercent - slotStartPercent
                    if (slotWidthPercent <= 0) return null

                    return (
                        <div
                            key={i}
                            className="absolute top-0 h-full rounded bg-red-400"
                            style={{ left: `${slotStartPercent}%`, width: `${slotWidthPercent}%` }}
                            onMouseEnter={() => setHoveredSlot(slot)}
                            onMouseLeave={() => setHoveredSlot(null)}
                        />
                    )
                })}

                {/* Tooltip */}
                {hoveredSlot && (
                    <div
                        className="absolute z-20 rounded bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap"
                        style={{
                            left: `${Math.min(
                                100,
                                ((hoveredSlot.start.getTime() - from.getTime()) / totalMs +
                                    (hoveredSlot.end.getTime() - hoveredSlot.start.getTime()) / (2 * totalMs)) *
                                100
                            )}%`,
                            transform: 'translateX(-50%)',
                            bottom: '100%',
                            marginBottom: '4px',
                        }}
                    >
                        {format(hoveredSlot.start)} — {format(hoveredSlot.end)}
                    </div>
                )}
            </div>
        </div>
    )
}
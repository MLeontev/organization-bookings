import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Alert } from '../../../components/Alert'

type BookingModalProps = {
    open: boolean
    onClose: () => void
    onConfirm: (start: Date, end: Date) => void
}

export function BookingModal({ open, onClose, onConfirm }: BookingModalProps) {
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [error, setError] = useState('')

    const handleConfirm = () => {
        if (!startTime || !endTime) {
            setError('Выберите дату и время начала и конца')
            return
        }

        const start = new Date(startTime)
        const end = new Date(endTime)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setError('Неверное время')
            return
        }

        if (end <= start) {
            setError('Время окончания должно быть позже начала')
            return
        }

        onConfirm(start, end)
        setError('')
    }

    return (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <Dialog.Panel className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-lg">
                <Dialog.Title className="text-lg font-semibold">Бронирование ресурса</Dialog.Title>

                {/* Выбор даты и времени начала */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Начало</label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="border border-slate-300 rounded-md px-3 py-2 shadow-sm focus:ring-1 focus:ring-sky-300"
                    />
                </div>

                {/* Выбор даты и времени конца */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Конец</label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="border border-slate-300 rounded-md px-3 py-2 shadow-sm focus:ring-1 focus:ring-sky-300"
                    />
                </div>

                {error && <Alert tone="error">{error}</Alert>}

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
                    >
                        Забронировать
                    </button>
                </div>
            </Dialog.Panel>
        </Dialog>
    )
}
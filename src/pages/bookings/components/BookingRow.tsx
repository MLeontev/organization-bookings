import { Link } from 'react-router-dom'
import type { BookingGroup } from '../../../api/bookingApi'

type DisplayStatus = 'active' | 'expired' | 'cancelled'

function getDisplayStatus(booking: BookingGroup): DisplayStatus {
    if (booking.status === 'Cancelled') return 'cancelled'
    if (booking.endTimeLocal < new Date()) return 'expired'
    return 'active'
}

function formatDate(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const STATUS_LABELS: Record<DisplayStatus, string> = {
    active: 'Активное',
    expired: 'Завершено',
    cancelled: 'Отменено',
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-blue-100 text-blue-600',
    cancelled: 'bg-slate-100 text-slate-500',
}

type Props = {
    booking: BookingGroup
    organizationId: string

    // опционально
    onCancel?: (bookingId: string) => void
    cancelling?: boolean
}

export function BookingRow({
                               booking,
                               organizationId,
                               onCancel,
                               cancelling,
                           }: Props) {
    const ds = getDisplayStatus(booking)

    return (
        <Link
            to={`/organizations/${organizationId}/bookings/${booking.id}`}
            className={`flex items-center justify-between rounded-lg border p-4 transition hover:border-sky-300 hover:bg-sky-50 ${
                ds === 'active'
                    ? 'border-slate-200'
                    : 'border-slate-100 bg-slate-50 opacity-70'
            }`}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ds]}`}
                >
                    {STATUS_LABELS[ds]}
                </span>

                <span className="text-sm text-slate-700">
                    {formatDate(booking.startTimeLocal)} — {formatDate(booking.endTimeLocal)}
                </span>

                <span className="text-sm text-slate-400">
                    {booking.bookings.length}{' '}
                    {booking.bookings.length === 1
                        ? 'ресурс'
                        : booking.bookings.length < 5
                            ? 'ресурса'
                            : 'ресурсов'}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {ds === 'active' && onCancel && (
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onCancel(booking.id)
                        }}
                        disabled={cancelling}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        {cancelling ? '...' : 'Отменить'}
                    </button>
                )}

                <span className="text-sm text-sky-600">Подробнее →</span>
            </div>
        </Link>
    )
}
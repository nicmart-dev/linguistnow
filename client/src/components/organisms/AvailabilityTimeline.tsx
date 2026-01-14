import React from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, startOfDay, addDays } from 'date-fns'

interface FreeSlot {
    start: string
    end: string
}

interface AvailabilityTimelineProps {
    freeSlots: FreeSlot[]
    startDate: string // ISO date string
    endDate: string // ISO date string
    timezone?: string
}

const AvailabilityTimeline: React.FC<AvailabilityTimelineProps> = ({
    freeSlots,
    startDate,
    endDate,
}) => {
    const { t } = useTranslation()

    // Generate all days in the range
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const days: Date[] = []
    let currentDay = startOfDay(start)
    while (currentDay <= end) {
        days.push(new Date(currentDay))
        currentDay = addDays(currentDay, 1)
    }

    // Group free slots by day
    const slotsByDay = new Map<string, FreeSlot[]>()
    freeSlots.forEach((slot) => {
        const slotStart = parseISO(slot.start)
        const dayKey = format(slotStart, 'yyyy-MM-dd')
        if (!slotsByDay.has(dayKey)) {
            slotsByDay.set(dayKey, [])
        }
        const existingSlots = slotsByDay.get(dayKey)
        if (existingSlots) {
            existingSlots.push(slot)
        }
    })

    // Calculate total hours for a day
    const calculateDayHours = (daySlots: FreeSlot[]): number => {
        return daySlots.reduce((total, slot) => {
            const start = parseISO(slot.start)
            const end = parseISO(slot.end)
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            return total + hours
        }, 0)
    }

    // Format time for display
    const formatTime = (date: Date): string => {
        return format(date, 'HH:mm')
    }

    return (
        <div className="w-full">
            <h4 className="text-sm font-semibold mb-2">
                {t('dashboard.availabilityTimeline.title')}
            </h4>
            <div className="space-y-2">
                {days.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const daySlots = slotsByDay.get(dayKey) || []
                    const totalHours = calculateDayHours(daySlots)

                    return (
                        <div
                            key={dayKey}
                            className="border rounded-md p-2 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                    {format(day, 'EEEE, MMM d', {
                                        // Use locale if available
                                    })}
                                </span>
                                {totalHours > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {totalHours.toFixed(1)}h{' '}
                                        {t(
                                            'dashboard.availabilityTimeline.free'
                                        )}
                                    </span>
                                )}
                            </div>
                            {daySlots.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {daySlots.map((slot, index) => {
                                        const slotStart = parseISO(slot.start)
                                        const slotEnd = parseISO(slot.end)
                                        return (
                                            <div
                                                key={index}
                                                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                                title={`${formatTime(slotStart)} - ${formatTime(slotEnd)}`}
                                            >
                                                {formatTime(slotStart)} -{' '}
                                                {formatTime(slotEnd)}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400">
                                    {t(
                                        'dashboard.availabilityTimeline.noFreeSlots'
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default AvailabilityTimeline

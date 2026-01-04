/**
 * Date preset utilities for DateRangePicker
 * Extracted for testability
 */

export interface DateRange {
    from: Date
    to: Date | undefined
}

export interface Preset {
    name: string
    labelKey: string
}

export const PRESETS: Preset[] = [
    { name: 'next7', labelKey: 'dashboard.dateRange.presets.next7' },
    { name: 'next14', labelKey: 'dashboard.dateRange.presets.next14' },
    { name: 'next30', labelKey: 'dashboard.dateRange.presets.next30' },
    { name: 'nextWeek', labelKey: 'dashboard.dateRange.presets.nextWeek' },
    { name: 'nextMonth', labelKey: 'dashboard.dateRange.presets.nextMonth' },
]

/**
 * Calculate the date range for a given preset
 * @param presetName - Name of the preset (next7, next14, next30, nextWeek, nextMonth)
 * @param weekStartsOn - 0 for Sunday, 1 for Monday
 * @param referenceDate - Optional reference date for testing (defaults to today)
 * @returns DateRange with from and to dates
 */
export function getPresetRange(
    presetName: string,
    weekStartsOn: 0 | 1 = 0,
    referenceDate?: Date
): DateRange {
    const preset = PRESETS.find(({ name }) => name === presetName)
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`)

    const today = referenceDate ? new Date(referenceDate) : new Date()
    today.setHours(0, 0, 0, 0)
    const from = new Date(today)
    const to = new Date(today)

    // Start from tomorrow (future dates only)
    from.setDate(from.getDate() + 1)

    switch (preset.name) {
        case 'next7':
            // Tomorrow to 7 days from today
            to.setDate(to.getDate() + 7)
            to.setHours(23, 59, 59, 999)
            break
        case 'next14':
            // Tomorrow to 14 days from today
            to.setDate(to.getDate() + 14)
            to.setHours(23, 59, 59, 999)
            break
        case 'next30':
            // Tomorrow to 30 days from today
            to.setDate(to.getDate() + 30)
            to.setHours(23, 59, 59, 999)
            break
        case 'nextWeek': {
            // Next week (respects weekStartsOn locale setting)
            const dayOfWeek = from.getDay()
            let daysUntilWeekStart: number

            if (weekStartsOn === 1) {
                // Monday start: calculate days until next Monday
                daysUntilWeekStart = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
            } else {
                // Sunday start: calculate days until next Sunday
                daysUntilWeekStart = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
            }

            from.setDate(from.getDate() + daysUntilWeekStart)
            to.setDate(from.getDate() + 6) // End of week (6 days after start)
            to.setHours(23, 59, 59, 999)
            break
        }
        case 'nextMonth': {
            // First day of next month to last day of next month
            from.setMonth(from.getMonth() + 1)
            from.setDate(1)
            to.setMonth(to.getMonth() + 2)
            to.setDate(0) // Last day of next month
            to.setHours(23, 59, 59, 999)
            break
        }
    }

    return { from, to }
}

/**
 * Parse a date string adjusted for timezone
 * @param dateInput - Date object or ISO date string (YYYY-MM-DD)
 * @returns Date object
 */
export function getDateAdjustedForTimezone(dateInput: Date | string): Date {
    if (typeof dateInput === 'string') {
        const parts = dateInput.split('-').map((part) => parseInt(part, 10))
        return new Date(parts[0], parts[1] - 1, parts[2])
    }
    return dateInput
}

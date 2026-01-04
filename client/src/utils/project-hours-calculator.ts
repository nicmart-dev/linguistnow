/**
 * Calculate estimated project hours based on date range
 * Assumes 8 hours per working day, excluding weekends (Saturday and Sunday)
 * This gives 40 hours per week (5 working days × 8 hours)
 *
 * @param startDate - Start date (ISO string YYYY-MM-DD or Date)
 * @param endDate - End date (ISO string YYYY-MM-DD or Date)
 * @returns Estimated hours based on 8h/day for working days only
 */
export function calculateEstimatedHours(
    startDate: string | Date | undefined,
    endDate: string | Date | undefined
): number | null {
    if (!startDate || !endDate) {
        return null
    }

    // Parse dates
    const start =
        typeof startDate === 'string'
            ? new Date(startDate + 'T00:00:00')
            : new Date(startDate)
    const end =
        typeof endDate === 'string'
            ? new Date(endDate + 'T23:59:59')
            : new Date(endDate)

    // Ensure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null
    }

    // Count working days (Monday-Friday, excluding weekends)
    let workingDays = 0
    const current = new Date(start)
    current.setHours(0, 0, 0, 0)
    const endDateOnly = new Date(end)
    endDateOnly.setHours(0, 0, 0, 0)

    // Iterate through each day in the range (inclusive)
    while (current <= endDateOnly) {
        const dayOfWeek = current.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Count only weekdays (Monday = 1 through Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workingDays++
        }
        // Move to next day
        current.setDate(current.getDate() + 1)
    }

    if (workingDays <= 0) {
        return null
    }

    // Calculate estimated hours: working days × 8 hours per day
    const estimatedHours = workingDays * 8

    return estimatedHours
}

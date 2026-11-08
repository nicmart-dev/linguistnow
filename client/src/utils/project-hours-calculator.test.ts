import { describe, it, expect } from 'vitest'
import { calculateEstimatedHours } from './project-hours-calculator'

describe('calculateEstimatedHours', () => {
    it('returns null when startDate or endDate is missing', () => {
        expect(calculateEstimatedHours(undefined, '2026-01-10')).toBeNull()
        expect(calculateEstimatedHours('2026-01-05', undefined)).toBeNull()
        expect(calculateEstimatedHours('', '2026-01-10')).toBeNull()
    })

    it('returns null for invalid dates', () => {
        expect(calculateEstimatedHours('not-a-date', '2026-01-10')).toBeNull()
        expect(
            calculateEstimatedHours('2026-01-05', new Date('invalid'))
        ).toBeNull()
    })

    it('returns null when the date range has no working days', () => {
        // Saturday Jan 3, 2026 to Sunday Jan 4, 2026
        expect(calculateEstimatedHours('2026-01-03', '2026-01-04')).toBeNull()
        // Reversed range
        expect(calculateEstimatedHours('2026-01-09', '2026-01-05')).toBeNull()
    })

    it('calculates 40 hours for a full Monday-Friday work week', () => {
        expect(calculateEstimatedHours('2026-01-05', '2026-01-09')).toBe(40)
    })

    it('excludes weekends when spanning multiple weeks', () => {
        // Thursday Jan 8 to Monday Jan 12 => Thu, Fri, Mon (3 working days)
        expect(calculateEstimatedHours('2026-01-08', '2026-01-12')).toBe(24)
    })

    it('supports Date object inputs and single-day weekday ranges', () => {
        expect(
            calculateEstimatedHours(
                new Date(2026, 0, 5, 14, 30),
                new Date(2026, 0, 5, 16, 0)
            )
        ).toBe(8)
    })
})

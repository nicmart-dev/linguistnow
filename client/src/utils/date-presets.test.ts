import { describe, it, expect } from 'vitest'
import {
    getPresetRange,
    getDateAdjustedForTimezone,
    PRESETS,
} from './date-presets'

describe('date-presets utilities', () => {
    describe('PRESETS', () => {
        it('should have 5 presets', () => {
            expect(PRESETS).toHaveLength(5)
        })

        it('should have correct preset names', () => {
            const names = PRESETS.map((p) => p.name)
            expect(names).toContain('next7')
            expect(names).toContain('next14')
            expect(names).toContain('next30')
            expect(names).toContain('nextWeek')
            expect(names).toContain('nextMonth')
        })

        it('should have i18n label keys for all presets', () => {
            PRESETS.forEach((preset) => {
                expect(preset.labelKey).toMatch(
                    /^dashboard\.dateRange\.presets\./
                )
            })
        })
    })

    describe('getPresetRange', () => {
        // Use a fixed reference date for consistent testing
        const referenceDate = new Date(2026, 0, 3) // Saturday, January 3, 2026

        describe('next7 preset', () => {
            it('should return range from tomorrow to 7 days from today', () => {
                const range = getPresetRange('next7', 0, referenceDate)

                // From: January 4, 2026 (tomorrow)
                expect(range.from.getFullYear()).toBe(2026)
                expect(range.from.getMonth()).toBe(0) // January
                expect(range.from.getDate()).toBe(4)

                // To: January 10, 2026 (7 days from today)
                expect(range.to?.getFullYear()).toBe(2026)
                expect(range.to?.getMonth()).toBe(0)
                expect(range.to?.getDate()).toBe(10)
            })
        })

        describe('next14 preset', () => {
            it('should return range from tomorrow to 14 days from today', () => {
                const range = getPresetRange('next14', 0, referenceDate)

                expect(range.from.getDate()).toBe(4) // Tomorrow
                expect(range.to?.getDate()).toBe(17) // 14 days from today
            })
        })

        describe('next30 preset', () => {
            it('should return range from tomorrow to 30 days from today', () => {
                const range = getPresetRange('next30', 0, referenceDate)

                expect(range.from.getDate()).toBe(4) // Tomorrow
                // 30 days from Jan 3 = Feb 2
                expect(range.to?.getMonth()).toBe(1) // February
                expect(range.to?.getDate()).toBe(2)
            })
        })

        describe('nextWeek preset with Sunday start (weekStartsOn=0)', () => {
            it('should return range for next full week starting Sunday', () => {
                // Reference: Saturday Jan 3, 2026
                // Tomorrow is Sunday Jan 4
                // Next Sunday after tomorrow would be Jan 11
                const range = getPresetRange('nextWeek', 0, referenceDate)

                // From: Sunday Jan 11, 2026 (next week starts)
                expect(range.from.getDay()).toBe(0) // Sunday
                expect(range.from.getDate()).toBe(11)

                // To: Saturday Jan 17, 2026 (end of that week)
                expect(range.to?.getDay()).toBe(6) // Saturday
                expect(range.to?.getDate()).toBe(17)
            })
        })

        describe('nextWeek preset with Monday start (weekStartsOn=1)', () => {
            it('should return range for next full week starting Monday', () => {
                // Reference: Saturday Jan 3, 2026
                // Tomorrow is Sunday Jan 4
                // Next Monday after tomorrow would be Jan 5
                const range = getPresetRange('nextWeek', 1, referenceDate)

                // From: Monday Jan 5, 2026
                expect(range.from.getDay()).toBe(1) // Monday
                expect(range.from.getDate()).toBe(5)

                // To: Sunday Jan 11, 2026 (end of that week)
                expect(range.to?.getDay()).toBe(0) // Sunday
                expect(range.to?.getDate()).toBe(11)
            })
        })

        describe('nextMonth preset', () => {
            it('should return range for the entire next month', () => {
                const range = getPresetRange('nextMonth', 0, referenceDate)

                // From: February 1, 2026
                expect(range.from.getMonth()).toBe(1) // February
                expect(range.from.getDate()).toBe(1)

                // To: February 28, 2026 (last day of February, non-leap year)
                expect(range.to?.getMonth()).toBe(1) // February
                expect(range.to?.getDate()).toBe(28)
            })

            it('should handle leap year correctly', () => {
                // February 2024 has 29 days (leap year)
                const leapYearRef = new Date(2024, 0, 15) // January 15, 2024
                const range = getPresetRange('nextMonth', 0, leapYearRef)

                // To: February 29, 2024
                expect(range.to?.getMonth()).toBe(1) // February
                expect(range.to?.getDate()).toBe(29)
            })
        })

        describe('error handling', () => {
            it('should throw error for unknown preset', () => {
                expect(() =>
                    getPresetRange('unknown', 0, referenceDate)
                ).toThrow('Unknown date range preset: unknown')
            })
        })

        describe('time handling', () => {
            it('should set from date to start of day', () => {
                const range = getPresetRange('next7', 0, referenceDate)

                expect(range.from.getHours()).toBe(0)
                expect(range.from.getMinutes()).toBe(0)
                expect(range.from.getSeconds()).toBe(0)
            })

            it('should set to date to end of day', () => {
                const range = getPresetRange('next7', 0, referenceDate)

                expect(range.to?.getHours()).toBe(23)
                expect(range.to?.getMinutes()).toBe(59)
                expect(range.to?.getSeconds()).toBe(59)
            })
        })
    })

    describe('getDateAdjustedForTimezone', () => {
        it('should parse ISO date string correctly', () => {
            const date = getDateAdjustedForTimezone('2026-01-15')

            expect(date.getFullYear()).toBe(2026)
            expect(date.getMonth()).toBe(0) // January (0-indexed)
            expect(date.getDate()).toBe(15)
        })

        it('should return Date object unchanged', () => {
            const input = new Date(2026, 5, 20) // June 20, 2026
            const result = getDateAdjustedForTimezone(input)

            expect(result).toBe(input)
        })

        it('should handle single-digit month and day', () => {
            const date = getDateAdjustedForTimezone('2026-03-05')

            expect(date.getMonth()).toBe(2) // March
            expect(date.getDate()).toBe(5)
        })

        it('should handle December correctly', () => {
            const date = getDateAdjustedForTimezone('2026-12-31')

            expect(date.getMonth()).toBe(11) // December (0-indexed)
            expect(date.getDate()).toBe(31)
        })
    })
})

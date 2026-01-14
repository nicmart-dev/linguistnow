import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateICS, generateMailtoLink } from './ics-generator'

describe('ics-generator', () => {
    describe('generateICS', () => {
        it('generates valid ICS header', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain('BEGIN:VCALENDAR')
            expect(ics).toContain('VERSION:2.0')
            expect(ics).toContain('PRODID:-//LinguistNow//Booking System//EN')
            expect(ics).toContain('CALSCALE:GREGORIAN')
            expect(ics).toContain('METHOD:REQUEST')
            expect(ics).toContain('END:VCALENDAR')
        })

        it('generates valid ICS event', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain('BEGIN:VEVENT')
            expect(ics).toContain('SUMMARY:Test Meeting')
            expect(ics).toContain('DTSTART:20260115T100000Z')
            expect(ics).toContain('DTEND:20260115T110000Z')
            expect(ics).toContain('STATUS:CONFIRMED')
            expect(ics).toContain('SEQUENCE:0')
            expect(ics).toContain('END:VEVENT')
        })

        it('includes UID with timestamp', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toMatch(/UID:\d+-\w+@linguistnow\.com/)
        })

        it('includes DTSTAMP', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/)
        })

        it('includes description when provided', () => {
            const event = {
                summary: 'Test Meeting',
                description: 'This is a test description',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain('DESCRIPTION:This is a test description')
        })

        it('includes location when provided', () => {
            const event = {
                summary: 'Test Meeting',
                location: 'Conference Room A',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain('LOCATION:Conference Room A')
        })

        it('includes organizer when provided', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
                organizer: {
                    name: 'John Doe',
                    email: 'john@example.com',
                },
            }

            const ics = generateICS(event)

            expect(ics).toContain(
                'ORGANIZER;CN=John Doe:mailto:john@example.com'
            )
        })

        it('includes attendees when provided', () => {
            const event = {
                summary: 'Test Meeting',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
                attendees: [
                    { name: 'Alice', email: 'alice@example.com' },
                    { name: 'Bob', email: 'bob@example.com' },
                ],
            }

            const ics = generateICS(event)

            expect(ics).toContain(
                'ATTENDEE;CN=Alice;RSVP=TRUE:mailto:alice@example.com'
            )
            expect(ics).toContain(
                'ATTENDEE;CN=Bob;RSVP=TRUE:mailto:bob@example.com'
            )
        })

        it('escapes special characters in summary', () => {
            const event = {
                summary: 'Meeting; with, special\\chars\nand newline',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain(
                'SUMMARY:Meeting\\; with\\, special\\\\chars\\nand newline'
            )
        })

        it('escapes special characters in description', () => {
            const event = {
                summary: 'Test',
                description: 'Line1\nLine2; with, specials',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain(
                'DESCRIPTION:Line1\\nLine2\\; with\\, specials'
            )
        })

        it('uses CRLF line endings', () => {
            const event = {
                summary: 'Test',
                start: new Date('2026-01-15T10:00:00Z'),
                end: new Date('2026-01-15T11:00:00Z'),
            }

            const ics = generateICS(event)

            expect(ics).toContain('\r\n')
        })
    })

    describe('generateMailtoLink', () => {
        let createElementSpy: ReturnType<typeof vi.spyOn>
        let createObjectURLSpy: ReturnType<typeof vi.spyOn>
        let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
        let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> }

        beforeEach(() => {
            mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
            }
            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLElement)
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLElement)
            createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
            revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('generates mailto link with encoded subject', () => {
            const icsContent = 'BEGIN:VCALENDAR...'
            const result = generateMailtoLink(
                'test@example.com',
                'Meeting Request',
                'Please join us',
                icsContent
            )

            expect(result).toContain('mailto:test@example.com')
            expect(result).toContain('subject=Meeting%20Request')
        })

        it('includes body with attachment note', () => {
            const icsContent = 'BEGIN:VCALENDAR...'
            const result = generateMailtoLink(
                'test@example.com',
                'Meeting',
                'Hello',
                icsContent
            )

            expect(result).toContain('body=')
            expect(decodeURIComponent(result)).toContain('Hello')
            expect(decodeURIComponent(result)).toContain('booking.ics')
        })

        it('uses custom attachment note when provided', () => {
            const icsContent = 'BEGIN:VCALENDAR...'
            const result = generateMailtoLink(
                'test@example.com',
                'Meeting',
                'Hello',
                icsContent,
                'Custom note about attachment'
            )

            expect(decodeURIComponent(result)).toContain(
                'Custom note about attachment'
            )
        })

        it('downloads ICS file', () => {
            const icsContent = 'BEGIN:VCALENDAR...'
            generateMailtoLink(
                'test@example.com',
                'Meeting',
                'Hello',
                icsContent
            )

            expect(createElementSpy).toHaveBeenCalledWith('a')
            expect(mockLink.download).toBe('booking.ics')
            expect(mockLink.click).toHaveBeenCalled()
            expect(createObjectURLSpy).toHaveBeenCalled()
            expect(revokeObjectURLSpy).toHaveBeenCalled()
        })
    })
})

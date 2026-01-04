/**
 * ICS (iCalendar) file generator
 * Generates standard ICS format calendar files for email attachments
 */

interface ICSEvent {
    summary: string
    description?: string
    start: Date
    end: Date
    location?: string
    organizer?: {
        name: string
        email: string
    }
    attendees?: Array<{
        name: string
        email: string
    }>
}

/**
 * Escape text for ICS format
 * ICS requires special characters to be escaped
 */
function escapeICS(text: string): string {
    return text
        .replace(/\\/g, '\\\\') // Backslash
        .replace(/;/g, '\\;') // Semicolon
        .replace(/,/g, '\\,') // Comma
        .replace(/\n/g, '\\n') // Newline
}

/**
 * Format date for ICS (UTC format)
 */
function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate ICS file content
 */
export function generateICS(event: ICSEvent): string {
    const lines: string[] = []

    // ICS header
    lines.push('BEGIN:VCALENDAR')
    lines.push('VERSION:2.0')
    lines.push('PRODID:-//LinguistNow//Booking System//EN')
    lines.push('CALSCALE:GREGORIAN')
    lines.push('METHOD:REQUEST')

    // Event
    lines.push('BEGIN:VEVENT')
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 11)
    lines.push(`UID:${String(timestamp)}-${randomStr}@linguistnow.com`)
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
    lines.push(`DTSTART:${formatICSDate(event.start)}`)
    lines.push(`DTEND:${formatICSDate(event.end)}`)
    lines.push(`SUMMARY:${escapeICS(event.summary)}`)

    if (event.description) {
        lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }

    if (event.location) {
        lines.push(`LOCATION:${escapeICS(event.location)}`)
    }

    if (event.organizer) {
        lines.push(
            `ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${event.organizer.email}`
        )
    }

    if (event.attendees && event.attendees.length > 0) {
        event.attendees.forEach((attendee) => {
            lines.push(
                `ATTENDEE;CN=${escapeICS(attendee.name)};RSVP=TRUE:mailto:${attendee.email}`
            )
        })
    }

    lines.push('STATUS:CONFIRMED')
    lines.push('SEQUENCE:0')
    lines.push('END:VEVENT')

    // ICS footer
    lines.push('END:VCALENDAR')

    return lines.join('\r\n')
}

/**
 * Download ICS file
 */
export function downloadICS(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Generate mailto link with ICS attachment
 * Note: mailto: doesn't support attachments directly, so we'll use a data URI approach
 * The ICS file will be downloaded, and user can attach it manually
 */
export function generateMailtoLink(
    to: string,
    subject: string,
    body: string,
    icsContent: string,
    attachmentNote?: string
): string {
    // Encode subject
    const encodedSubject = encodeURIComponent(subject)

    // Create mailto link
    // Note: We can't attach files via mailto, so we'll include instructions in the body
    const note =
        attachmentNote ??
        'Note: Please attach the calendar file (booking.ics) that will be downloaded.'
    const mailtoBody = `${body}\n\n---\n${note}`
    const mailto = `mailto:${to}?subject=${encodedSubject}&body=${encodeURIComponent(mailtoBody)}`

    // Download ICS file first
    downloadICS('booking.ics', icsContent)

    return mailto
}

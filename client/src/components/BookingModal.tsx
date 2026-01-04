import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from '../i18n'
import { parseISO, format, startOfDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './Input'
import { generateICS, generateMailtoLink } from '../utils/ics-generator'
import type { LinguistWithAvailability } from '@linguistnow/shared'

interface BookingModalProps {
    linguist: LinguistWithAvailability
    open: boolean
    onOpenChange: (open: boolean) => void
    pmEmail?: string
    pmName?: string
    startDate: string
    endDate: string
}

const BookingModal: React.FC<BookingModalProps> = ({
    linguist,
    open,
    onOpenChange,
    pmEmail,
    pmName,
    startDate,
    endDate,
}) => {
    const { t } = useTranslation()
    // Use English for email content regardless of PM's UI language
    const tEmail = i18next.getFixedT('en')
    const [projectName, setProjectName] = useState('')
    const [projectDescription, setProjectDescription] = useState('')

    const handleBook = () => {
        // Use the full availability window (start of first day to end of last day)
        const start = startOfDay(parseISO(startDate))
        const end = startOfDay(parseISO(endDate))
        // Set end to end of day (23:59:59)
        end.setHours(23, 59, 59, 999)

        // Generate ICS file
        const icsContent = generateICS({
            summary: projectName || tEmail('dashboard.booking.defaultTitle'),
            description: projectDescription || '',
            start: start,
            end: end,
            organizer:
                pmName && pmEmail
                    ? { name: pmName, email: pmEmail }
                    : undefined,
            attendees: [
                {
                    name: linguist.name,
                    email: linguist.email,
                },
            ],
        })

        // Generate email body (always in English)
        // Use startOfDay to ensure dates are displayed without time
        const startDateForDisplay = startOfDay(parseISO(startDate))
        const endDateForDisplay = startOfDay(parseISO(endDate))
        const emailBody = tEmail('dashboard.booking.emailBody', {
            linguistName: linguist.name,
            projectName:
                projectName || tEmail('dashboard.booking.defaultTitle'),
            startDate: format(startDateForDisplay, 'PPP', { locale: enUS }),
            endDate: format(endDateForDisplay, 'PPP', { locale: enUS }),
            description: projectDescription || '',
        })

        // Generate mailto link and download ICS
        const mailtoLink = generateMailtoLink(
            linguist.email,
            tEmail('dashboard.booking.emailSubject', {
                projectName:
                    projectName || tEmail('dashboard.booking.defaultTitle'),
            }),
            emailBody,
            icsContent,
            tEmail('dashboard.booking.attachmentNote')
        )

        // Open email client in new tab
        window.open(mailtoLink, '_blank')

        // Close modal
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {t('dashboard.booking.title', { name: linguist.name })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('dashboard.booking.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Availability Window Display */}
                    <div className="p-4 bg-gray-50 rounded-md border">
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.booking.availabilityWindow')}
                        </label>
                        <p className="text-sm text-gray-700">
                            {format(startOfDay(parseISO(startDate)), 'PPP')} -{' '}
                            {format(startOfDay(parseISO(endDate)), 'PPP')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('dashboard.booking.availabilityWindowNote')}
                        </p>
                    </div>

                    {/* Email Preview with Editable Sections */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t(
                                'dashboard.booking.emailPreview',
                                'Email Preview'
                            )}
                        </label>
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            {/* Email Subject */}
                            <div className="mb-4 pb-3 border-b border-gray-300">
                                <span className="text-xs font-medium text-gray-500 block mb-1">
                                    {t(
                                        'dashboard.booking.emailSubjectLabel',
                                        'Subject:'
                                    )}
                                </span>
                                <span className="text-sm text-gray-700">
                                    {tEmail('dashboard.booking.emailSubject', {
                                        projectName:
                                            projectName ||
                                            tEmail(
                                                'dashboard.booking.defaultTitle'
                                            ),
                                    })}
                                </span>
                            </div>

                            {/* Email Body */}
                            <div className="text-sm text-gray-700 space-y-3">
                                {/* Greeting - Read-only */}
                                <div className="text-gray-600">
                                    {tEmail(
                                        'dashboard.booking.emailBodyGreeting',
                                        'Hi {{linguistName}},',
                                        { linguistName: linguist.name }
                                    )}
                                </div>

                                {/* Intro - Read-only */}
                                <div className="text-gray-600">
                                    {tEmail(
                                        'dashboard.booking.emailBodyIntro',
                                        'I would like to book you for the following project:'
                                    )}
                                </div>

                                {/* Project Name - Editable */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 whitespace-nowrap">
                                        {tEmail(
                                            'dashboard.booking.emailBodyProjectLabel',
                                            'Project:'
                                        )}
                                    </span>
                                    <Input
                                        value={projectName}
                                        onChange={(e) => {
                                            setProjectName(e.target.value)
                                        }}
                                        placeholder={t(
                                            'dashboard.booking.projectNamePlaceholder'
                                        )}
                                        className="flex-1 h-8 text-sm"
                                    />
                                </div>

                                {/* Availability Required - Read-only */}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 whitespace-nowrap">
                                        {tEmail(
                                            'dashboard.booking.emailBodyAvailabilityLabel',
                                            'Availability Required:'
                                        )}
                                    </span>
                                    <span className="text-gray-700 font-medium">
                                        {format(
                                            startOfDay(parseISO(startDate)),
                                            'PPP',
                                            { locale: enUS }
                                        )}{' '}
                                        -{' '}
                                        {format(
                                            startOfDay(parseISO(endDate)),
                                            'PPP',
                                            { locale: enUS }
                                        )}
                                    </span>
                                </div>

                                {/* Description - Editable */}
                                <div>
                                    <textarea
                                        value={projectDescription}
                                        onChange={(e) => {
                                            setProjectDescription(
                                                e.target.value
                                            )
                                        }}
                                        placeholder={t(
                                            'dashboard.booking.projectDescriptionPlaceholder'
                                        )}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px] bg-white"
                                    />
                                </div>

                                {/* Closing - Read-only */}
                                <div className="text-gray-600 whitespace-pre-line">
                                    {tEmail(
                                        'dashboard.booking.emailBodyClosing',
                                        'Please confirm your availability for the entire project duration.\n\nBest regards'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false)
                        }}
                    >
                        {t('dashboard.booking.cancel')}
                    </Button>
                    <Button onClick={handleBook} disabled={!projectName.trim()}>
                        {t('dashboard.booking.sendEmail')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default BookingModal

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import i18next from '@/i18n'
import { format, addDays, startOfDay } from 'date-fns'
import Hero from '@/components/organisms/Hero'
import FilterBar from '@/components/organisms/FilterBar'
import LinguistTable from '@/components/organisms/LinguistTable'
import LinguistCard from '@/components/organisms/LinguistCard'
import BookingModal from '@/components/organisms/BookingModal'
import { Skeleton } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Button } from '@/components/ui'
import { logger } from '@/utils/logger'
import { calculateEstimatedHours } from '@/utils/project-hours-calculator'
import type {
    SearchLinguistsQuery,
    SearchLinguistsResponse,
    LinguistWithAvailability,
} from '@linguistnow/shared'

interface DashboardProps {
    userName?: string
}

const Dashboard = ({ userName }: DashboardProps) => {
    const { t } = useTranslation()
    // Use English for email content regardless of PM's UI language
    const tEmail = i18next.getFixedT('en')
    const [linguists, setLinguists] = useState<LinguistWithAvailability[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
    const [selectedLinguist, setSelectedLinguist] =
        useState<LinguistWithAvailability | null>(null)
    const [bookingModalOpen, setBookingModalOpen] = useState(false)

    // Default date range: next 7 days
    const getDefaultStartDate = () => {
        const tomorrow = startOfDay(addDays(new Date(), 1))
        return format(tomorrow, 'yyyy-MM-dd')
    }

    const getDefaultEndDate = () => {
        const nextWeek = startOfDay(addDays(new Date(), 7))
        return format(nextWeek, 'yyyy-MM-dd')
    }

    // Calculate default required hours based on default date range
    const getDefaultRequiredHours = () => {
        const defaultStart = getDefaultStartDate()
        const defaultEnd = getDefaultEndDate()
        const estimated = calculateEstimatedHours(defaultStart, defaultEnd)
        return estimated ?? undefined
    }

    const [filters, setFilters] = useState<SearchLinguistsQuery>({
        startDate: getDefaultStartDate(),
        endDate: getDefaultEndDate(),
        requiredHours: getDefaultRequiredHours(),
        page: 1,
        limit: 20,
    })

    // Fetch linguists using search API
    useEffect(() => {
        const fetchLinguists = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()

                if (filters.languages)
                    params.append('languages', filters.languages)
                if (filters.specialization)
                    params.append('specialization', filters.specialization)
                if (filters.minRate !== undefined)
                    params.append('minRate', filters.minRate.toString())
                if (filters.maxRate !== undefined)
                    params.append('maxRate', filters.maxRate.toString())
                if (filters.minRating !== undefined)
                    params.append('minRating', filters.minRating.toString())
                if (filters.availableOnly)
                    params.append('availableOnly', 'true')
                if (filters.startDate)
                    params.append('startDate', filters.startDate)
                if (filters.endDate) params.append('endDate', filters.endDate)
                if (filters.requiredHours !== undefined)
                    params.append(
                        'requiredHours',
                        filters.requiredHours.toString()
                    )
                if (filters.timezone)
                    params.append('timezone', filters.timezone)
                if (filters.page) params.append('page', filters.page.toString())
                if (filters.limit)
                    params.append('limit', filters.limit.toString())

                const response = await axios.get<SearchLinguistsResponse>(
                    `${import.meta.env.VITE_API_URL}/api/linguists/search?${params.toString()}`
                )

                logger.log('Search results:', response.data)
                setLinguists(response.data.linguists)
            } catch (error) {
                console.error('Error searching linguists:', error)
                setLinguists([])
            } finally {
                setLoading(false)
            }
        }

        fetchLinguists()
    }, [filters])

    const handleFiltersChange = (newFilters: SearchLinguistsQuery) => {
        setFilters({ ...newFilters, page: 1 }) // Reset to page 1 on filter change
    }

    const handleClearFilters = () => {
        const defaultStart = getDefaultStartDate()
        const defaultEnd = getDefaultEndDate()
        const estimated = calculateEstimatedHours(defaultStart, defaultEnd)
        setFilters({
            startDate: defaultStart,
            endDate: defaultEnd,
            requiredHours: estimated ?? undefined,
            page: 1,
            limit: 20,
        })
    }

    const handleDateRangeChange = (
        startDate: string | undefined,
        endDate: string | undefined
    ) => {
        const newStartDate = startDate || getDefaultStartDate()
        const newEndDate = endDate || getDefaultEndDate()
        // Auto-update requiredHours to match estimated hours when date range changes
        const estimated = calculateEstimatedHours(newStartDate, newEndDate)
        setFilters({
            ...filters,
            startDate: newStartDate,
            endDate: newEndDate,
            requiredHours: estimated ?? filters.requiredHours, // Keep existing if estimation fails
        })
    }

    const handleBookLinguist = (linguist: LinguistWithAvailability) => {
        setSelectedLinguist(linguist)
        setBookingModalOpen(true)
    }

    // Get PM info from localStorage or props (if available)
    const pmEmail = localStorage.getItem('userEmail') || undefined
    const pmName = userName || undefined

    return (
        <>
            <Hero userName={userName} />
            <main className="container mx-auto mb-5">
                <div className="w-full px-3">
                    {/* Filters */}
                    <div className="w-full mb-4 mt-5">
                        <FilterBar
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            onClearFilters={handleClearFilters}
                            onDateChange={handleDateRangeChange}
                        />
                    </div>

                    {/* View Mode Toggle and Bulk Actions */}
                    <div className="w-full mb-4 flex justify-between items-center">
                        <div>
                            {(() => {
                                const incompleteLinguists = linguists.filter(
                                    (l) => !l.setupStatus.isComplete
                                )
                                if (incompleteLinguists.length === 0)
                                    return null

                                return (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const accountSettingsUrl = `${window.location.origin}/settings`

                                            // Map field identifiers to their display labels (always in English for emails)
                                            const fieldLabelMap: Record<
                                                string,
                                                string
                                            > = {
                                                calendars: tEmail(
                                                    'calendarSelector.title',
                                                    'Calendar Selection'
                                                ),
                                                timezone: tEmail(
                                                    'availabilitySettings.timezone',
                                                    'Timezone'
                                                ),
                                                working_hours: tEmail(
                                                    'availabilitySettings.workingHours',
                                                    'Working Hours'
                                                ),
                                            }

                                            // Collect all unique missing items across all linguists
                                            const allMissingItems =
                                                new Set<string>()
                                            incompleteLinguists.forEach(
                                                (linguist) => {
                                                    linguist.setupStatus.missingItems.forEach(
                                                        (item) => {
                                                            allMissingItems.add(
                                                                item
                                                            )
                                                        }
                                                    )
                                                }
                                            )

                                            // Convert to display labels
                                            const missingItemsLabels =
                                                Array.from(allMissingItems)
                                                    .map(
                                                        (item) =>
                                                            fieldLabelMap[
                                                                item
                                                            ] || item
                                                    )
                                                    .sort()

                                            const emailBody = tEmail(
                                                'dashboard.booking.setupReminderBodyBulk',
                                                {
                                                    missingItems:
                                                        missingItemsLabels.join(
                                                            ', '
                                                        ),
                                                    accountSettingsUrl,
                                                }
                                            )

                                            // Get all email addresses (comma-separated) for BCC
                                            const emailAddresses =
                                                incompleteLinguists
                                                    .map((l) => l.email)
                                                    .join(',')

                                            window.open(
                                                `mailto:?bcc=${emailAddresses}&subject=${encodeURIComponent(tEmail('dashboard.booking.setupReminderSubjectBulk'))}&body=${encodeURIComponent(emailBody)}`,
                                                '_blank'
                                            )
                                        }}
                                    >
                                        {t(
                                            'dashboard.booking.sendSetupReminderToAll',
                                            {
                                                count: incompleteLinguists.length,
                                            }
                                        )}
                                    </Button>
                                )
                            })()}
                        </div>
                        <Tabs
                            value={viewMode}
                            onValueChange={(v) => {
                                setViewMode(v as 'list' | 'card')
                            }}
                        >
                            <TabsList>
                                <TabsTrigger value="list">
                                    {t('dashboard.viewMode.list')}
                                </TabsTrigger>
                                <TabsTrigger value="card">
                                    {t('dashboard.viewMode.card')}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Linguists Display */}
                    {loading ? (
                        <Skeleton />
                    ) : (
                        <Tabs value={viewMode} className="w-full">
                            <TabsContent value="list">
                                <LinguistTable linguists={linguists} />
                            </TabsContent>
                            <TabsContent value="card">
                                {linguists.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {t('dashboard.noResults')}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                        {linguists.map((linguist) => (
                                            <div
                                                key={linguist.id}
                                                className="relative"
                                            >
                                                <LinguistCard
                                                    linguist={linguist}
                                                    showTimeline={false}
                                                />
                                                {linguist.setupStatus
                                                    .isComplete &&
                                                    linguist.availability
                                                        ?.isAvailable && (
                                                        <div className="mt-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    handleBookLinguist(
                                                                        linguist
                                                                    )
                                                                }}
                                                                className="w-full"
                                                            >
                                                                {t(
                                                                    'dashboard.booking.bookButton'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                {!linguist.setupStatus
                                                    .isComplete && (
                                                    <div className="mt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const accountSettingsUrl = `${window.location.origin}/settings`
                                                                // Map field identifiers to their display labels (always in English for emails)
                                                                const fieldLabelMap: Record<
                                                                    string,
                                                                    string
                                                                > = {
                                                                    calendars:
                                                                        tEmail(
                                                                            'calendarSelector.title',
                                                                            'Calendar Selection'
                                                                        ),
                                                                    timezone:
                                                                        tEmail(
                                                                            'availabilitySettings.timezone',
                                                                            'Timezone'
                                                                        ),
                                                                    working_hours:
                                                                        tEmail(
                                                                            'availabilitySettings.workingHours',
                                                                            'Working Hours'
                                                                        ),
                                                                }
                                                                const missingItemsLabels =
                                                                    linguist.setupStatus.missingItems.map(
                                                                        (
                                                                            item
                                                                        ) =>
                                                                            fieldLabelMap[
                                                                                item
                                                                            ] ||
                                                                            item
                                                                    )
                                                                window.open(
                                                                    `mailto:${linguist.email}?subject=${encodeURIComponent(tEmail('dashboard.booking.setupReminderSubjectBulk'))}&body=${encodeURIComponent(tEmail('dashboard.booking.setupReminderBodyBulk', { missingItems: missingItemsLabels.join(', '), accountSettingsUrl }))}`,
                                                                    '_blank'
                                                                )
                                                            }}
                                                            className="w-full"
                                                        >
                                                            {t(
                                                                'dashboard.booking.sendSetupReminder'
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* Booking Modal */}
                    {selectedLinguist && (
                        <BookingModal
                            linguist={selectedLinguist}
                            open={bookingModalOpen}
                            onOpenChange={setBookingModalOpen}
                            pmEmail={pmEmail}
                            pmName={pmName}
                            startDate={
                                filters.startDate ?? getDefaultStartDate()
                            }
                            endDate={filters.endDate ?? getDefaultEndDate()}
                        />
                    )}
                </div>
            </main>
        </>
    )
}

export default Dashboard

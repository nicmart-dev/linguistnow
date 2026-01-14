import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next' // to localize text strings
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
// logger import removed - not currently used

interface CalendarSelectorProps {
    userDetails: Record<string, unknown> | null
    onSave: (calendars: string[]) => Promise<void>
}

/**
 * Component for selecting Google Calendars to monitor for availability.
 * Fetches calendars via backend API and stores only calendar IDs for privacy.
 *
 * Note: Calendar IDs may be emails or alphanumeric strings.
 * Display names are fetched from Google API for UI only, never stored.
 * @param userDetails - Current user's profile details
 * @param onSave - Callback when calendar selection is saved
 */
const CalendarSelector = ({ userDetails, onSave }: CalendarSelectorProps) => {
    const [fetchedCalendars, setFetchedCalendars] = useState<
        Array<{ id: string; summary: string }>
    >([]) // all calendars user has access to in Google Calendar
    const [loading, setLoading] = useState(true) // state to track loading status
    const [error, setError] = useState<string | null>(null) // state to track error
    const [open, setOpen] = useState(false) // state for popover open/close
    const { t } = useTranslation()

    const markSessionExpired = useCallback(() => {
        localStorage.setItem('calendarSessionExpired', 'true')
    }, [])

    const clearSessionExpired = useCallback(() => {
        localStorage.removeItem('calendarSessionExpired')
    }, [])

    const fetchCalendars = useCallback(async () => {
        if (!userDetails?.Email && !userDetails?.email) {
            setLoading(false)
            return
        }

        // Check if user is authenticated by verifying localStorage
        const storedEmail = localStorage.getItem('userEmail')
        if (!storedEmail) {
            // No stored email means session expired or user not logged in
            setLoading(false)
            setError(
                t(
                    'calendarSelector.sessionExpired',
                    'Your session has expired. Please login again.'
                )
            )
            return
        }

        const userEmail = (userDetails.Email || userDetails.email) as string

        try {
            // Fetch calendars via backend API (token is read from Vault and auto-refreshed if expired)
            const response = await axios.get<{
                calendars?: Array<{ id: string; summary: string }>
            }>(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/calendars/list/${encodeURIComponent(userEmail)}`
            )

            setFetchedCalendars(response.data.calendars ?? [])
            setError(null)
            clearSessionExpired() // Clear session expired flag on success
        } catch (err: unknown) {
            console.error('Error fetching calendars:', err)

            // Handle 401 Unauthorized
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                // Only mark as expired if refresh token is invalid (not just access token)
                // Access token expiration is now handled automatically by the server
                const errorData = err.response.data as
                    | { code?: string }
                    | undefined
                const errorCode = errorData?.code

                if (
                    errorCode === 'TOKEN_EXPIRED' ||
                    errorCode === 'TOKEN_NOT_FOUND'
                ) {
                    // Refresh token is invalid or missing - user needs to re-authenticate
                    markSessionExpired()

                    if (errorCode === 'TOKEN_EXPIRED') {
                        setError(
                            t(
                                'calendarSelector.tokenExpired',
                                'Your Google Calendar access has expired. Please login again to re-authorize.'
                            )
                        )
                    } else {
                        setError(
                            t(
                                'calendarSelector.tokenNotFound',
                                'Please login again to authorize calendar access.'
                            )
                        )
                    }
                } else {
                    // Generic 401 - might be temporary, don't mark as expired
                    setError(
                        t(
                            'calendarSelector.fetchError',
                            'Unable to fetch calendars. Please try again.'
                        )
                    )
                }
            } else {
                // Other errors
                setError(
                    t(
                        'calendarSelector.fetchError',
                        'Unable to fetch calendars. Please try again.'
                    )
                )
            }
        } finally {
            setLoading(false)
        }
    }, [userDetails, t, markSessionExpired, clearSessionExpired])

    useEffect(() => {
        // Only fetch calendars if userDetails exists
        // Don't clear session expired flag here - it will be cleared on successful API call
        if (userDetails) {
            void fetchCalendars()
        } else {
            // If userDetails is null, session has expired
            markSessionExpired()
            setLoading(false)
        }
    }, [userDetails, fetchCalendars, markSessionExpired])

    // Store only calendar IDs (never display names) for privacy
    const handleSelectCalendar = (calendarId: string) => {
        if (!userDetails) return
        const calendarIdsField = userDetails['Calendar IDs']
        const selectedCalendars =
            calendarIdsField && typeof calendarIdsField === 'string'
                ? calendarIdsField.split(',').filter(Boolean)
                : []

        // If deselecting, check if it's the last calendar
        if (
            selectedCalendars.includes(calendarId) &&
            selectedCalendars.length === 1
        ) {
            toast.error(
                t(
                    'calendarSelector.atLeastOneRequired',
                    'At least one calendar must be selected'
                )
            )
            return
        }

        const updatedCalendars = selectedCalendars.includes(calendarId)
            ? selectedCalendars.filter((id) => id !== calendarId)
            : [...selectedCalendars, calendarId]
        // onSave receives array of IDs only (not display names)
        void onSave(updatedCalendars)
    }

    const handleRemoveCalendar = (
        calendarId: string,
        e: React.MouseEvent | React.KeyboardEvent
    ) => {
        e.stopPropagation()
        if (!userDetails) return
        const calendarIdsField = userDetails['Calendar IDs']
        const selectedCalendars =
            calendarIdsField && typeof calendarIdsField === 'string'
                ? calendarIdsField.split(',').filter(Boolean)
                : []

        // Prevent removing the last calendar
        if (selectedCalendars.length <= 1) {
            toast.error(
                t(
                    'calendarSelector.atLeastOneRequired',
                    'At least one calendar must be selected'
                )
            )
            return
        }

        const updatedCalendars = selectedCalendars.filter(
            (id: string) => id !== calendarId
        )
        void onSave(updatedCalendars)
    }

    const calendarIdsField = userDetails?.['Calendar IDs']
    const selectedCalendars =
        calendarIdsField && typeof calendarIdsField === 'string'
            ? calendarIdsField.split(',').filter(Boolean)
            : []

    const selectedCalendarObjects = fetchedCalendars.filter((cal) =>
        selectedCalendars.includes(cal.id)
    )

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">
                {t('calendarSelector.title', 'Calendar Selection')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
                {t(
                    'calendarSelector.description',
                    'Select calendars for availability checking. We only check free/busy slots, not event content.'
                )}
            </p>
            <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('calendarSelector.chooseCalendars')}
            </label>

            <div className="flex items-start gap-3">
                <div>
                    {loading ? (
                        <div className="h-10 w-auto min-w-[280px] rounded-md border bg-muted animate-pulse" />
                    ) : fetchedCalendars.length > 0 ? (
                        <Popover
                            open={open && !error}
                            onOpenChange={(newOpen) => {
                                if (!error) setOpen(newOpen)
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    disabled={!!error}
                                    className={cn(
                                        'w-auto min-w-[280px] justify-between h-auto min-h-10 py-2',
                                        error && 'opacity-60 cursor-not-allowed'
                                    )}
                                >
                                    <div className="flex flex-wrap gap-1 flex-1">
                                        {selectedCalendars.length === 0 ? (
                                            <span className="text-muted-foreground">
                                                {t(
                                                    'calendarSelector.chooseCalendars'
                                                )}
                                            </span>
                                        ) : (
                                            selectedCalendarObjects.map(
                                                (calendar) => (
                                                    <Badge
                                                        key={calendar.id}
                                                        variant="secondary"
                                                        className="mr-1 mb-1"
                                                    >
                                                        {calendar.summary}
                                                        {!error && (
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                aria-label={t(
                                                                    'calendarSelector.removeCalendar',
                                                                    {
                                                                        calendar:
                                                                            calendar.summary,
                                                                        defaultValue:
                                                                            'Remove {{calendar}}',
                                                                    }
                                                                )}
                                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                                onKeyDown={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                            'Enter' ||
                                                                        e.key ===
                                                                            ' '
                                                                    ) {
                                                                        e.preventDefault()
                                                                        handleRemoveCalendar(
                                                                            calendar.id,
                                                                            e
                                                                        )
                                                                    }
                                                                }}
                                                                onMouseDown={(
                                                                    e
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                }}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    handleRemoveCalendar(
                                                                        calendar.id,
                                                                        e
                                                                    )
                                                                }}
                                                            >
                                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                            </span>
                                                        )}
                                                    </Badge>
                                                )
                                            )
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-full p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput
                                        placeholder={t(
                                            'calendarSelector.searchCalendars',
                                            'Search calendars...'
                                        )}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {t(
                                                'calendarSelector.noCalendarsAvailable'
                                            )}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {fetchedCalendars.map(
                                                (calendar) => {
                                                    const isSelected =
                                                        selectedCalendars.includes(
                                                            calendar.id
                                                        )
                                                    return (
                                                        <CommandItem
                                                            key={calendar.id}
                                                            value={
                                                                calendar.summary
                                                            }
                                                            onSelect={() => {
                                                                handleSelectCalendar(
                                                                    calendar.id
                                                                )
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    isSelected
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                            {calendar.summary}
                                                        </CommandItem>
                                                    )
                                                }
                                            )}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <div
                            className={cn(
                                'h-10 w-auto min-w-[280px] rounded-md border bg-muted flex items-center px-3',
                                error && 'opacity-60'
                            )}
                        >
                            <span className="text-sm text-gray-500">
                                {t('calendarSelector.noCalendarsAvailable')}
                            </span>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-sm text-destructive mt-2 flex-shrink-0">
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}

export default CalendarSelector

import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next' // to localize text strings
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from './ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import { logger } from '../utils/logger'

/* The CalendarSelector component fetches the user's Google Calendars 
via the backend API (which reads the access token from Vault),
and allows the user to select and save their calendars.

IMPORTANT: We ONLY store calendar IDs (not display names/summaries) for privacy.
- Calendar IDs can be email addresses (for primary calendars) or alphanumeric strings (for secondary calendars)
- Display names (summary) are fetched from Google API when needed for UI display only
- Never stored in database to protect user privacy
 */
const CalendarSelector = ({ userDetails, onSave }) => {
    const [fetchedCalendars, setFetchedCalendars] = useState([]) // all calendars user has access to in Google Calendar
    const [loading, setLoading] = useState(true) // state to track loading status
    const [error, setError] = useState(null) // state to track error
    const [open, setOpen] = useState(false) // state for popover open/close
    const { t } = useTranslation()

    // Check localStorage for session expiration flag on mount
    const checkSessionExpired = useCallback(() => {
        return localStorage.getItem('calendarSessionExpired') === 'true'
    }, [])

    const markSessionExpired = useCallback(() => {
        localStorage.setItem('calendarSessionExpired', 'true')
    }, [])

    const clearSessionExpired = useCallback(() => {
        localStorage.removeItem('calendarSessionExpired')
    }, [])

    const fetchCalendars = useCallback(async () => {
        // Don't make API call if session has expired (persisted in localStorage)
        if (checkSessionExpired()) {
            setLoading(false)
            setError(
                t(
                    'calendarSelector.sessionExpired',
                    'Your session has expired. Please login again.'
                )
            )
            return
        }

        if (!userDetails?.Email && !userDetails?.email) {
            setLoading(false)
            return
        }

        // Check if user is authenticated by verifying localStorage
        const storedEmail = localStorage.getItem('userEmail')
        if (!storedEmail) {
            // No stored email means session expired or user not logged in
            markSessionExpired()
            setLoading(false)
            setError(
                t(
                    'calendarSelector.sessionExpired',
                    'Your session has expired. Please login again.'
                )
            )
            return
        }

        const userEmail = userDetails.Email || userDetails.email

        try {
            // Fetch calendars via backend API (token is read from Vault)
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/calendars/list/${encodeURIComponent(userEmail)}`
            )

            setFetchedCalendars(response.data.calendars || [])
            setError(null)
            clearSessionExpired() // Clear session expired flag on success
        } catch (err) {
            console.error('Error fetching calendars:', err)

            // Handle 401 Unauthorized - mark as expired to prevent retries
            if (err.response?.status === 401) {
                // Any 401 error means we shouldn't retry - mark as expired
                // This includes TOKEN_EXPIRED, TOKEN_NOT_FOUND, and generic 401s
                markSessionExpired()

                // Show appropriate error message based on error code
                if (err.response?.data?.code === 'TOKEN_EXPIRED') {
                    setError(
                        t(
                            'calendarSelector.tokenExpired',
                            'Your Google Calendar access has expired. Please login again to re-authorize.'
                        )
                    )
                } else if (err.response?.data?.code === 'TOKEN_NOT_FOUND') {
                    setError(
                        t(
                            'calendarSelector.tokenNotFound',
                            'Please login again to authorize calendar access.'
                        )
                    )
                } else {
                    // Generic 401 or session expiration
                    setError(
                        t(
                            'calendarSelector.sessionExpired',
                            'Your session has expired. Please login again.'
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
    }, [
        userDetails,
        t,
        checkSessionExpired,
        markSessionExpired,
        clearSessionExpired,
    ])

    useEffect(() => {
        // Only fetch calendars if userDetails exists
        // Don't clear session expired flag here - it will be cleared on successful API call
        if (userDetails) {
            fetchCalendars()
        } else {
            // If userDetails is null, session has expired
            markSessionExpired()
            setLoading(false)
        }
    }, [userDetails, fetchCalendars, markSessionExpired])

    // Store only calendar IDs (never display names) for privacy
    const handleSelectCalendar = (calendarId) => {
        const selectedCalendars = userDetails['Calendar IDs']
            ? userDetails['Calendar IDs'].split(',')
            : []
        const updatedCalendars = selectedCalendars.includes(calendarId)
            ? selectedCalendars.filter((id) => id !== calendarId)
            : [...selectedCalendars, calendarId]
        // onSave receives array of IDs only (not display names)
        onSave(updatedCalendars)
    }

    const handleRemoveCalendar = (calendarId, e) => {
        e.stopPropagation()
        const selectedCalendars = userDetails['Calendar IDs']
            ? userDetails['Calendar IDs'].split(',')
            : []
        const updatedCalendars = selectedCalendars.filter(
            (id) => id !== calendarId
        )
        onSave(updatedCalendars)
    }

    const selectedCalendars = userDetails['Calendar IDs']
        ? userDetails['Calendar IDs'].split(',')
        : []

    const selectedCalendarObjects = fetchedCalendars.filter((cal) =>
        selectedCalendars.includes(cal.id)
    )

    return (
        <div className="max-w-3xl mb-8">
            <label className="mb-2 block text-sm font-medium">
                {t('calendarSelector.chooseCalendars')}
            </label>
            <p className="mb-4 text-sm text-muted-foreground">
                * {t('accountSettings.automaticSave')}
            </p>

            {loading ? (
                <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
            ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : fetchedCalendars && fetchedCalendars.length > 0 ? (
                <>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between h-auto min-h-10 py-2"
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
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                e.preventDefault()
                                                                handleRemoveCalendar(
                                                                    calendar.id,
                                                                    e
                                                                )
                                                            }
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                        }}
                                                        onClick={(e) =>
                                                            handleRemoveCalendar(
                                                                calendar.id,
                                                                e
                                                            )
                                                        }
                                                    >
                                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                    </span>
                                                </Badge>
                                            )
                                        )
                                    )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
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
                                        {fetchedCalendars.map((calendar) => {
                                            const isSelected =
                                                selectedCalendars.includes(
                                                    calendar.id
                                                )
                                            return (
                                                <CommandItem
                                                    key={calendar.id}
                                                    value={calendar.summary}
                                                    onSelect={() =>
                                                        handleSelectCalendar(
                                                            calendar.id
                                                        )
                                                    }
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
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </>
            ) : (
                <p className="text-sm text-muted-foreground">
                    {t('calendarSelector.noCalendarsAvailable')}
                </p>
            )}
        </div>
    )
}

export default CalendarSelector

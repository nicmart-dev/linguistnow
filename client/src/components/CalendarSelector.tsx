import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next' // to localize text strings
import Skeleton from './Skeleton'
import { logger } from '../utils/logger'

/* The CalendarSelector component fetches the user's Google Calendars 
via the backend API (which reads the access token from Vault),
and allows the user to select and save their calendars.
 */
const CalendarSelector = ({ userDetails, onSave }) => {
    const [fetchedCalendars, setFetchedCalendars] = useState([]) // all calendars user has access to in Google Calendar
    const [loading, setLoading] = useState(true) // state to track loading status
    const [error, setError] = useState(null) // state to track error
    const { t } = useTranslation()

    const fetchCalendars = useCallback(async () => {
        if (!userDetails?.Email && !userDetails?.email) {
            setLoading(false)
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
        } catch (err) {
            console.error('Error fetching calendars:', err)

            // Handle specific error codes
            if (err.response?.data?.code === 'TOKEN_NOT_FOUND') {
                setError(
                    t(
                        'calendarSelector.tokenNotFound',
                        'Please login again to authorize calendar access.'
                    )
                )
            } else if (err.response?.data?.code === 'TOKEN_EXPIRED') {
                setError(
                    t(
                        'calendarSelector.tokenExpired',
                        'Your session has expired. Please login again.'
                    )
                )
            } else {
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
    }, [userDetails, t])

    useEffect(() => {
        if (userDetails) {
            fetchCalendars()
        }
    }, [userDetails, fetchCalendars])

    const handleSelectCalendar = (calendarId) => {
        const selectedCalendars = userDetails['Calendar IDs']
            ? userDetails['Calendar IDs'].split(',')
            : []
        const updatedCalendars = selectedCalendars.includes(calendarId)
            ? selectedCalendars.filter((id) => id !== calendarId)
            : [...selectedCalendars, calendarId]
        onSave(updatedCalendars)
    }

    const selectedCalendars = userDetails['Calendar IDs']
        ? userDetails['Calendar IDs'].split(',')
        : []

    return (
        <>
            {/* TODO: refactor using new control */}
            <fieldset className="max-w-3xl mb-8">
                <legend className="mb-4 text-lg">
                    {t('calendarSelector.chooseCalendars')}
                </legend>
                <p className="max-w-3xl text-lg mb-4">
                    * {t('accountSettings.automaticSave')}
                </p>

                <div className="space-y-2">
                    {/* Show skeleton loader while loading list of calendars */}
                    {loading ? (
                        <Skeleton />
                    ) : error ? (
                        <p className="text-red-600">{error}</p>
                    ) : fetchedCalendars && fetchedCalendars.length > 0 ? (
                        <>
                            {fetchedCalendars.map((calendar) => (
                                <label
                                    key={calendar.id}
                                    htmlFor={calendar.id}
                                    className="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 has-[:checked]:bg-blue-50"
                                >
                                    <div className="flex items-center">
                                        &#8203;
                                        <input
                                            type="checkbox"
                                            className="size-4 rounded border-gray-300"
                                            id={calendar.id}
                                            checked={selectedCalendars.includes(
                                                calendar.id
                                            )}
                                            onChange={() =>
                                                handleSelectCalendar(
                                                    calendar.id
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <strong className="font-medium text-gray-900">
                                            {calendar.summary}
                                        </strong>
                                    </div>
                                </label>
                            ))}
                        </>
                    ) : (
                        <p>{t('calendarSelector.noCalendarsAvailable')}</p>
                    )}
                </div>
            </fieldset>
        </>
    )
}

export default CalendarSelector

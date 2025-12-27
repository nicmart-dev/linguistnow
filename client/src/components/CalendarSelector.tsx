import React, { useEffect, useState, useCallback } from 'react'
import { refreshAccessToken, isAccessTokenValid } from '../auth-users/utils'
import { useTranslation } from 'react-i18next' // to localize text strings
import Skeleton from './Skeleton'
import { logger } from '../utils/logger'

/* The CalendarSelector component fetches the user's Google Calendars 
using their access token, handles token expiration by refreshing the access token, 
and allows the user to select and save their calendars.
 */
const CalendarSelector = ({ userDetails, onSave }) => {
    const [fetchedCalendars, setFetchedCalendars] = useState([]) // all calendars user has access to in Google Calendar
    const [loading, setLoading] = useState(true) // state to track loading status
    const { t } = useTranslation()

    const fetchCalendars = useCallback(
        async (accessToken) => {
            try {
                const isValidToken = await isAccessTokenValid(accessToken)
                if (!isValidToken) {
                    logger.log('Token expired, refreshing access token...')
                    accessToken = await refreshAccessToken(
                        userDetails['Refresh Token']
                    )
                }

                const response = await fetch(
                    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                    {
                        headers: new Headers({
                            Authorization: `Bearer ${accessToken}`,
                        }),
                    }
                )

                const data = await response.json()
                setFetchedCalendars(data.items)
            } catch (error) {
                console.error('Error fetching calendars:', error)
            } finally {
                setLoading(false) // set loading to false after fetch is complete
            }
        },
        [userDetails]
    )

    useEffect(() => {
        if (userDetails && userDetails['Access Token']) {
            fetchCalendars(userDetails['Access Token'])
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
                    *{' '}
                    {t('accountSettings.automaticSave')}
                </p>

                <div className="space-y-2">
                    {/* Show skeleton loader while loading list of calendars */}
                    {loading ? (
                        <Skeleton />
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
                        <p>
                            {t('calendarSelector.noCalendarsAvailable')}
                        </p>
                    )}
                </div>
            </fieldset>
        </>
    )
}

export default CalendarSelector

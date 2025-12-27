import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FormattedMessage } from 'react-intl' // To show localized strings
import { refreshAccessToken, isAccessTokenValid } from '../auth-users/utils' // To refresh access token when needed
import { fetchUserList } from '../auth-users/utils'
import Hero from '../components/Hero'
import LinguistTable from '../components/LinguistTable.jsx'
import Skeleton from '../components/Skeleton' // to sisplay while data is loading

const Dashboard = ({ userName }) => {
    const [linguists, setLinguists] = useState([]) // store list of users retrieved from Airtable
    const [errors, setErrors] = useState([]) // store error messages to display to users
    const [loading, setLoading] = useState(true) // State to track loading status so we display table only after fetching data

    /* Get list of linguists at page load from Airtable  and 
    for each check their availability using n8n workflow. 
    */
    useEffect(() => {
        const fetchLinguists = async () => {
            const newErrors = [] // Errors stored as we loop through each user
            const processedLinguists = [] // Collect all linguists before updating state
            setErrors([]) // Clear previous errors

            try {
                const users = await fetchUserList()
                console.log('Users:', users)

                // Filter out users who are not Linguists
                const linguists = users.filter(
                    (user) => user.Role === 'Linguist'
                )
                console.log('Filtered Linguists:', linguists)

                for (const user of linguists) {
                    try {
                        // Check if the calendar list and Google OAuth tokens needed is present
                        if (
                            !user['Calendar IDs'] ||
                            !user['Access Token'] ||
                            !user['Refresh Token']
                        ) {
                            throw new Error(
                                `Calendar IDs, Access Token, or Refresh Token not available for user: ${user.Email}. Please ask them to login again with their Google account, select their calendars and click "Save calendars" button in the settings page.`
                            )
                        }
                        let calendarIds = user['Calendar IDs']
                        let accessToken = user['Access Token']
                        let availabilityResponse

                        // Check if access token is valid, if not refresh it
                        const isValidToken =
                            await isAccessTokenValid(accessToken)
                        if (!isValidToken) {
                            console.log(
                                `Google OAuth access token invalid or expired for user ${user.Email}. Getting a new one using refresh token...`
                            )
                            try {
                                accessToken = await refreshAccessToken(
                                    user['Refresh Token']
                                )

                                // Save the new access token to Airtable
                                await axios.put(
                                    `${import.meta.env.VITE_API_URL}/api/users/${user.Email}`,
                                    {
                                        googleAccessToken: accessToken,
                                    }
                                )
                            } catch (refreshError) {
                                // Handle refresh token errors
                                if (refreshError.response && refreshError.response.data?.code === 'INVALID_REFRESH_TOKEN') {
                                    throw new Error(
                                        `Refresh token is invalid for user ${user.Email}. Please ask them to login again with their Google account and re-select their calendars in the settings page.`
                                    )
                                }
                                throw refreshError
                            }
                        }

                        try {
                            // Trigger N8n workflow to get availability for each user
                            availabilityResponse = await axios.post(
                                `${import.meta.env.VITE_API_URL}/api/calendars/free`,
                                {
                                    calendarIds: calendarIds,
                                    accessToken: accessToken,
                                    userEmail: user.Email, // Include user email for better error context
                                }
                            )
                        } catch (error) {
                            // Handle n8n workflow errors gracefully
                            if (error.response) {
                                const errorData = error.response.data || {}
                                const status = error.response.status
                                
                                // Build user-friendly error message
                                let errorMessage = `Unable to check availability for ${user.Email || user.Name || 'user'}. `
                                
                                if (status === 404) {
                                    errorMessage += errorData.details || 'The n8n workflow is not active. Please activate the workflow in n8n.'
                                    if (errorData.hint) {
                                        errorMessage += ` ${errorData.hint}`
                                    }
                                } else if (status === 503) {
                                    errorMessage += errorData.details || 'The n8n service is currently unavailable.'
                                } else if (status === 504) {
                                    errorMessage += errorData.details || 'The n8n workflow timed out. The workflow may be stuck or processing too much data.'
                                    if (errorData.hint) {
                                        errorMessage += ` ${errorData.hint}`
                                    }
                                } else if (status === 401) {
                                    errorMessage += 'Authentication failed. Please check your API configuration.'
                                    console.log('Could not connect to n8n workflow. Check your API key environment variable.')
                                    continue // Skip to the next user
                                } else {
                                    errorMessage += errorData.details || errorData.error || 'An error occurred while checking availability.'
                                }
                                
                                newErrors.push({
                                    message: errorMessage,
                                    userEmail: user.Email,
                                    code: errorData.code || 'N8N_ERROR',
                                    severity: status >= 500 ? 'error' : 'warning'
                                })
                                console.warn(`n8n workflow error for ${user.Email}:`, errorData)
                                continue // Skip to the next user
                            } else if (error.request) {
                                // Network error
                                newErrors.push({
                                    message: `Unable to reach n8n service for ${user.Email || user.Name || 'user'}. The service may be down.`,
                                    userEmail: user.Email,
                                    code: 'NETWORK_ERROR',
                                    severity: 'error'
                                })
                                continue // Skip to the next user
                            } else {
                                // Other errors
                                throw error
                            }
                        }

                        const availability = availabilityResponse.data
                        console.log(
                            'Availability for',
                            user.Email,
                            ':',
                            availability
                        )

                        // Collect the user with availability (batch update later)
                        processedLinguists.push({ ...user, availability })
                    } catch (userError) {
                        console.warn(userError)
                        // Ensure error is formatted as an object
                        const errorMessage = userError.message || userError.toString() || 'An unknown error occurred'
                        newErrors.push({
                            message: errorMessage,
                            userEmail: user?.Email || null,
                            code: 'USER_ERROR',
                            severity: 'error'
                        })
                    }
                }
            } catch (error) {
                console.error('Error fetching linguists:', error)
                newErrors.push({
                    message: 'Error fetching linguists: ' + error.message,
                    code: 'FETCH_ERROR',
                    severity: 'error'
                })
            }

            // Batch update: set all linguists at once to avoid multiple re-renders
            setLinguists(processedLinguists)
            // Store errors in state
            setErrors(newErrors)
            setLoading(false) // Set loading to false after fetch is done
        }

        fetchLinguists()
    }, [])

    /* Show available linguists in a table. */
    return (
        <>
            <Hero userName={userName} />
            <main className="container px-3 mb-5">
                <div className="items-center justify-center">
                    <p className="max-w-3xl mx-auto my-5 text-lg text-black">
                        <FormattedMessage
                            id="dashboard.linguistsDescription"
                            values={{
                                ts: Date.now() + 7 * 24 * 60 * 60 * 1000,
                            }}
                        />
                        <span className="block">
                            <FormattedMessage id="dashboard.availabilityDescription" />
                        </span>
                    </p>
                    {/* Show error messages if any */}
                    {errors.length > 0 && (
                        <div className="max-w-3xl mx-auto mb-4">
                            {errors
                                .filter(error => {
                                    // Filter out errors without messages
                                    const message = typeof error === 'string' ? error : error?.message
                                    return message && message.trim().length > 0
                                })
                                .map((error, index) => {
                                    // Normalize error format - handle both string and object formats
                                    const errorObj = typeof error === 'string' 
                                        ? { message: error, severity: 'error' }
                                        : error
                                    const message = errorObj.message || 'An unknown error occurred'
                                    const severity = errorObj.severity || 'error'
                                    
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 mb-3 rounded-md border ${
                                                severity === 'error'
                                                    ? 'bg-red-50 border-red-200 text-red-800'
                                                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                            }`}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    {severity === 'error' ? (
                                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium">{message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                    {/* Show table of available linguists, but only if data has been loaded */}
                    {loading ? (
                        <Skeleton />
                    ) : (
                        <LinguistTable linguists={linguists} errors={errors} />
                    )}
                </div>
            </main>
        </>
    )
}

export default Dashboard

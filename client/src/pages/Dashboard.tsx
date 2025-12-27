import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FormattedMessage } from 'react-intl' // To show localized strings
import { refreshAccessToken, isAccessTokenValid } from '../auth-users/utils' // To refresh access token when needed
import { fetchUserList } from '../auth-users/utils'
import Hero from '../components/Hero'
import LinguistTable from '../components/LinguistTable'
import Skeleton from '../components/Skeleton' // to sisplay while data is loading
import { logger } from '../utils/logger'

// Consolidate similar errors to avoid showing duplicate messages
function consolidateErrors(errors: Array<{ message: string; userEmail?: string | null; code?: string; severity?: string }>) {
    const errorGroups = new Map<string, { message: string; userEmails: string[]; code?: string; severity?: string }>()
    
    for (const error of errors) {
        // Create a key based on error code or message pattern
        const key = error.code || error.message
        const userEmail = error.userEmail || null
        
        if (errorGroups.has(key)) {
            const group = errorGroups.get(key)!
            if (userEmail && !group.userEmails.includes(userEmail)) {
                group.userEmails.push(userEmail)
            }
        } else {
            errorGroups.set(key, {
                message: error.message,
                userEmails: userEmail ? [userEmail] : [],
                code: error.code,
                severity: error.severity || 'error'
            })
        }
    }
    
    // Convert groups back to error objects with consolidated messages
    return Array.from(errorGroups.values()).map(group => {
        const count = group.userEmails.length
        const emailList = count <= 5 ? group.userEmails.join(', ') : group.userEmails.slice(0, 5).join(', ') + ` and ${count - 5} more`
        
        // If multiple users have the same error, use i18n keys
        if (count > 1) {
            // Check for specific error types to provide better messages
            if (group.code === 'INVALID_REFRESH_TOKEN' || group.message.includes('refresh token has been revoked') || group.message.includes('refresh token is invalid')) {
                return {
                    i18nKey: 'dashboard.errors.invalidRefreshToken',
                    i18nValues: { count, emails: emailList },
                    message: group.message, // Fallback for non-i18n contexts
                    userEmails: group.userEmails,
                    code: group.code,
                    severity: group.severity
                }
            } else if (group.code === 'MISSING_CREDENTIALS' || group.message.includes('Calendar IDs') || group.message.includes('Access Token') || group.message.includes('Refresh Token')) {
                return {
                    i18nKey: 'dashboard.errors.missingCredentials',
                    i18nValues: { count, emails: emailList },
                    message: group.message, // Fallback for non-i18n contexts
                    userEmails: group.userEmails,
                    code: group.code,
                    severity: group.severity
                }
            } else {
                // Extract the base message without user-specific details
                const baseMessage = group.message.replace(/for user [^.]*\./gi, '').replace(/User needs to re-authenticate\./gi, '').trim()
                return {
                    i18nKey: 'dashboard.errors.genericMultiple',
                    i18nValues: { message: baseMessage, count, emails: emailList },
                    message: group.message, // Fallback for non-i18n contexts
                    userEmails: group.userEmails,
                    code: group.code,
                    severity: group.severity
                }
            }
        } else if (count === 1 && group.userEmails[0]) {
            // Single user - keep the original message with user email
            return {
                message: group.message,
                userEmails: group.userEmails,
                code: group.code,
                severity: group.severity
            }
        }
        
        // Fallback for errors without user emails
        return {
            message: group.message,
            userEmails: group.userEmails,
            code: group.code,
            severity: group.severity
        }
    })
}

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
                // Fetch users directly from API to get all Airtable fields (Calendar IDs, Access Token, etc.)
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
                const users = response.data; // Raw Airtable data with uppercase field names
                logger.log('Users:', users)

                // Filter out users who are not Linguists
                const linguists = users.filter(
                    (user) => user.Role === 'Linguist'
                )
                logger.log('Filtered Linguists:', linguists)

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
                            logger.log(
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
                                    // Create error object with code for proper consolidation
                                    const error = new Error(
                                        `The refresh token has been revoked or is no longer valid. User needs to re-authenticate.`
                                    ) as Error & { code?: string; userEmail?: string }
                                    error.code = 'INVALID_REFRESH_TOKEN'
                                    error.userEmail = user.Email
                                    throw error
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
                                    logger.log('Could not connect to n8n workflow. Check your API key environment variable.')
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
                        logger.log(
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
                        // Preserve error code if available, or detect from message
                        let errorCode = (userError as any)?.code
                        if (!errorCode) {
                            if (errorMessage.includes('refresh token') && (errorMessage.includes('revoked') || errorMessage.includes('invalid'))) {
                                errorCode = 'INVALID_REFRESH_TOKEN'
                            } else if (errorMessage.includes('Calendar IDs') || errorMessage.includes('Access Token') || errorMessage.includes('Refresh Token')) {
                                errorCode = 'MISSING_CREDENTIALS'
                            } else {
                                errorCode = 'USER_ERROR'
                            }
                        }
                        newErrors.push({
                            message: errorMessage,
                            userEmail: (userError as any)?.userEmail || user?.Email || null,
                            code: errorCode,
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
            // Consolidate similar errors to avoid showing duplicate messages
            const consolidatedErrors = consolidateErrors(newErrors)
            setErrors(consolidatedErrors)
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
                                    const severity = errorObj.severity || 'error'
                                    const hasI18n = errorObj.i18nKey && errorObj.i18nValues
                                    
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
                                                    {hasI18n ? (
                                                        <p className="text-sm font-medium">
                                                            <FormattedMessage
                                                                id={errorObj.i18nKey}
                                                                values={errorObj.i18nValues}
                                                            />
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-medium">{errorObj.message || 'An unknown error occurred'}</p>
                                                    )}
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

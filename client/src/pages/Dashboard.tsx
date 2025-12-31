import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next' // To show localized strings
import { fetchUserList } from '../auth-users/utils'
import Hero from '../components/Hero'
import LinguistTable from '../components/LinguistTable'
import Skeleton from '../components/Skeleton' // to sisplay while data is loading
import { logger } from '../utils/logger'
import i18n from '../i18n'

// Map error codes to i18n keys
const ERROR_CODE_TO_I18N: Record<string, string> = {
    VAULT_PERMISSION_DENIED: 'dashboard.errors.vaultPermissionDenied',
    VAULT_ERROR: 'dashboard.errors.vaultError',
    TOKEN_NOT_FOUND: 'dashboard.errors.tokenNotFound',
    TOKEN_EXPIRED: 'dashboard.errors.tokenExpired',
    GOOGLE_API_ERROR: 'dashboard.errors.googleApiError',
    MISSING_CREDENTIALS: 'dashboard.errors.missingCredentials',
    INVALID_REFRESH_TOKEN: 'dashboard.errors.invalidRefreshToken',
    NETWORK_ERROR: 'dashboard.errors.networkError',
}

// Consolidate similar errors to avoid showing duplicate messages
function consolidateErrors(
    errors: Array<{
        message: string
        userEmail?: string | null
        code?: string
        severity?: string
    }>
) {
    const errorGroups = new Map<
        string,
        {
            message: string
            userEmails: string[]
            code?: string
            severity?: string
        }
    >()

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
                severity: error.severity || 'error',
            })
        }
    }

    // Convert groups back to error objects with consolidated messages
    return Array.from(errorGroups.values()).map((group) => {
        const count = group.userEmails.length
        const emailList =
            count <= 5
                ? group.userEmails.join(', ')
                : group.userEmails.slice(0, 5).join(', ') +
                  ` and ${count - 5} more`

        // Check if there's a known i18n key for this error code
        const i18nKey = group.code ? ERROR_CODE_TO_I18N[group.code] : null

        // Handle system-wide errors (no user emails) with i18n
        if (i18nKey && count === 0) {
            return {
                i18nKey,
                i18nValues: {},
                message: group.message,
                userEmails: group.userEmails,
                code: group.code,
                severity: group.severity,
            }
        }

        // If multiple users have the same error, use i18n keys
        if (count >= 1 && i18nKey) {
            return {
                i18nKey,
                i18nValues: { count, emails: emailList },
                message: group.message,
                userEmails: group.userEmails,
                code: group.code,
                severity: group.severity,
            }
        }

        // Legacy handling for errors without a mapped code
        if (count > 1) {
            if (group.message.includes('Calendar IDs')) {
                return {
                    i18nKey: 'dashboard.errors.missingCredentials',
                    i18nValues: { count, emails: emailList },
                    message: group.message,
                    userEmails: group.userEmails,
                    code: group.code,
                    severity: group.severity,
                }
            }
            // Extract the base message without user-specific details
            const baseMessage = group.message
                .replace(/for user [^.]*\./gi, '')
                .replace(/User needs to re-authenticate\./gi, '')
                .trim()
            return {
                i18nKey: 'dashboard.errors.genericMultiple',
                i18nValues: {
                    message: baseMessage,
                    count,
                    emails: emailList,
                },
                message: group.message,
                userEmails: group.userEmails,
                code: group.code,
                severity: group.severity,
            }
        }

        // Fallback for errors without user emails or unknown codes
        return {
            message: group.message,
            userEmails: group.userEmails,
            code: group.code,
            severity: group.severity,
        }
    })
}

const Dashboard = ({ userName }) => {
    const { t } = useTranslation()
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
                // Fetch users directly from API to get all Airtable fields (Calendar IDs, etc.)
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/users`
                )
                const users = response.data // Raw Airtable data with uppercase field names
                logger.log('Users:', users)

                // Filter out users who are not Linguists
                const linguists = users.filter(
                    (user) => user.Role === 'Linguist'
                )
                logger.log('Filtered Linguists:', linguists)

                // Get list of users who have tokens in Vault (avoids unnecessary API calls)
                let usersWithTokens: string[] = []
                try {
                    const tokensResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/tokens/list`
                    )
                    usersWithTokens = tokensResponse.data.emails || []
                    logger.log('Users with tokens:', usersWithTokens)
                } catch (tokenError) {
                    // If we can't get the token list, we'll check all users and handle errors individually
                    console.warn(
                        'Could not fetch token list, will check all users:',
                        tokenError
                    )
                }

                // Filter linguists to only those with tokens (if we have the list)
                const linguistsToCheck =
                    usersWithTokens.length > 0
                        ? linguists.filter((user) =>
                              usersWithTokens.includes(user.Email)
                          )
                        : linguists

                // Track linguists without tokens for a consolidated warning
                const linguistsWithoutTokens =
                    usersWithTokens.length > 0
                        ? linguists.filter(
                              (user) => !usersWithTokens.includes(user.Email)
                          )
                        : []

                if (linguistsWithoutTokens.length > 0) {
                    // Push separate errors for each linguist so consolidateErrors can properly count them
                    for (const user of linguistsWithoutTokens) {
                        newErrors.push({
                            message: `No access token found for ${user.Email}. They need to login.`,
                            userEmail: user.Email,
                            code: 'TOKEN_NOT_FOUND',
                            severity: 'warning',
                        })
                    }
                    logger.log(
                        'Linguists without tokens (skipped):',
                        linguistsWithoutTokens.map((u) => u.Email)
                    )
                }

                logger.log(
                    'Linguists to check availability:',
                    linguistsToCheck.map((u) => u.Email)
                )

                for (const user of linguistsToCheck) {
                    try {
                        // Check if the calendar list is present
                        if (!user['Calendar IDs']) {
                            throw new Error(
                                `Calendar IDs not available for user: ${user.Email}. Please ask them to login again with their Google account, select their calendars and click "Save calendars" button in the settings page.`
                            )
                        }
                        const calendarIds = user['Calendar IDs']
                        let availabilityResponse

                        try {
                            // Check availability via Express server (which calls Google Calendar directly)
                            availabilityResponse = await axios.post(
                                `${import.meta.env.VITE_API_URL}/api/calendars/availability`,
                                {
                                    calendarIds: calendarIds,
                                    userEmail: user.Email,
                                },
                                {
                                    headers: {
                                        Accept: 'application/json',
                                    },
                                    timeout: 30000, // 30 seconds
                                }
                            )
                        } catch (error) {
                            // Handle availability API errors gracefully
                            if (error.response) {
                                const errorData = error.response.data || {}
                                const status = error.response.status
                                const errorCode =
                                    errorData.code || 'UNKNOWN_ERROR'

                                // Build user-friendly error message
                                let errorMessage = `Unable to check availability for ${user.Email || user.Name || 'user'}. `
                                errorMessage +=
                                    errorData.details ||
                                    errorData.error ||
                                    'An error occurred while checking availability.'

                                newErrors.push({
                                    message: errorMessage,
                                    userEmail: user.Email,
                                    code: errorCode,
                                    severity:
                                        status >= 500 ? 'error' : 'warning',
                                })
                                console.warn(
                                    `Availability error for ${user.Email}:`,
                                    errorData
                                )
                                continue // Skip to the next user
                            } else if (error.request) {
                                // Network error
                                newErrors.push({
                                    message: `Unable to reach availability service for ${user.Email || user.Name || 'user'}. The service may be down.`,
                                    userEmail: user.Email,
                                    code: 'NETWORK_ERROR',
                                    severity: 'error',
                                })
                                continue // Skip to the next user
                            } else if (
                                error.code === 'ECONNABORTED' ||
                                error.message?.includes('timeout')
                            ) {
                                // Timeout error
                                newErrors.push({
                                    message: `Request timed out for ${user.Email || user.Name || 'user'}.`,
                                    userEmail: user.Email,
                                    code: 'TIMEOUT_ERROR',
                                    severity: 'warning',
                                })
                                continue // Skip to the next user
                            } else {
                                // Other errors
                                newErrors.push({
                                    message: `Unexpected error for ${user.Email || user.Name || 'user'}: ${error.message || 'Unknown error'}`,
                                    userEmail: user.Email,
                                    code: 'UNEXPECTED_ERROR',
                                    severity: 'error',
                                })
                                continue // Skip to the next user
                            }
                        }

                        const availability = availabilityResponse.data
                        logger.log(
                            'Availability for',
                            user.Email,
                            ':',
                            availability
                        )

                        // Check if the response contains an error from n8n workflow
                        if (
                            availability?.error ||
                            availability?.errorMessage ||
                            availability?.message?.includes('error')
                        ) {
                            const errorMsg =
                                availability.errorMessage ||
                                availability.error ||
                                availability.message ||
                                'Unknown workflow error'
                            newErrors.push({
                                message: `Workflow error for ${user.Email}: ${errorMsg}`,
                                userEmail: user.Email,
                                code: 'N8N_WORKFLOW_ERROR',
                                severity: 'error',
                            })
                            continue // Skip to next user
                        }

                        // Collect the user with availability (batch update later)
                        processedLinguists.push({ ...user, availability })
                    } catch (userError) {
                        console.warn(userError)
                        // Ensure error is formatted as an object
                        const errorMessage =
                            userError.message ||
                            userError.toString() ||
                            'An unknown error occurred'
                        // Preserve error code if available, or detect from message
                        let errorCode = (userError as any)?.code
                        if (!errorCode) {
                            if (
                                errorMessage.includes('refresh token') &&
                                (errorMessage.includes('revoked') ||
                                    errorMessage.includes('invalid'))
                            ) {
                                errorCode = 'INVALID_REFRESH_TOKEN'
                            } else if (
                                errorMessage.includes('Calendar IDs') ||
                                errorMessage.includes('token') ||
                                errorMessage.includes('Token')
                            ) {
                                errorCode = 'MISSING_CREDENTIALS'
                            } else {
                                errorCode = 'USER_ERROR'
                            }
                        }
                        newErrors.push({
                            message: errorMessage,
                            userEmail:
                                (userError as any)?.userEmail ||
                                user?.Email ||
                                null,
                            code: errorCode,
                            severity: 'error',
                        })
                    }
                }

                // Add linguists without tokens to the list with a "needs login" status
                for (const user of linguistsWithoutTokens) {
                    processedLinguists.push({
                        ...user,
                        availability: {
                            isAvailable: false,
                            needsLogin: true,
                            freeSlots: [],
                            totalFreeHours: 0,
                            workingDays: 0,
                            hoursPerDay: {},
                        },
                    })
                }
            } catch (error) {
                console.error('Error fetching linguists:', error)
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error'
                newErrors.push({
                    message: 'Error fetching linguists: ' + errorMessage,
                    code: 'FETCH_ERROR',
                    severity: 'error',
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
                        {t('dashboard.linguistsDescription', {
                            date: new Date(
                                Date.now() + 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString(
                                i18n.language === 'zh-cn'
                                    ? 'zh-CN'
                                    : i18n.language,
                                {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                }
                            ),
                        })}
                        <span className="block">
                            {t('dashboard.availabilityDescription')}
                        </span>
                    </p>
                    {/* Show error messages if any */}
                    {errors.length > 0 && (
                        <div className="max-w-3xl mx-auto mb-4">
                            {errors
                                .filter((error) => {
                                    // Filter out errors without messages
                                    const message =
                                        typeof error === 'string'
                                            ? error
                                            : error?.message
                                    return message && message.trim().length > 0
                                })
                                .map((error, index) => {
                                    // Normalize error format - handle both string and object formats
                                    const errorObj =
                                        typeof error === 'string'
                                            ? {
                                                  message: error,
                                                  severity: 'error',
                                              }
                                            : error
                                    const severity =
                                        errorObj.severity || 'error'
                                    const hasI18n =
                                        errorObj.i18nKey && errorObj.i18nValues

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
                                                        <svg
                                                            className="h-5 w-5 text-red-400"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="h-5 w-5 text-yellow-400"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    {hasI18n ? (
                                                        <p className="text-sm font-medium">
                                                            {t(
                                                                errorObj.i18nKey,
                                                                errorObj.i18nValues
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-medium">
                                                            {errorObj.message ||
                                                                t(
                                                                    'dashboard.errors.unknownError'
                                                                )}
                                                        </p>
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

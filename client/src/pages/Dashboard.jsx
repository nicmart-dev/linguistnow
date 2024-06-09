import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FormattedMessage } from 'react-intl' // To show localized strings
import { refreshAccessToken, isAccessTokenValid } from '../auth-users/utils' // To refresh access token when needed
import { fetchUserList } from '../auth-users/utils'
import Hero from '../components/Hero'

const Dashboard = ({ userName }) => {
    const [linguists, setLinguists] = useState([]) // store list of users retrieved from Airtable
    /* Get list of linguists at page load from Airtable  and 
    for each check their availability using n8n workflow. 
    */

    useEffect(() => {
        const fetchLinguists = async () => {
            const newErrors = [] // Errors stored as we loop through each user

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
                            accessToken = await refreshAccessToken(
                                user['Refresh Token']
                            )

                            // Save the new access token to Airtable
                            await axios.put(
                                `${process.env.REACT_APP_API_URL}/api/users/${user.Email}`,
                                {
                                    googleAccessToken: accessToken,
                                }
                            )
                        }

                        try {
                            // Trigger N8n workflow to get availability for each user
                            availabilityResponse = await axios.post(
                                `${process.env.REACT_APP_API_URL}/api/calendars/free`,
                                {
                                    calendarIds: calendarIds,
                                    accessToken: accessToken,
                                }
                            )
                        } catch (error) {
                            // Check if could not authenticate to execute n8n workflow
                            if (
                                error.response &&
                                error.response.status === 401
                            ) {
                                console.log(
                                    'Could not connect to n8n workflow. Check your API key environment variable.'
                                )
                                continue // Skip to the next user
                            } else {
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

                        // Add the user with availability to the linguists state
                        setLinguists((prevLinguists) => [
                            ...prevLinguists,
                            { ...user, availability },
                        ])
                    } catch (userError) {
                        console.warn(userError)
                        newErrors.push(userError.message)
                    }
                }
            } catch (error) {
                console.error('Error fetching linguists:', error)
                newErrors.push('Error fetching linguists: ' + error.message)
            }
        }

        fetchLinguists()
    }, [])

    /* Show available linguists in a table. */
    return (
        <>
            <Hero userName={userName} />
            <div className="items-center justify-center h-screen bg-gray-100">
                <p className="max-w-3xl mx-auto mb-5 text-lg text-black">
                    <FormattedMessage id="dashboard.linguistsDescription" />
                    <span className="block">
                        <FormattedMessage
                            id="dashboard.availabilityDescription"
                            values={{
                                ts: Date.now() + 7 * 24 * 60 * 60 * 1000,
                            }}
                        />
                    </span>
                </p>
                <table className="mt-4 border-collapse border border-gray-800">
                    <thead>
                        <tr>
                            <th className="border border-gray-800 p-2">
                                <FormattedMessage id="accountSettings.name" />
                            </th>
                            <th className="border border-gray-800 p-2">
                                <FormattedMessage id="accountSettings.email" />
                            </th>
                            <th className="border border-gray-800 p-2">
                                <FormattedMessage id="dashboard.availability" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {linguists.map((linguist) => (
                            <tr key={linguist.Email}>
                                <td className="border border-gray-800 p-2">
                                    {linguist.Name}
                                </td>
                                <td className="border border-gray-800 p-2">
                                    {linguist.Email}
                                </td>
                                <td className="border border-gray-800 p-2">
                                    {linguist.availability[0].result ? (
                                        <FormattedMessage id="dashboard.available" />
                                    ) : (
                                        <FormattedMessage id="dashboard.notAvailable" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default Dashboard

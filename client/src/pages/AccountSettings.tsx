import CalendarSelector from '../components/CalendarSelector'
import { useTranslation } from 'react-i18next' // To show localized strings
import Hero from '../components/Hero'
import { logger } from '../utils/logger'
import { useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import { useState } from 'react'
import { toast } from 'sonner'

/* The AccountSettings component utilizes the CalendarSelector component 
to allow the user to select and save their calendars. */
const AccountSettings = ({ userDetails, setUserDetails }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    /* Save user selected calendars */
    const handleSaveCalendars = async (updatedCalendars) => {
        try {
            // Get email from userDetails - use lowercase 'email' from User type, or fallback to uppercase 'Email' for Airtable compatibility
            const userEmail = userDetails?.email || (userDetails as any)?.Email
            if (!userEmail) {
                console.error(
                    'User email not found in userDetails:',
                    userDetails
                )
                throw new Error('User email is required to save calendars.')
            }

            // Update the user's calendar IDs in Airtable
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/users/${userEmail}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        calendarIds: updatedCalendars,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to save calendars.')
            }

            setUserDetails({
                ...userDetails,
                'Calendar IDs': updatedCalendars.join(','),
            })

            logger.log('Calendars saved.')
        } catch (error) {
            console.error('Failed to save calendars:', error)
        }
    }

    const handleGoToCalendar = () => {
        // Replace 'url' with the URL you want to open
        const url = 'https://calendar.google.com/'
        window.open(url, '_blank')
    }

    const handleDeleteAccount = async () => {
        if (!showConfirmDelete) {
            setShowConfirmDelete(true)
            return
        }

        setIsDeleting(true)
        try {
            // Get email from userDetails - use lowercase 'email' from User type, or fallback to uppercase 'Email' for Airtable compatibility
            const userEmail = userDetails?.email || (userDetails as any)?.Email
            if (!userEmail) {
                console.error(
                    'User email not found in userDetails:',
                    userDetails
                )
                throw new Error('User email is required to delete account.')
            }

            // Delete the user from Airtable and Vault
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/users/${encodeURIComponent(userEmail)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage =
                    errorData.error ||
                    errorData.message ||
                    `Failed to delete account (${response.status})`
                console.error('Delete account error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                })
                throw new Error(errorMessage)
            }

            // Show success toast
            toast.success(
                t(
                    'accountSettings.deleteAccountSuccess',
                    'Account deleted successfully'
                )
            )

            // Logout from Google
            googleLogout()

            // Clear user details and localStorage
            setUserDetails(null)
            localStorage.removeItem('userEmail')

            // Navigate to login page after a short delay
            setTimeout(() => {
                navigate('/login', { replace: true })
            }, 1000)
        } catch (error) {
            console.error('Failed to delete account:', error)
            setIsDeleting(false)
            setShowConfirmDelete(false)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t(
                          'accountSettings.deleteAccountError',
                          'Failed to delete account. Please try again.'
                      )
            toast.error(errorMessage)
        }
    }

    return (
        <>
            <Hero userName={userDetails.Name} cta={handleGoToCalendar} />
            <main className="container mx-auto px-3 mb-5">
                <div>
                    <p className="max-w-3xl text-lg text-black my-4">
                        {t('accountSettings.selectCalendars')}
                        &nbsp;
                    </p>
                    <p className="max-w-3xl text-lg text-black my-4">
                        {t('accountSettings.notReadingEvents')}
                    </p>

                    {userDetails && (
                        <>
                            {/* Pass user details to child component to display list of calendars,
            as well as function it can call when saving selected calendars. */}
                            <CalendarSelector
                                userDetails={userDetails}
                                onSave={handleSaveCalendars}
                            />

                            {/* Delete Account Section */}
                            <div className="max-w-3xl mt-8 pt-8 border-t border-gray-300">
                                <h2 className="text-xl font-semibold text-red-600 mb-4">
                                    {t(
                                        'accountSettings.deleteAccountTitle',
                                        'Delete Account'
                                    )}
                                </h2>
                                <p className="text-lg text-black mb-4">
                                    {t(
                                        'accountSettings.deleteAccountDescription',
                                        'Permanently delete your account and all associated data. This action cannot be undone.'
                                    )}
                                </p>
                                {!showConfirmDelete ? (
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t(
                                            'accountSettings.deleteAccountButton',
                                            'Delete My Account'
                                        )}
                                    </button>
                                ) : (
                                    <div>
                                        <p className="text-lg text-red-600 font-semibold mb-4">
                                            {t(
                                                'accountSettings.deleteAccountConfirm',
                                                'Are you sure you want to delete your account? This action cannot be undone.'
                                            )}
                                        </p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isDeleting
                                                    ? t(
                                                          'accountSettings.deleting',
                                                          'Deleting...'
                                                      )
                                                    : t(
                                                          'accountSettings.confirmDelete',
                                                          'Yes, Delete My Account'
                                                      )}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setShowConfirmDelete(false)
                                                }
                                                disabled={isDeleting}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t(
                                                    'accountSettings.cancel',
                                                    'Cancel'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    )
}

export default AccountSettings

import CalendarSelector from '../components/CalendarSelector'
import { useTranslation } from 'react-i18next' // To show localized strings
import Hero from '../components/Hero'
import { logger } from '../utils/logger'

/* The AccountSettings component utilizes the CalendarSelector component 
to allow the user to select and save their calendars. */
const AccountSettings = ({ userDetails, setUserDetails }) => {
    const { t } = useTranslation()
    /* Save user selected calendars */
    const handleSaveCalendars = async (updatedCalendars) => {
        try {
            // Get email from userDetails - use lowercase 'email' from User type, or fallback to uppercase 'Email' for Airtable compatibility
            const userEmail = userDetails?.email || (userDetails as any)?.Email;
            if (!userEmail) {
                console.error('User email not found in userDetails:', userDetails);
                throw new Error('User email is required to save calendars.');
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
            });

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
                        </>
                    )}
                </div>
            </main>
        </>
    )
}

export default AccountSettings

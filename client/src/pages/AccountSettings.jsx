import CalendarSelector from '../components/CalendarSelector'
import { FormattedMessage } from 'react-intl' // To show localized strings
import Hero from '../components/Hero'

/* The AccountSettings component utilizes the CalendarSelector component 
to allow the user to select and save their calendars. */
const AccountSettings = ({ userDetails, setUserDetails }) => {
    /* Save user selected calendars */
    const handleSaveCalendars = async (updatedCalendars) => {
        try {
            // Update the user's calendar IDs in Airtable
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/users/${userDetails.Email}`,
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

            console.log('Calendars saved.')
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
            <div>
                <p className="max-w-3xl mx-auto mb-5 text-lg text-black mt-4">
                    <FormattedMessage id="accountSettings.selectCalendars" />
                    <span className="block">
                        <FormattedMessage id="accountSettings.automaticSave" />
                    </span>
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
        </>
    )
}

export default AccountSettings

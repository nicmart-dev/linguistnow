import CalendarSelector from '../components/CalendarSelector'
import { useIntl } from 'react-intl'
import Hero from '../components/Hero'

/* The AccountSettings component utilizes the CalendarSelector component 
to allow the user to select and save their calendars. */
const AccountSettings = ({ userDetails, setUserDetails }) => {
    const intl = useIntl()

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

    return (
        <>
            <Hero userName={userDetails.Name} />
            <div>
                <p className="max-w-3xl mx-auto mb-5 text-lg text-black mt-4">
                    Select the calendars we need to check availability against.
                    <span className="block">
                        Your choices are automatically saved.
                    </span>
                </p>
                <h2>
                    {intl.formatMessage({
                        id: 'accountSettings.accountSettings',
                    })}
                </h2>
                {userDetails && (
                    <>
                        <h3>
                            {intl.formatMessage({
                                id: 'accountSettings.userDetails',
                            })}
                        </h3>
                        <p>
                            {intl.formatMessage({
                                id: 'accountSettings.email',
                            })}{' '}
                            {userDetails.Email}
                        </p>
                        <p>
                            {intl.formatMessage({ id: 'accountSettings.name' })}{' '}
                            {userDetails.Name}
                        </p>
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

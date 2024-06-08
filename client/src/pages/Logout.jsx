import React, { useState, useEffect } from 'react'
import { googleLogout } from '@react-oauth/google'
import Login from './Login'
import { FormattedMessage } from 'react-intl'

const Logout = ({ setUserDetails }) => {
    const [loggedOut, setLoggedOut] = useState(false) // State to track logout status

    useEffect(() => {
        // Execute logout process on component mount
        handleLogout()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array to ensure this effect runs only once on mount

    const handleLogout = () => {
        googleLogout()
        setUserDetails(null) // Clear user details upon logout
        setLoggedOut(true) // Set logged out state to true
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            {loggedOut ? (
                <>
                    <p>
                        <FormattedMessage id="youHaveBeenLoggedOut" />
                    </p>
                    <Login setUserDetails={setUserDetails} />
                </>
            ) : (
                <p>
                    <FormattedMessage id="loggingOut" />
                </p>
            )}
        </div>
    )
}

export default Logout
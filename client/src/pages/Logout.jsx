import React, { useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'
import { FormattedMessage } from 'react-intl'

const Logout = ({ setUserDetails, userDetails }) => {
    const [userName, setUserName] = useState('') // store user name so we can display it after logout
    const navigate = useNavigate() // Hook to navigate to different routes

    useEffect(() => {
        // Check if the user was logged in before attempting logout
        if (userDetails) {
            handleLogout()
        } else {
            // Navigate to the login page if user details are not available
            navigate('/login')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogout = () => {
        googleLogout()
        setUserName(userDetails?.Name) // Store user name to display on logout
        setUserDetails(null) // Clear user details upon logout
    }

    return (
        <>
            <Hero userName={userName} />
            <main className="container mx-auto px-3 mb-5">
                <p className="max-w-3xl text-lg text-black mt-4">
                    <FormattedMessage id="logoutSuccessMessage" />
                </p>
            </main>
        </>
    )
}

export default Logout

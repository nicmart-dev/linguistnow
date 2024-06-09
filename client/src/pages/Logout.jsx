import React, { useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'

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
            <p className="max-w-3xl mx-auto mb-5 text-lg text-black mt-4">
                You have been successfully logged out. We hope to see you again
                soon.
            </p>
        </>
    )
}

export default Logout

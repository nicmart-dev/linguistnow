import React, { useEffect } from 'react'
import { googleLogout } from '@react-oauth/google'
import Hero from '../components/Hero'

const Logout = ({ setUserDetails }) => {
    useEffect(() => {
        // Execute logout process on component mount
        handleLogout()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array to ensure this effect runs only once on mount

    const handleLogout = () => {
        googleLogout()
        setUserDetails(null) // Clear user details upon logout
    }

    return (
        <>
            <Hero />
            <p className="max-w-3xl mx-auto mb-5 text-lg text-black mt-4">
                You have been successfully logged out. We hope to see you again
                soon.
            </p>
        </>
    )
}

export default Logout

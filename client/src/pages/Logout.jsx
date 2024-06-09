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
        </>
    )
}

export default Logout

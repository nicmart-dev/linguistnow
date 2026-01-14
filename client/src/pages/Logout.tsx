import React, { useCallback, useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import Hero from '@/components/organisms/Hero'
import { useTranslation } from 'react-i18next'
import type { AirtableUserFields } from '@linguistnow/shared'

/**
 * Logout page component that handles Google OAuth logout flow.
 * @param props - Component props
 * @param props.setUserDetails - Callback to update user state
 * @param props.userDetails - Current user details or null
 * @returns Logout confirmation UI with Hero component
 */
interface LogoutProps {
    setUserDetails: (user: AirtableUserFields | null) => void
    userDetails: AirtableUserFields | null
}

export const Logout: React.FC<LogoutProps> = ({
    setUserDetails,
    userDetails,
}) => {
    const { t } = useTranslation()
    const [userName, setUserName] = useState('') // store user name so we can display it after logout
    const navigate = useNavigate() // Hook to navigate to different routes

    const handleLogout = useCallback(() => {
        googleLogout()
        setUserName(userDetails?.Name || '') // Store user name to display on logout
        setUserDetails(null) // Clear user details upon logout
        // Clear stored email from localStorage
        localStorage.removeItem('userEmail')
    }, [setUserDetails, setUserName, userDetails?.Name])

    useEffect(() => {
        // Check if the user was logged in before attempting logout
        if (userDetails) {
            handleLogout()
        } else {
            // Navigate to the login page if user details are not available
            navigate('/login')
        }
    }, [navigate, userDetails, handleLogout])

    return (
        <>
            <Hero userName={userName} />
            <main className="container mx-auto px-3 mb-5">
                <p className="max-w-3xl text-lg text-black mt-4">
                    {t('auth.logoutSuccessMessage')}
                </p>
            </main>
        </>
    )
}

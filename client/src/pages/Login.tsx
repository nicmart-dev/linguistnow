import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { fetchUserDetails, createUserIfNotFound } from '../auth-users/utils'
import Hero from '../components/Hero'
import { logger } from '../utils/logger'

const Login = ({ setUserDetails }) => {
    const navigate = useNavigate()

    const handleGoogleLoginSuccess = async (response) => {
        const { code } = response // Extract the authorization code

        try {
            // Fetch user info from Google first (we need email for token exchange)
            // We'll use a temporary token from the code exchange
            const tokenResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/google/code`,
                { code }
            )
            const { accessToken } = tokenResponse.data

            // Fetch user info from Google
            const userInfoResponse = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )

            const userInfo = userInfoResponse.data
            logger.log(`Login successful for ${userInfo.email}`)

            // Tokens are already stored in Vault by backend (backend fetches email if not provided)

            /* Get user info from Google email, creating new user if it doesn't exist, 
      and save user info in parent state */
            let fetchedUserDetails: any = null
            try {
                // Get latest user details from Airtable, save in parent state
                await fetchUserDetails(userInfo.email, (user) => {
                    fetchedUserDetails = user
                    setUserDetails(user)
                })
            } catch (error) {
                // Create the user if not found and save to state
                if (error.response && error.response.status === 404) {
                    await createUserIfNotFound(userInfo, (user) => {
                        fetchedUserDetails = user
                        setUserDetails(user)
                    })
                } else {
                    console.error('An error occurred:', error)
                }
            }
            setUserDetails((prevDetails) => {
                // Use fetchedUserDetails if available, otherwise fall back to prevDetails
                const baseDetails = fetchedUserDetails || prevDetails

                if (!baseDetails) {
                    // If no previous details, create a minimal user object
                    return {
                        id: userInfo.email,
                        email: userInfo.email,
                        name: userInfo.name,
                        role: 'Linguist' as const,
                        Email: userInfo.email,
                        Name: userInfo.name,
                        Role: 'Linguist',
                    } as any
                }
                // Preserve all existing fields (including Calendar IDs)
                // Preserve all existing fields (including Calendar IDs)
                // Tokens are stored in Vault, not in state
                return baseDetails
            })

            // Store user email in localStorage for persistence across page refreshes
            localStorage.setItem('userEmail', userInfo.email)

            // Clear calendar session expired flag on successful login
            localStorage.removeItem('calendarSessionExpired')

            navigate('/') // navigate to Home route when further routing will be handled
        } catch (error) {
            console.error('Error during login process:', error)
        }
    }

    const login = useGoogleLogin({
        onSuccess: handleGoogleLoginSuccess,
        onError: (error) => {
            logger.log('Login Failed:', error)
        },
        flow: 'auth-code',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar.readonly',
        ].join(' '), // Make sure access token we will get will get access to these scopes
        redirect_uri: `${import.meta.env.VITE_BASE_URL}`,
        onNonOAuthError: () => {}, // Ignore any non-OAuth errors
    })

    /* Show custom hero with cta to show Google login popup */
    return (
        <>
            <Hero cta={login} />
            <main className="container mx-auto px-3 mb-20"></main>
        </>
    )
}

export default Login

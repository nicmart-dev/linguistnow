import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import axios from 'axios' // TODO replace all axios calls with fetch globally
import { fetchUserDetails, createUserIfNotFound } from '../auth/utils'
import Hero from '../components/Hero.jsx'

const Login = ({ setUserDetails }) => {
    const navigate = useNavigate()

    const handleGoogleLoginSuccess = async (response) => {
        console.log('Google Login Success:', response)
        /* Sample response:
    {
    "code": "4/0AdLIrYdoh19k1VkeCH7wYtKir_oRqF...",
    "scope": "email profile openid https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    "authuser": "0",
    "prompt": "consent"
}
    */
        const { code } = response // Extract the authorization code

        try {
            // Send the authorization code to the backend to exchange for tokens
            const tokenResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/google/code`,
                { code }
            )
            console.log(
                'Google access and refresh tokens from server:',
                tokenResponse.data
            )
            const { accessToken, refreshToken } = tokenResponse.data

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
            console.log('User Info from Google:', userInfo)

            /* Get user info from Google email, creating new user if it doesn't exist, 
      and save user info in parent state */
            try {
                // Get latest user details from Airtable, save in parent state
                await fetchUserDetails(userInfo.email, setUserDetails)
            } catch (error) {
                // Create the user if not found and save to state
                if (error.response && error.response.status === 404) {
                    await createUserIfNotFound(userInfo, setUserDetails)
                } else {
                    console.error('An error occurred:', error)
                }
            } finally {
                // Update the user's access and refresh tokens in DB
                console.log('Updating user tokens in Airtable...')
                await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/users/${userInfo.email}`,
                    {
                        googleAccessToken: accessToken,
                        googleRefreshToken: refreshToken,
                    }
                )
                // Update user access tokens in the parent state
                console.log('Updating user details in state...')
                await setUserDetails((prevDetails) => ({
                    ...prevDetails,
                    'Access Token': accessToken,
                    'Refresh Token': refreshToken,
                }))

                navigate('/') // navigate to Home route when further routing will be handled
            }
        } catch (error) {
            console.error('Error during login process:', error)
        }
    }

    const login = useGoogleLogin({
        onSuccess: handleGoogleLoginSuccess,
        onError: (error) => console.log('Login Failed:', error),
        flow: 'auth-code',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar.readonly',
        ].join(' '), // Make sure access token we will get will get access to these scopes
        redirect_uri: `${process.env.REACT_APP_BASE_URL}`,
        onNonOAuthError: () => {}, // Ignore any non-OAuth errors
    })

    /* Show custom hero with cta to show Google login popup */
    return (
        <>
            <Hero cta={login} />
            <p className="max-w-3xl mx-auto mb-5 text-lg text-black mt-4">
                Just log in to your Google account, select your calendars, and
                we'll take care of the rest:
            </p>
        </>
    )
}

export default Login

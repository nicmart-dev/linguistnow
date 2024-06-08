import React from 'react'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import axios from 'axios' // TODO replace all axios calls with fetch globally
import { fetchUserDetails } from '../auth/utils'

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

            // Variable to store fetched user details
            let fetchedUserDetails

            /* Get user info from Google email, creating new user if it doesn't exist, 
      and save user info in parent state */
            try {
                // Get latest user details from Airtable, save in parent state
                fetchedUserDetails = await fetchUserDetails(
                    userInfo.email,
                    setUserDetails
                )
            } catch (error) {
                // If the user does not exist, create a new user
                if (error.response && error.response.status === 404) {
                    console.log('User not found, creating a new user...')
                    await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/users`,
                        {
                            email: userInfo.email,
                            name: userInfo.name,
                            picture_url: userInfo.picture,
                        }
                    )
                    // Fetch user details again after creating the user
                    fetchedUserDetails = await fetchUserDetails(
                        userInfo.email,
                        setUserDetails
                    )
                } else {
                    console.error('Error checking user existence:', error)
                    throw error
                }
            } finally {
                // Update the user's access and refresh tokens in
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

                // Access role from fetched user details
                const userRole = fetchedUserDetails?.Role

                // Route user to different page depending on their role
                const isProjectManager = userRole === 'Project Manager'
                if (isProjectManager) {
                    // Redirect to the dashboard view if so
                    console.log(
                        'User has Project Manager role, redirecting to dashboard...'
                    )
                    navigate('/dashboard')
                } else {
                    // Otherwise redirect to the settings page so user can change their calendars
                    console.log(
                        `User has ${userRole} role, redirecting to settings...`
                    )
                    navigate('/settings')
                }
            }
        } catch (error) {
            console.error('Error during login process:', error)
        }
    }

    const login = useGoogleLogin({
        onSuccess: handleGoogleLoginSuccess,
        flow: 'auth-code',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar.readonly',
        ].join(' '), // Make sure access token we will get will get access to these scopes
        redirect_uri: `${process.env.REACT_APP_BASE_URL}`,
    })

    return (
        <div>
            <h2>Login Page</h2>
            {/* <GoogleLogin
        onSuccess={login}
        onError={(error) => console.error("Login Failed:", error)}
        auto_select // Automatically select the first account
        useOneTap // Use Google One Tap
      /> */}

            <button
                aria-label="Sign in with Google"
                className="flex items-center bg-white border border-button-border-light rounded-full p-0.5 pr-4"
                onClick={login}
            >
                <div className="flex items-center justify-center bg-white w-9 h-9 rounded-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                    >
                        <title>Sign in with Google</title>
                        <desc>Google G Logo</desc>
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            className="fill-google-logo-blue"
                        ></path>
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            className="fill-google-logo-green"
                        ></path>
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            className="fill-google-logo-yellow"
                        ></path>
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            className="fill-google-logo-red"
                        ></path>
                    </svg>
                </div>
                <span className="text-sm text-google-text-gray tracking-wider ml-2">
                    Sign in with Google
                </span>
            </button>
        </div>
    )
}

export default Login

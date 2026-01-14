import React, { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import Login from '@/pages/Login'
import AccountSettings from '@/pages/AccountSettings'
import Dashboard from '@/pages/Dashboard'
import Navbar from '@/components/organisms/Navbar'
import { GoogleOAuthProvider } from '@react-oauth/google' // Package used to manage Google OAuth
import LanguageProvider from '@/i18n/LanguageProvider' // Package used to manage translations
import { Logout } from '@/pages/Logout'
import Footer from '@/components/organisms/Footer'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import ScrollToTop from '@/components/organisms/ScrollToTop'
import type { User } from '@linguistnow/shared'
import { fetchUserDetails } from '@/auth-users/utils'

/**
 * Main application component that handles authentication state and routing.
 * Validates Google OAuth configuration and renders the application content.
 * @param setUserDetails - Function to update the current user details state
 * @param userDetails - Current user details or null if not authenticated
 * @param isRestoringAuth - Boolean indicating if authentication state is being restored
 * @param setIsRestoringAuth - Function to update the auth restoration state
 * @param googleClientId - Google OAuth client ID from environment variables
 * @returns JSX.Element - The application component tree or configuration error message
 */
export const App = ({
    setUserDetails,
    userDetails,
    isRestoringAuth,
    setIsRestoringAuth,
    googleClientId,
}: {
    setUserDetails: (user: User | null) => void;
    userDetails: User | null;
    isRestoringAuth: boolean;
    setIsRestoringAuth: (value: boolean) => void;
    googleClientId: string;
}) => {
    // If Google Client ID is missing, show error instead of crashing
    if (!googleClientId) {
        return (
            <LanguageProvider>
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Configuration Error
                        </h1>
                        <p className="text-gray-700 mb-4">
                            Google OAuth Client ID is not configured. Please set{' '}
                            <code className="bg-gray-100 px-2 py-1 rounded">
                                VITE_GOOGLE_CLIENT_ID
                            </code>{' '}
                            in your environment variables.
                        </p>
                        <p className="text-sm text-gray-500">
                            See <code>client/example.env</code> for configuration details.
                        </p>
                    </div>
                </div>
            </LanguageProvider>
        )
    }

    return <AppContent setUserDetails={setUserDetails} userDetails={userDetails} isRestoringAuth={isRestoringAuth} setIsRestoringAuth={setIsRestoringAuth} googleClientId={googleClientId} />
}

/**
 * Application content component that provides OAuth and routing context.
 * Handles authentication state restoration and renders the main application routes.
 * @param setUserDetails - Function to update the current user details state
 * @param userDetails - Current user details or null if not authenticated
 * @param isRestoringAuth - Boolean indicating if authentication state is being restored
 * @param setIsRestoringAuth - Function to update the auth restoration state
 * @param googleClientId - Google OAuth client ID from environment variables
 * @returns JSX.Element - The application content with routing and providers
 */
const AppContent = ({ setUserDetails, userDetails, isRestoringAuth, setIsRestoringAuth, googleClientId }: { setUserDetails: (user: User | null) => void, userDetails: User | null, isRestoringAuth: boolean, setIsRestoringAuth: (value: boolean) => void, googleClientId: string }) => {
    const { t } = useTranslation()

    useEffect(() => {
        // Restore authentication state from localStorage on mount
        const storedEmail = localStorage.getItem('userEmail')
        if (storedEmail) {
            // Fetch user details from API to restore authentication state
            fetchUserDetails(storedEmail, (user) => {
                setUserDetails(user)
                setIsRestoringAuth(false)
            }).catch(() => {
                // If user not found or error, clear stored email
                localStorage.removeItem('userEmail')
                setIsRestoringAuth(false)
            })
        } else {
            setIsRestoringAuth(false)
        }
    }, [setUserDetails, setIsRestoringAuth])

    return (
        /* Wraps the application to provide the OAuth context */
        <GoogleOAuthProvider
            clientId={googleClientId}
        >
            <LanguageProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <Navbar userDetails={userDetails} />
                    <Routes>
                        {/* Ask user to log in when landing on site, then if role
                        is PM go to Dashboard, otherwise to Settings page */}
                        <Route
                            path="/"
                            element={
                                isRestoringAuth ? (
                                    <div>{t('general.loading')}</div>
                                ) : userDetails ? (
                                    userDetails.role === 'Project Manager' ? (
                                        <Navigate to="/dashboard" replace />
                                    ) : (
                                        <Navigate to="/settings" replace />
                                    )
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/login"
                            element={<Login setUserDetails={setUserDetails} />}
                        />
                        <Route
                            path="/logout"
                            element={
                                <Logout
                                    setUserDetails={setUserDetails}
                                    userDetails={userDetails}
                                />
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute
                                    userDetails={userDetails}
                                    isRestoringAuth={isRestoringAuth}
                                    element={
                                        userDetails ? (
                                            <Dashboard
                                                userName={userDetails.name}
                                            />
                                        ) : (
                                            <Navigate to="/login" />
                                        )
                                    }
                                />
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <PrivateRoute
                                    userDetails={userDetails}
                                    isRestoringAuth={isRestoringAuth}
                                    element={
                                        <AccountSettings
                                            userDetails={userDetails}
                                            setUserDetails={setUserDetails}
                                        />
                                    }
                                />
                            }
                        />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                    </Routes>
                    <Footer />
                    <Toaster position="top-right" />
                </BrowserRouter>
            </LanguageProvider>
        </GoogleOAuthProvider>
    )
}

/**
 * Route protection component that ensures authentication before rendering protected routes.
 * Waits for authentication state restoration and redirects to login if not authenticated.
 * @param element - The React element to render if authenticated
 * @param userDetails - Current user details or null if not authenticated
 * @param isRestoringAuth - Boolean indicating if authentication state is being restored
 * @returns JSX.Element - The protected element if authenticated, loading state during restoration, or redirect to login
 */
interface PrivateRouteProps {
    element: React.ReactElement
    userDetails: User | null
    isRestoringAuth: boolean
}

const PrivateRoute = ({
    element,
    userDetails,
    isRestoringAuth,
}: PrivateRouteProps) => {
    const { t } = useTranslation()
    // Wait for auth restoration to complete before checking authentication
    if (isRestoringAuth) {
        return <div>{t('general.loading')}</div>
    }
    return userDetails ? element : <Navigate to="/login" />
}

// App wrapper component that initializes state and validates configuration
const AppWrapper = () => {
    const [userDetails, setUserDetails] = useState<User | null>(null)
    const [isRestoringAuth, setIsRestoringAuth] = useState(true)

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

    return (
        <App
            setUserDetails={setUserDetails}
            userDetails={userDetails}
            isRestoringAuth={isRestoringAuth}
            setIsRestoringAuth={setIsRestoringAuth}
            googleClientId={googleClientId}
        />
    )
}

export default AppWrapper

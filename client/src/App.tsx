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

const App = () => {
    const { t } = useTranslation()
    const [userDetails, setUserDetails] = useState<User | null>(null)
    const [isRestoringAuth, setIsRestoringAuth] = useState(true)

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
    }, [])

    return (
        /* Wraps the application to provide the OAuth context */
        <GoogleOAuthProvider
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}
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

/* Protects the routes that require authentication. */
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

export default App

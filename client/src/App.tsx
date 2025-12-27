import React, { useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AccountSettings from './pages/AccountSettings'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import { GoogleOAuthProvider } from '@react-oauth/google' // Package used to manage Google OAuth
import LanguageProvider from './i18n/LanguageProvider' // Package used to manage translations
import Logout from './pages/Logout'
import Footer from './components/Footer'
import PrivacyPolicy from './pages/PrivacyPolicy'
import type { User } from '@linguistnow/shared'

const App = () => {
    const [userDetails, setUserDetails] = useState<User | null>(null)

    return (
        /* Wraps the application to provide the OAuth context */
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <BrowserRouter>
                    <Navbar userDetails={userDetails} />
                    <Routes>
                        {/* Ask user to log in when landing on site, then if role
                        is PM go to Dashboard, otherwise to Settings page */}
                        <Route
                            path="/"
                            element={
                                userDetails ? (
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
                </BrowserRouter>
            </LanguageProvider>
        </GoogleOAuthProvider>
    )
}

/* Protects the routes that require authentication. */
interface PrivateRouteProps {
    element: React.ReactElement
    userDetails: User | null
}

const PrivateRoute = ({ element, userDetails }: PrivateRouteProps) => {
    return userDetails ? element : <Navigate to="/login" />
}

export default App

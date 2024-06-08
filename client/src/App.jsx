import React, { useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Navbar from './components/Navbar.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google' // Package used to manage Google OAuth
import LanguageProvider from './i18n/LanguageProvider' // Package used to manage translations

const App = () => {
    const [userDetails, setUserDetails] = useState(null)

    return (
        /* Wraps the application to provide the OAuth context */
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <BrowserRouter>
                    {/* Need to log in at start */}
                    {!userDetails ? <Navigate to="/login" /> : null}
                    <Navbar userDetails={userDetails} />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/login"
                            element={<Login setUserDetails={setUserDetails} />}
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute
                                    userDetails={userDetails}
                                    element={<Dashboard />}
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
                    </Routes>
                </BrowserRouter>
            </LanguageProvider>
        </GoogleOAuthProvider>
    )
}

/* Protects the routes that require authentication. */
const PrivateRoute = ({ element, userDetails }) => {
    return userDetails ? element : <Navigate to="/login" />
}

export default App

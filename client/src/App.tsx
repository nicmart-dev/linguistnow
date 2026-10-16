import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    BrowserRouter,
    Route,
    Routes,
    Navigate,
    useNavigate,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster, toast } from 'sonner'
import Login from '@/pages/Login'
import AccountSettings from '@/pages/AccountSettings'
import Dashboard from '@/pages/Dashboard'
import Navbar from '@/components/organisms/Navbar'
import { GoogleOAuthProvider } from '@react-oauth/google' // Package used to manage Google OAuth
import LanguageProvider from '@/i18n/LanguageProvider' // Package used to manage translations
import { Logout } from '@/pages/Logout'
import Footer from '@/components/organisms/Footer'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import NotFound from '@/pages/NotFound'
import ScrollToTop from '@/components/organisms/ScrollToTop'
import type { User, AirtableUserFields } from '@linguistnow/shared'
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
    setUserDetails: (user: User | null) => void
    userDetails: User | null
    isRestoringAuth: boolean
    setIsRestoringAuth: (value: boolean) => void
    googleClientId: string
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
                            See <code>client/example.env</code> for
                            configuration details.
                        </p>
                    </div>
                </div>
            </LanguageProvider>
        )
    }

    return (
        <AppContent
            setUserDetails={setUserDetails}
            userDetails={userDetails}
            isRestoringAuth={isRestoringAuth}
            setIsRestoringAuth={setIsRestoringAuth}
            googleClientId={googleClientId}
        />
    )
}

/**
 * Inner router content that manages routes and PM linguist impersonation.
 */
const AppRouterContent = ({
    setUserDetails,
    userDetails,
    impersonatedUser,
    setImpersonatedUser,
    isRestoringAuth,
}: {
    setUserDetails: (user: User | null) => void
    userDetails: User | null
    impersonatedUser: User | null
    setImpersonatedUser: (user: User | null) => void
    isRestoringAuth: boolean
}) => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const isPM = Boolean(
        userDetails &&
        (userDetails.role === 'Project Manager' ||
            (userDetails as unknown as AirtableUserFields).Role ===
                'Project Manager')
    )

    const isImpersonating = Boolean(isPM && impersonatedUser)
    const effectiveUser = isImpersonating ? impersonatedUser : userDetails
    const impersonationReqIdRef = useRef(0)

    const handleStartImpersonation = useCallback(
        async (linguistEmail: string) => {
            if (!isPM) return
            const reqId = ++impersonationReqIdRef.current
            try {
                let targetUser: User | null = null
                await fetchUserDetails(linguistEmail, (fetched) => {
                    targetUser = fetched
                })
                if (reqId !== impersonationReqIdRef.current) {
                    return
                }
                const resolvedUser = targetUser as
                    (User & Partial<AirtableUserFields>) | null
                if (
                    !resolvedUser ||
                    (resolvedUser.role !== 'Linguist' &&
                        resolvedUser.Role !== 'Linguist')
                ) {
                    toast.error(t('impersonation.errorToast'))
                    return
                }
                setImpersonatedUser(resolvedUser)
                localStorage.setItem(
                    'impersonatedUserEmail',
                    resolvedUser.email
                )
                toast.success(
                    t('impersonation.startedToast', {
                        name:
                            resolvedUser.name ||
                            resolvedUser.Name ||
                            resolvedUser.email,
                    })
                )
                void navigate('/settings')
            } catch {
                if (reqId === impersonationReqIdRef.current) {
                    toast.error(t('impersonation.errorToast'))
                }
            }
        },
        [isPM, navigate, setImpersonatedUser, t]
    )

    const handleStopImpersonation = useCallback(() => {
        setImpersonatedUser(null)
        localStorage.removeItem('impersonatedUserEmail')
        toast.info(t('impersonation.stoppedToast'))
        void navigate('/dashboard')
    }, [navigate, setImpersonatedUser, t])

    const setEffectiveUserDetails = useCallback(
        (updated: User | null) => {
            if (isImpersonating) {
                setImpersonatedUser(updated)
            } else {
                setUserDetails(updated)
            }
        },
        [isImpersonating, setImpersonatedUser, setUserDetails]
    )

    return (
        <div className="flex min-h-screen flex-col">
            <ScrollToTop />
            <Navbar
                userDetails={effectiveUser}
                impersonatedUser={isImpersonating ? impersonatedUser : null}
                isPM={isPM}
                onImpersonate={isPM ? handleStartImpersonation : undefined}
                onStopImpersonation={
                    isImpersonating ? handleStopImpersonation : undefined
                }
            />
            <div className="flex flex-1 flex-col">
                <Routes>
                    {/* Ask user to log in when landing on site, then if effective role
                    is PM go to Dashboard, otherwise to Settings page */}
                    <Route
                        path="/"
                        element={
                            isRestoringAuth ? (
                                <div>{t('general.loading')}</div>
                            ) : effectiveUser ? (
                                effectiveUser.role === 'Project Manager' ? (
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
                        element={
                            <Login
                                setUserDetails={setUserDetails}
                                setImpersonatedUser={setImpersonatedUser}
                            />
                        }
                    />
                    <Route
                        path="/logout"
                        element={
                            <Logout
                                setUserDetails={setUserDetails}
                                userDetails={
                                    userDetails as unknown as AirtableUserFields | null
                                }
                                setImpersonatedUser={
                                    setImpersonatedUser as unknown as (
                                        user: AirtableUserFields | null
                                    ) => void
                                }
                            />
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute
                                userDetails={effectiveUser}
                                isRestoringAuth={isRestoringAuth}
                                element={
                                    effectiveUser?.role === 'Project Manager' &&
                                    !isImpersonating ? (
                                        <Dashboard
                                            userName={effectiveUser.name}
                                            onImpersonate={
                                                isPM
                                                    ? handleStartImpersonation
                                                    : undefined
                                            }
                                        />
                                    ) : effectiveUser ? (
                                        <Navigate to="/settings" replace />
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute
                                userDetails={effectiveUser}
                                isRestoringAuth={isRestoringAuth}
                                element={
                                    <AccountSettings
                                        key={effectiveUser?.email || 'self'}
                                        userDetails={effectiveUser}
                                        setUserDetails={setEffectiveUserDetails}
                                        isImpersonating={isImpersonating}
                                    />
                                }
                            />
                        }
                    />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <Footer />
            <Toaster position="top-right" />
        </div>
    )
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
const AppContent = ({
    setUserDetails,
    userDetails,
    isRestoringAuth,
    setIsRestoringAuth,
    googleClientId,
}: {
    setUserDetails: (user: User | null) => void
    userDetails: User | null
    isRestoringAuth: boolean
    setIsRestoringAuth: (value: boolean) => void
    googleClientId: string
}) => {
    const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null)

    useEffect(() => {
        // Restore authentication state from localStorage on mount
        const storedEmail = localStorage.getItem('userEmail')
        if (storedEmail) {
            // Fetch user details from API to restore authentication state
            fetchUserDetails(storedEmail, (user) => {
                setUserDetails(user)
            })
                .then(async (restoredUser) => {
                    const isRestoredPM =
                        restoredUser.role === 'Project Manager' ||
                        (restoredUser as unknown as AirtableUserFields).Role ===
                            'Project Manager'
                    const storedImpersonatedEmail = localStorage.getItem(
                        'impersonatedUserEmail'
                    )
                    if (isRestoredPM && storedImpersonatedEmail) {
                        try {
                            await fetchUserDetails(
                                storedImpersonatedEmail,
                                (impUser) => {
                                    if (
                                        impUser &&
                                        (impUser.role === 'Linguist' ||
                                            (
                                                impUser as unknown as AirtableUserFields
                                            ).Role === 'Linguist')
                                    ) {
                                        setImpersonatedUser(impUser)
                                    } else {
                                        localStorage.removeItem(
                                            'impersonatedUserEmail'
                                        )
                                    }
                                }
                            )
                        } catch {
                            localStorage.removeItem('impersonatedUserEmail')
                        }
                    } else if (!isRestoredPM) {
                        localStorage.removeItem('impersonatedUserEmail')
                        setImpersonatedUser(null)
                    }
                    setIsRestoringAuth(false)
                })
                .catch(() => {
                    // If user not found or error, clear stored email
                    localStorage.removeItem('userEmail')
                    localStorage.removeItem('impersonatedUserEmail')
                    setIsRestoringAuth(false)
                })
        } else {
            localStorage.removeItem('impersonatedUserEmail')
            setIsRestoringAuth(false)
        }
    }, [setUserDetails, setIsRestoringAuth])

    return (
        /* Wraps the application to provide the OAuth context */
        <GoogleOAuthProvider clientId={googleClientId}>
            <LanguageProvider>
                <BrowserRouter>
                    <AppRouterContent
                        setUserDetails={setUserDetails}
                        userDetails={userDetails}
                        impersonatedUser={impersonatedUser}
                        setImpersonatedUser={setImpersonatedUser}
                        isRestoringAuth={isRestoringAuth}
                    />
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

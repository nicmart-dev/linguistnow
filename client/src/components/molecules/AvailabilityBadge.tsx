import React from 'react'
import { useTranslation } from 'react-i18next'

interface AvailabilityBadgeProps {
    status: 'available' | 'unavailable' | 'limited' | 'setup-incomplete'
    freeHours?: number
    setupMessage?: string
}

/**
 * Displays a linguist's availability status as a colored badge.
 * Shows different visual states for available, unavailable, limited, and setup-incomplete.
 * @param status - The availability status to display
 * @param freeHours - Optional number of free hours to show for available/limited states
 * @param setupMessage - Optional tooltip message for setup-incomplete state
 */
const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
    status,
    freeHours,
    setupMessage,
}) => {
    const { t } = useTranslation()

    const getBadgeContent = () => {
        switch (status) {
            case 'available':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-3"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        {t('dashboard.availabilityBadge.available')}
                        {freeHours !== undefined && (
                            <span className="ml-1 text-emerald-500">
                                ({freeHours}h)
                            </span>
                        )}
                    </span>
                )
            case 'unavailable':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-3"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                        {t('dashboard.availabilityBadge.unavailable')}
                    </span>
                )
            case 'limited':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-3"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                        {t('dashboard.availabilityBadge.limited')}
                        {freeHours !== undefined && (
                            <span className="ml-1 text-amber-500">
                                ({freeHours}h)
                            </span>
                        )}
                    </span>
                )
            case 'setup-incomplete':
                return (
                    <span
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600"
                        title={setupMessage}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-3"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>
                        {t('dashboard.availabilityBadge.setupIncomplete')}
                    </span>
                )
            default:
                return null
        }
    }

    return <>{getBadgeContent()}</>
}

export default AvailabilityBadge

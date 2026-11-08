import React from 'react'
import { useTranslation } from 'react-i18next'
import {
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    KeyRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AvailabilityBadgeProps {
    status:
        | 'available'
        | 'unavailable'
        | 'limited'
        | 'setup-incomplete'
        | 'token-expired'
    freeHours?: number
    setupMessage?: string
}

/**
 * Displays a linguist's availability status as a colored badge.
 * Shows different visual states for available, unavailable, limited, setup-incomplete, and token-expired.
 * @param status - The availability status to display
 * @param freeHours - Optional number of free hours to show for available/limited states
 * @param setupMessage - Optional tooltip message for setup-incomplete or token-expired state
 */
const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
    status,
    freeHours,
    setupMessage,
}) => {
    const { t } = useTranslation()

    switch (status) {
        case 'available':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800"
                >
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.available')}
                    {freeHours !== undefined && (
                        <span className="ml-1 text-emerald-700">
                            ({freeHours}h)
                        </span>
                    )}
                </Badge>
            )
        case 'unavailable':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-red-200 bg-red-50 px-2 py-1 text-red-700"
                >
                    <XCircle className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.unavailable')}
                </Badge>
            )
        case 'limited':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-amber-200 bg-amber-50 px-2 py-1 text-amber-800"
                >
                    <Clock className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.limited')}
                    {freeHours !== undefined && (
                        <span className="ml-1 text-amber-800">
                            ({freeHours}h)
                        </span>
                    )}
                </Badge>
            )
        case 'setup-incomplete':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-gray-200 bg-gray-100 px-2 py-1 text-gray-600"
                    title={setupMessage}
                >
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.setupIncomplete')}
                </Badge>
            )
        case 'token-expired':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-orange-200 bg-orange-50 px-2 py-1 text-orange-800"
                    title={
                        setupMessage ||
                        t('dashboard.availabilityBadge.tokenExpiredTooltip')
                    }
                >
                    <KeyRound className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.tokenExpired')}
                </Badge>
            )
        default:
            return null
    }
}

export default AvailabilityBadge

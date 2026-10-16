import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

    switch (status) {
        case 'available':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-600"
                >
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.available')}
                    {freeHours !== undefined && (
                        <span className="ml-1 text-emerald-500">
                            ({freeHours}h)
                        </span>
                    )}
                </Badge>
            )
        case 'unavailable':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-red-200 bg-red-50 px-2 py-1 text-red-600"
                >
                    <XCircle className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.unavailable')}
                </Badge>
            )
        case 'limited':
            return (
                <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-amber-200 bg-amber-50 px-2 py-1 text-amber-600"
                >
                    <Clock className="size-3" aria-hidden="true" />
                    {t('dashboard.availabilityBadge.limited')}
                    {freeHours !== undefined && (
                        <span className="ml-1 text-amber-500">
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
        default:
            return null
    }
}

export default AvailabilityBadge

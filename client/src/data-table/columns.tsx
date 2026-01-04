import { useTranslation } from 'react-i18next' // To show localized strings
import { ArrowUpDown } from 'lucide-react'
import { Button } from '../components/Button' // used for sorting
import AvailabilityBadge from '../components/AvailabilityBadge'
import { Badge } from '../components/ui/badge'
import RatingInput from '../components/RatingInput'
import type { ColumnDef } from '@tanstack/react-table'
import { getCurrencySymbol } from '../utils/currency'

// Define the linguist data type based on the structure used in LinguistTable
interface LinguistRow {
    availabilityStatus?:
        | 'available'
        | 'unavailable'
        | 'limited'
        | 'setup-incomplete'
    freeHours?: number
    picture?: string // API response format (lowercase)
    name: string // API response format (lowercase)
    Name?: string // Legacy format (uppercase) for backward compatibility
    email: string // API response format
    Role?: string
    languages?: string[]
    specialization?: string[]
    hourlyRate?: number
    currency?: string
    rating?: number
    setupStatus?: {
        isComplete: boolean
        missingItems: string[]
    }
    [key: string]: unknown // Allow other Airtable fields
}

// Function to get columns with translations
export const getColumns = (): ColumnDef<LinguistRow>[] => {
    // Note: This function will be called from a component that has useTranslation
    // We'll need to pass t function as parameter or use a different approach
    // For now, let's create a hook-based approach
    return []
}

// Hook to get columns with translations
export const useColumns = (): ColumnDef<LinguistRow>[] => {
    const { t } = useTranslation()

    return [
        {
            accessorKey: 'availabilityStatus',
            size: 120,
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }}
                    >
                        {t('dashboard.availability')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const status = row.getValue('availabilityStatus')
                const freeHours = row.original.freeHours
                const setupStatus = row.original.setupStatus
                return (
                    <AvailabilityBadge
                        status={status || 'setup-incomplete'}
                        freeHours={freeHours}
                        setupMessage={
                            setupStatus && !setupStatus.isComplete
                                ? (() => {
                                      // Map field identifiers to their display labels
                                      const fieldLabelMap: Record<
                                          string,
                                          string
                                      > = {
                                          calendars: t(
                                              'calendarSelector.title',
                                              'Calendar Selection'
                                          ),
                                          timezone: t(
                                              'availabilitySettings.timezone',
                                              'Timezone'
                                          ),
                                          working_hours: t(
                                              'availabilitySettings.workingHours',
                                              'Working Hours'
                                          ),
                                      }
                                      const missingItemsLabels =
                                          setupStatus.missingItems.map(
                                              (item) =>
                                                  fieldLabelMap[item] || item
                                          )
                                      return t(
                                          'dashboard.availabilityBadge.missingItems',
                                          {
                                              items: missingItemsLabels.join(
                                                  ', '
                                              ),
                                          }
                                      )
                                  })()
                                : undefined
                        }
                    />
                )
            },
        },
        {
            accessorKey: 'picture',
            header: () => t('accountSettings.picture'),
            size: 60,
            cell: ({ row }) => {
                const pictureUrl = row.getValue('picture')
                // Use a default placeholder if picture is missing or invalid
                const src =
                    pictureUrl &&
                    typeof pictureUrl === 'string' &&
                    pictureUrl.trim()
                        ? pictureUrl.trim()
                        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUI5QkE1Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDQuNSAxNS4xNyA0LjUgMTdWMTlIMTkuNVYxN0MxOS41IDE1LjE3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzlCOUJBNSIvPgo8L3N2Zz4K'

                return (
                    <img
                        src={src}
                        alt={t('dashboard.alt.userProfileAvatar')}
                        className="w-12 h-12 rounded-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            // Fallback to a simple data URI if the image fails to load
                            e.currentTarget.src =
                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUI5QkE1Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDQuNSAxNS4xNyA0LjUgMTdWMTlIMTkuNVYxN0MxOS41IDE1LjE3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzlCOUJBNSIvPgo8L3N2Zz4K'
                        }}
                    />
                )
            },
        },
        {
            accessorKey: 'name',
            header: () => t('dashboard.name'),
            size: 150,
            cell: ({ row }) => {
                const name = row.getValue('name')
                return name || row.original.Name || '-'
            },
        },
        {
            accessorKey: 'email',
            size: 200,
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }}
                    >
                        {t('dashboard.email')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: 'languages',
            header: () => t('dashboard.languages'),
            size: 150,
            cell: ({ row }) => {
                const languagesValue = row.getValue('languages')
                const languages = Array.isArray(languagesValue)
                    ? (languagesValue as string[])
                    : undefined
                if (!languages || languages.length === 0) return '-'
                return (
                    <div className="flex flex-wrap gap-1">
                        {languages.map((lang) => (
                            <Badge
                                key={lang}
                                variant="secondary"
                                className="text-xs"
                            >
                                {lang}
                            </Badge>
                        ))}
                    </div>
                )
            },
        },
        {
            accessorKey: 'specialization',
            header: () => t('dashboard.specialization'),
            size: 150,
            cell: ({ row }) => {
                const specializationValue = row.getValue('specialization')
                const specialization = Array.isArray(specializationValue)
                    ? (specializationValue as string[])
                    : undefined
                if (!specialization || specialization.length === 0) return '-'
                return (
                    <div className="flex flex-wrap gap-1">
                        {specialization.map((spec) => (
                            <Badge
                                key={spec}
                                variant="outline"
                                className="text-xs"
                            >
                                {spec}
                            </Badge>
                        ))}
                    </div>
                )
            },
        },
        {
            accessorKey: 'hourlyRate',
            header: () => t('dashboard.hourlyRate'),
            size: 120,
            cell: ({ row }) => {
                const rateValue = row.getValue('hourlyRate')
                const rate =
                    typeof rateValue === 'number' ? rateValue : undefined
                const currency = row.original.currency
                if (rate === undefined) return '-'
                const symbol = getCurrencySymbol(currency)
                return `${symbol}${rate.toFixed(2)}/hr`
            },
        },
        {
            accessorKey: 'rating',
            header: () => t('dashboard.rating'),
            size: 140,
            cell: ({ row }) => {
                const ratingValue = row.getValue('rating')
                const rating =
                    typeof ratingValue === 'number' ? ratingValue : undefined
                const email = row.original.email
                return (
                    <RatingInput
                        rating={rating}
                        linguistEmail={email}
                        size="sm"
                        onRatingChange={(newRating) => {
                            // Update the row data
                            row.original.rating = newRating
                        }}
                    />
                )
            },
        },
    ]
}

// Export default for backward compatibility - will be replaced by useColumns hook
export const columns: ColumnDef<LinguistRow>[] = []

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import AvailabilityBadge from '@/components/molecules/AvailabilityBadge'
import AvailabilityTimeline from './AvailabilityTimeline'
import RatingInput from '@/components/molecules/RatingInput'
import type { LinguistWithAvailability } from '@linguistnow/shared'
import { getCurrencySymbol } from '@/utils/currency'

interface LinguistCardProps {
    linguist: LinguistWithAvailability
    showTimeline?: boolean
}

/**
 * Card component displaying a linguist's profile with availability information.
 * Shows name, languages, specializations, hourly rate, and availability status.
 * @param linguist - The linguist data to display
 * @param showTimeline - Whether to show the availability timeline
 */
const LinguistCard: React.FC<LinguistCardProps> = ({
    linguist,
    showTimeline = false,
}) => {
    const { t } = useTranslation()

    // Determine availability status
    const getAvailabilityStatus = ():
        | 'available'
        | 'unavailable'
        | 'limited'
        | 'setup-incomplete' => {
        if (!linguist.setupStatus.isComplete) {
            return 'setup-incomplete'
        }
        if (!linguist.availability) {
            return 'setup-incomplete'
        }
        if (linguist.availability.isAvailable) {
            return 'available'
        }
        if (linguist.availability.totalFreeHours > 0) {
            return 'limited'
        }
        return 'unavailable'
    }

    const availabilityStatus = getAvailabilityStatus()

    return (
        <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
            {/* Header with picture and name */}
            <div className="flex items-start gap-4 mb-4">
                <img
                    src={linguist.picture || '/default-avatar.png'}
                    alt={linguist.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOUI5QkE1Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDQuNSAxNS4xNyA0LjUgMTdWMTlIMTkuNVYxN0MxOS41IDE1LjE3IDE0LjY3IDE0IDEyIDE0WiIgZmlsbD0iIzlCOUJBNSIvPgo8L3N2Zz4K'
                    }}
                />
                <div className="flex-1">
                    <h3 className="text-lg font-semibold">{linguist.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <AvailabilityBadge
                            status={availabilityStatus}
                            freeHours={linguist.availability?.totalFreeHours}
                            setupMessage={
                                linguist.setupStatus.missingItems.length > 0
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
                                              linguist.setupStatus.missingItems.map(
                                                  (item) =>
                                                      fieldLabelMap[item] ||
                                                      item
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
                    </div>
                </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a
                        href={`mailto:${linguist.email}`}
                        className="hover:text-blue-600"
                    >
                        {linguist.email}
                    </a>
                </div>
                {linguist.timezone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{linguist.timezone}</span>
                    </div>
                )}
            </div>

            {/* Languages */}
            {linguist.languages && linguist.languages.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">
                        {t('dashboard.linguistCard.languages')}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {linguist.languages.map((lang) => (
                            <Badge key={lang} variant="secondary">
                                {lang}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Specialization */}
            {linguist.specialization && linguist.specialization.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">
                        {t('dashboard.linguistCard.specialization')}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {linguist.specialization.map((spec) => (
                            <Badge key={spec} variant="outline">
                                {spec}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Rating and Rate */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-sm font-medium mb-1">
                        {t('dashboard.linguistCard.rating')}
                    </h4>
                    <RatingInput
                        rating={linguist.rating}
                        linguistEmail={linguist.email}
                        onRatingChange={(newRating) => {
                            // Update local state if needed
                            linguist.rating = newRating
                        }}
                    />
                </div>
                {linguist.hourlyRate && (
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <span className="font-semibold">
                                {(() => {
                                    const linguistWithCurrency =
                                        linguist as LinguistWithAvailability & {
                                            currency?: string
                                        }
                                    const currencyCode =
                                        linguistWithCurrency.currency &&
                                        typeof linguistWithCurrency.currency ===
                                            'string'
                                            ? linguistWithCurrency.currency
                                            : undefined
                                    return getCurrencySymbol(currencyCode)
                                })()}
                                {linguist.hourlyRate.toFixed(2)}
                            </span>
                            <span className="text-xs">/hr</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Availability Timeline */}
            {showTimeline &&
                linguist.availability &&
                linguist.availability.freeSlots.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <AvailabilityTimeline
                            freeSlots={linguist.availability.freeSlots}
                            startDate={''} // Will be passed from parent
                            endDate={''} // Will be passed from parent
                            timezone={linguist.timezone}
                        />
                    </div>
                )}
        </div>
    )
}

export default LinguistCard

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'

interface AvailabilityPreferences {
    timezone?: string
    workingHoursStart?: string
    workingHoursEnd?: string
    offDays?: number[]
    // Note: minHoursPerDay is not a linguist preference - it's a PM requirement set in availability requests
}

interface AvailabilitySettingsProps {
    userDetails: {
        email?: string
        Email?: string
        Timezone?: string
        'Working Hours Start'?: number
        'Working Hours End'?: number
        'Off Days'?: string
    }
    onSave: (preferences: AvailabilityPreferences) => Promise<void>
}

// Get UTC offset in minutes for a timezone
const getTimezoneOffset = (timezone: string): number => {
    try {
        const now = new Date()
        const utcDate = new Date(
            now.toLocaleString('en-US', { timeZone: 'UTC' })
        )
        const tzDate = new Date(
            now.toLocaleString('en-US', { timeZone: timezone })
        )
        return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60) // Convert to minutes
    } catch {
        // If we can't determine offset, default to UTC (0)
        return 0
    }
}

// Get list of valid IANA timezone identifiers
// Uses browser's supported timezones if available, otherwise falls back to common timezones
// Sorted by UTC offset (time difference) instead of alphabetically
const getValidTimezones = (): string[] => {
    let timezones: string[] = []

    try {
        // Modern browsers support Intl.supportedValuesOf
        if (
            typeof Intl !== 'undefined' &&
            'supportedValuesOf' in Intl &&
            typeof Intl.supportedValuesOf === 'function'
        ) {
            timezones = Intl.supportedValuesOf('timeZone')
        }
    } catch (error) {
        console.warn('Could not get supported timezones:', error)
    }

    // Fallback: comprehensive list of common IANA timezones
    if (timezones.length === 0) {
        timezones = [
            'Africa/Cairo',
            'Africa/Johannesburg',
            'Africa/Lagos',
            'America/Argentina/Buenos_Aires',
            'America/Bogota',
            'America/Chicago',
            'America/Denver',
            'America/Lima',
            'America/Los_Angeles',
            'America/Mexico_City',
            'America/New_York',
            'America/Sao_Paulo',
            'America/Toronto',
            'Asia/Bangkok',
            'Asia/Dubai',
            'Asia/Hong_Kong',
            'Asia/Jakarta',
            'Asia/Kolkata',
            'Asia/Seoul',
            'Asia/Shanghai',
            'Asia/Singapore',
            'Asia/Taipei',
            'Asia/Tokyo',
            'Australia/Melbourne',
            'Australia/Sydney',
            'Europe/Amsterdam',
            'Europe/Athens',
            'Europe/Berlin',
            'Europe/Dublin',
            'Europe/Istanbul',
            'Europe/London',
            'Europe/Madrid',
            'Europe/Moscow',
            'Europe/Paris',
            'Europe/Rome',
            'Europe/Stockholm',
            'Europe/Vienna',
            'Europe/Warsaw',
            'Europe/Zurich',
            'Pacific/Auckland',
            'UTC',
        ]
    }

    // Sort by UTC offset (time difference)
    return timezones.sort((a, b) => {
        const offsetA = getTimezoneOffset(a)
        const offsetB = getTimezoneOffset(b)
        // If offsets are equal, sort alphabetically as secondary sort
        if (offsetA === offsetB) {
            return a.localeCompare(b)
        }
        return offsetA - offsetB
    })
}

const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
    userDetails,
    onSave,
}) => {
    const { t, i18n } = useTranslation()

    // Determine if current language uses AM/PM format
    // Languages that typically use AM/PM: en, es, pt, ar
    // Languages that use 24-hour format: fr, de, it, ja, ko, ru, zh-cn
    const useAmPmFormat = React.useMemo(() => {
        const lang = i18n.language.toLowerCase().split('-')[0]
        return ['en', 'es', 'pt', 'ar'].includes(lang)
    }, [i18n.language])

    // Parse HH:mm string to hour number for display formatting
    const parseHourFromTime = useCallback((time: string): number => {
        const [hours] = time.split(':')
        return parseInt(hours, 10) || 0
    }, [])

    // Format hour for display based on language preference
    const formatHour = useCallback(
        (hour: number): string => {
            if (useAmPmFormat) {
                if (hour === 0) return '12:00 AM'
                if (hour === 12) return '12:00 PM'
                if (hour < 12) return `${hour.toString()}:00 AM`
                return `${(hour - 12).toString()}:00 PM`
            }
            return `${hour.toString().padStart(2, '0')}:00`
        },
        [useAmPmFormat]
    )

    // Format HH:mm time string for display
    const formatTimeString = useCallback(
        (time: string): string => {
            const hour = parseHourFromTime(time)
            return formatHour(hour)
        },
        [formatHour, parseHourFromTime]
    )

    // Format timezone for display
    const formatTimezoneLabel = React.useCallback((tz: string): string => {
        try {
            const now = new Date()
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                timeZoneName: 'short',
            })
            const parts = formatter.formatToParts(now)
            const timeZoneName = parts.find(
                (part) => part.type === 'timeZoneName'
            )?.value

            if (timeZoneName) {
                return `${tz} (${timeZoneName})`
            }
        } catch {
            // If formatting fails, just return the timezone name
        }
        return tz
    }, [])

    // Auto-detect timezone from browser
    const browserTimezone = React.useMemo(
        () =>
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            'America/Los_Angeles',
        []
    )

    // Get valid timezones (sorted by UTC offset) - memoize to avoid recalculating
    const validTimezones = React.useMemo(() => getValidTimezones(), [])

    // Ensure browser timezone is in the list, if not add it and re-sort
    const timezonesWithBrowser = React.useMemo<string[]>(() => {
        if (validTimezones.includes(browserTimezone)) {
            return validTimezones
        }
        // Add browser timezone and re-sort by offset
        return [...validTimezones, browserTimezone].sort((a, b) => {
            const offsetA = getTimezoneOffset(a)
            const offsetB = getTimezoneOffset(b)
            if (offsetA === offsetB) {
                return a.localeCompare(b)
            }
            return offsetA - offsetB
        })
    }, [validTimezones, browserTimezone])

    // Pre-compute formatted labels for all timezones to avoid recalculating during render
    const timezoneLabels = React.useMemo<Map<string, string>>(() => {
        const labels = new Map<string, string>()
        timezonesWithBrowser.forEach((tz) => {
            labels.set(tz, formatTimezoneLabel(tz))
        })
        return labels
    }, [timezonesWithBrowser, formatTimezoneLabel])

    // Initialize state from userDetails or defaults
    // Validate that stored timezone is in valid list, otherwise use browser timezone
    const initialTimezone =
        userDetails.Timezone &&
        timezonesWithBrowser.includes(userDetails.Timezone)
            ? userDetails.Timezone
            : browserTimezone

    const [timezone, setTimezone] = useState<string>(initialTimezone)
    const [workingHoursStart, setWorkingHoursStart] = useState<string>(() => {
        const stored = userDetails['Working Hours Start']
        if (typeof stored === 'string') {
            return stored
        }
        // Convert number to HH:mm format if stored as number (migration)
        if (typeof stored === 'number') {
            return `${stored.toString().padStart(2, '0')}:00`
        }
        return '08:00'
    })
    const [workingHoursEnd, setWorkingHoursEnd] = useState<string>(() => {
        const stored = userDetails['Working Hours End']
        if (typeof stored === 'string') {
            return stored
        }
        // Convert number to HH:mm format if stored as number (migration)
        if (typeof stored === 'number') {
            return `${stored.toString().padStart(2, '0')}:00`
        }
        return '18:00'
    })
    const [offDays, setOffDays] = useState<number[]>(() => {
        if (userDetails['Off Days']) {
            const offDaysValue = userDetails['Off Days']
            // Handle array of day names (from Airtable dropdown field)
            if (Array.isArray(offDaysValue)) {
                const dayNames = [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                ]
                return offDaysValue
                    .map((day) => {
                        if (typeof day === 'string') {
                            const index = dayNames.indexOf(day)
                            if (index !== -1) return index
                            // Fallback: try parsing as number
                            const num = parseInt(day.trim(), 10)
                            return !isNaN(num) && num >= 0 && num <= 6
                                ? num
                                : null
                        }
                        return typeof day === 'number' && day >= 0 && day <= 6
                            ? day
                            : null
                    })
                    .filter((d): d is number => d !== null)
            }
            // Handle comma-separated string (backward compatibility)
            if (typeof offDaysValue === 'string') {
                const dayNames = [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                ]
                return offDaysValue
                    .split(',')
                    .map((d) => {
                        const trimmed = d.trim()
                        // Try parsing as day name first
                        const dayIndex = dayNames.indexOf(trimmed)
                        if (dayIndex !== -1) return dayIndex
                        // Fallback: try parsing as number
                        const num = parseInt(trimmed, 10)
                        return !isNaN(num) && num >= 0 && num <= 6 ? num : null
                    })
                    .filter((d): d is number => d !== null)
            }
        }
        return [0, 6] // Default: Sunday and Saturday
    })
    const [isSaving, setIsSaving] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)
    const [timezoneOpen, setTimezoneOpen] = useState(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const previousValuesRef = useRef<{
        timezone: string
        workingHoursStart: string
        workingHoursEnd: string
        offDays: number[]
    } | null>(null)
    const changedFieldRef = useRef<string | null>(null)

    // Get timezones to display - only when dropdown is open
    // Command component handles filtering and search internally
    const timezonesToShow = React.useMemo<string[]>(() => {
        if (!timezoneOpen) {
            return []
        }
        return timezonesWithBrowser
    }, [timezoneOpen, timezonesWithBrowser])

    // Update timezone when userDetails change
    useEffect(() => {
        if (
            userDetails.Timezone &&
            timezonesWithBrowser.includes(userDetails.Timezone)
        ) {
            setTimezone(userDetails.Timezone)
        } else {
            setTimezone(browserTimezone)
        }
        // Mark as initialized after first load
        setHasInitialized(true)
    }, [userDetails.Timezone, browserTimezone, timezonesWithBrowser])

    const handleOffDayToggle = (day: number) => {
        setOffDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day].sort()
        )
    }

    const savePreferences = useCallback(
        async (
            preferences: AvailabilityPreferences,
            changedField: string | null
        ) => {
            // Validation
            if (!timezonesWithBrowser.includes(preferences.timezone || '')) {
                toast.error(
                    t(
                        'availabilitySettings.errors.invalidTimezone',
                        'Please select a valid timezone from the dropdown'
                    )
                )
                return
            }
            // Validate HH:mm format
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (
                preferences.workingHoursStart &&
                !timeRegex.test(preferences.workingHoursStart)
            ) {
                toast.error(
                    t(
                        'availabilitySettings.errors.invalidStartHour',
                        'Working hours start must be in HH:mm format (e.g., 08:00)'
                    )
                )
                return
            }
            if (
                preferences.workingHoursEnd &&
                !timeRegex.test(preferences.workingHoursEnd)
            ) {
                toast.error(
                    t(
                        'availabilitySettings.errors.invalidEndHour',
                        'Working hours end must be in HH:mm format (e.g., 18:00)'
                    )
                )
                return
            }
            // Validate start is before end
            if (
                preferences.workingHoursStart &&
                preferences.workingHoursEnd &&
                preferences.workingHoursStart >= preferences.workingHoursEnd
            ) {
                toast.error(
                    t(
                        'availabilitySettings.errors.startAfterEnd',
                        'Working hours start must be before end'
                    )
                )
                return
            }

            setIsSaving(true)
            try {
                await onSave(preferences)
                // Show field-specific success message
                let successMessage = t(
                    'availabilitySettings.saveSuccess',
                    'Availability settings saved successfully'
                )
                if (changedField) {
                    const fieldMessages: Record<string, string> = {
                        timezone: t(
                            'availabilitySettings.saveSuccessTimezone',
                            'Timezone saved'
                        ),
                        workingHoursStart: t(
                            'availabilitySettings.saveSuccessStartHour',
                            'Working hours start saved'
                        ),
                        workingHoursEnd: t(
                            'availabilitySettings.saveSuccessEndHour',
                            'Working hours end saved'
                        ),
                        offDays: t(
                            'availabilitySettings.saveSuccessOffDays',
                            'Days off saved'
                        ),
                    }
                    successMessage =
                        fieldMessages[changedField] || successMessage
                }
                toast.success(successMessage)
            } catch (error) {
                console.error('Failed to save availability settings:', error)
                toast.error(
                    t(
                        'availabilitySettings.saveError',
                        'Failed to save availability settings. Please try again.'
                    )
                )
            } finally {
                setIsSaving(false)
            }
        },
        [onSave, timezonesWithBrowser, t]
    )

    // Auto-save when preferences change (debounced)
    useEffect(() => {
        // Don't save on initial load
        if (!hasInitialized) {
            // Store initial values for comparison
            previousValuesRef.current = {
                timezone,
                workingHoursStart,
                workingHoursEnd,
                offDays: [...offDays].sort(),
            }
            return
        }

        // Compare current values with previous values
        const currentValues = {
            timezone,
            workingHoursStart,
            workingHoursEnd,
            offDays: [...offDays].sort(),
        }

        const previousValues = previousValuesRef.current

        // Check if values actually changed and which field changed
        let changedField: string | null = null
        if (previousValues) {
            if (previousValues.timezone !== currentValues.timezone) {
                changedField = 'timezone'
            } else if (
                previousValues.workingHoursStart !==
                currentValues.workingHoursStart
            ) {
                changedField = 'workingHoursStart'
            } else if (
                previousValues.workingHoursEnd !== currentValues.workingHoursEnd
            ) {
                changedField = 'workingHoursEnd'
            } else if (
                JSON.stringify(previousValues.offDays) !==
                JSON.stringify(currentValues.offDays)
            ) {
                changedField = 'offDays'
            }

            if (!changedField) {
                // Values haven't changed, don't save
                return
            }
        }

        // Store which field changed
        changedFieldRef.current = changedField

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Set new timeout to save after 200ms of no changes (reduced from 500ms)
        saveTimeoutRef.current = setTimeout(() => {
            // Update previous values before saving
            previousValuesRef.current = currentValues
            void savePreferences(
                {
                    timezone,
                    workingHoursStart,
                    workingHoursEnd,
                    offDays,
                },
                changedFieldRef.current
            )
            changedFieldRef.current = null
        }, 200)

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [
        timezone,
        workingHoursStart,
        workingHoursEnd,
        offDays,
        hasInitialized,
        savePreferences,
    ])

    const dayNames = [
        t('availabilitySettings.days.sunday', 'Sunday'),
        t('availabilitySettings.days.monday', 'Monday'),
        t('availabilitySettings.days.tuesday', 'Tuesday'),
        t('availabilitySettings.days.wednesday', 'Wednesday'),
        t('availabilitySettings.days.thursday', 'Thursday'),
        t('availabilitySettings.days.friday', 'Friday'),
        t('availabilitySettings.days.saturday', 'Saturday'),
    ]

    return (
        <div className="max-w-3xl mb-8">
            <h2 className="text-xl font-semibold mb-4">
                {t('availabilitySettings.title', 'Availability Preferences')}
            </h2>
            <p className="text-lg text-black mb-4">
                {t(
                    'availabilitySettings.description',
                    'Configure your working hours, timezone, and availability settings.'
                )}
            </p>
            <p className="text-lg mb-6">
                *{' '}
                {t(
                    'accountSettings.automaticSave',
                    'Changes are saved automatically'
                )}
                {isSaving && (
                    <span className="ml-2 text-gray-500">
                        ({t('availabilitySettings.saving', 'Saving...')})
                    </span>
                )}
            </p>

            {/* Timezone */}
            <div className="mb-6">
                <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {t('availabilitySettings.timezone', 'Timezone')}
                </label>
                <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={timezoneOpen}
                            className="w-full justify-between"
                        >
                            {timezone
                                ? (timezoneLabels.get(timezone) ?? timezone)
                                : t(
                                      'availabilitySettings.timezoneSearchPlaceholder',
                                      'Select timezone...'
                                  )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder={t(
                                    'availabilitySettings.timezoneSearchPlaceholder',
                                    'Search timezone...'
                                )}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {t(
                                        'availabilitySettings.noTimezoneFound',
                                        'No timezone found'
                                    )}
                                </CommandEmpty>
                                <CommandGroup>
                                    {timezonesToShow.map((tz) => {
                                        const label =
                                            timezoneLabels.get(tz) ?? tz
                                        return (
                                            <CommandItem
                                                key={tz}
                                                // Include both timezone ID and label in value for better search
                                                value={`${tz} ${label}`}
                                                onSelect={() => {
                                                    setTimezone(tz)
                                                    setTimezoneOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        timezone === tz
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />
                                                {label}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <p className="mt-1 text-sm text-gray-500">
                    {t(
                        'availabilitySettings.timezoneHint',
                        'Detected timezone: {{timezone}}',
                        { timezone: formatTimezoneLabel(browserTimezone) }
                    )}
                </p>
            </div>

            {/* Working Hours */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('availabilitySettings.workingHours', 'Working Hours')}
                </label>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label
                            htmlFor="workingHoursStart"
                            className="block text-xs text-gray-600 mb-1"
                        >
                            {t('availabilitySettings.start', 'Start')}
                        </label>
                        <Select
                            value={workingHoursStart}
                            onValueChange={(value: string) => {
                                setWorkingHoursStart(value)
                            }}
                        >
                            <SelectTrigger id="workingHoursStart">
                                <SelectValue
                                    placeholder={t(
                                        'availabilitySettings.selectHour',
                                        'Select hour'
                                    )}
                                >
                                    {formatTimeString(workingHoursStart)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                    const timeValue = `${i.toString().padStart(2, '0')}:00`
                                    return (
                                        <SelectItem key={i} value={timeValue}>
                                            {formatHour(i)}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="mt-6 text-gray-500">-</span>
                    <div className="flex-1">
                        <label
                            htmlFor="workingHoursEnd"
                            className="block text-xs text-gray-600 mb-1"
                        >
                            {t('availabilitySettings.end', 'End')}
                        </label>
                        <Select
                            value={workingHoursEnd}
                            onValueChange={(value: string) => {
                                setWorkingHoursEnd(value)
                            }}
                        >
                            <SelectTrigger id="workingHoursEnd">
                                <SelectValue
                                    placeholder={t(
                                        'availabilitySettings.selectHour',
                                        'Select hour'
                                    )}
                                >
                                    {formatTimeString(workingHoursEnd)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                    const timeValue = `${i.toString().padStart(2, '0')}:00`
                                    return (
                                        <SelectItem key={i} value={timeValue}>
                                            {formatHour(i)}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    {useAmPmFormat
                        ? t(
                              'availabilitySettings.workingHoursHintAmPm',
                              'Select your working hours'
                          )
                        : t(
                              'availabilitySettings.workingHoursHint24h',
                              'Select your working hours in 24-hour format (0-23)'
                          )}
                </p>
            </div>

            {/* Off Days */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('availabilitySettings.offDays', 'Days Off')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dayNames.map((dayName, index) => (
                        <label
                            key={index}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 has-[:checked]:bg-blue-50"
                        >
                            <input
                                type="checkbox"
                                checked={offDays.includes(index)}
                                onChange={() => {
                                    handleOffDayToggle(index)
                                }}
                                className="size-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-900">
                                {dayName}
                            </span>
                        </label>
                    ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    {t(
                        'availabilitySettings.offDaysHint',
                        'Select the days you do not work'
                    )}
                </p>
            </div>
        </div>
    )
}

export default AvailabilitySettings

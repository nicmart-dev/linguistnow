import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CURRENCIES } from '@/utils/currency'

interface LinguistProfileSettingsProps {
    userDetails: {
        Email?: string
        email?: string
        'Hourly Rate'?: number
        Currency?: string
        Languages?: string[] | string
        Specialization?: string[] | string
        Role?: string
        [key: string]: unknown
    }
    onSave: (profile: {
        hourlyRate?: number | null
        currency?: string
        languages?: string[]
        specialization?: string[]
    }) => Promise<void>
}

// Language pairs from schema
const LANGUAGE_PAIRS = [
    'EN-FR',
    'EN-ES',
    'EN-DE',
    'EN-ZH',
    'EN-JA',
    'EN-KO',
    'EN-AR',
    'EN-RU',
    'EN-IT',
    'EN-PT',
    'FR-EN',
    'ES-EN',
    'DE-EN',
    'ZH-EN',
    'JA-EN',
    'KO-EN',
    'AR-EN',
    'RU-EN',
    'IT-EN',
    'PT-EN',
]

// Specializations from schema
const SPECIALIZATIONS = [
    'Legal',
    'Medical',
    'Technical',
    'Marketing',
    'Financial',
    'Literary',
    'Academic',
    'General',
]

const LinguistProfileSettings: React.FC<LinguistProfileSettingsProps> = ({
    userDetails,
    onSave,
}) => {
    const { t } = useTranslation()

    // Only show for linguists
    if (userDetails.Role !== 'Linguist') {
        return null
    }

    // Parse initial values
    const languagesField = userDetails.Languages
    const initialLanguages = Array.isArray(languagesField)
        ? languagesField
        : typeof languagesField === 'string'
          ? languagesField
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
          : []

    const specializationField = userDetails.Specialization
    const initialSpecializations = Array.isArray(specializationField)
        ? specializationField
        : typeof specializationField === 'string'
          ? specializationField
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
          : []

    const [hourlyRate, setHourlyRate] = useState<string>(
        userDetails['Hourly Rate']?.toString() || ''
    )
    const [currency, setCurrency] = useState<string>(
        userDetails.Currency || 'USD'
    )
    const [languages, setLanguages] = useState<string[]>(initialLanguages)
    const [specializations, setSpecializations] = useState<string[]>(
        initialSpecializations
    )

    const [languagesOpen, setLanguagesOpen] = useState(false)
    const [specializationsOpen, setSpecializationsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Sync state with userDetails when it changes (e.g., after save)
    useEffect(() => {
        const languagesField = userDetails.Languages
        const updatedLanguages = Array.isArray(languagesField)
            ? languagesField
            : typeof languagesField === 'string'
              ? languagesField
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
              : []

        const specializationField = userDetails.Specialization
        const updatedSpecializations = Array.isArray(specializationField)
            ? specializationField
            : typeof specializationField === 'string'
              ? specializationField
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
              : []

        const updatedHourlyRate = userDetails['Hourly Rate']?.toString() || ''
        // Normalize currency to uppercase (Airtable singleSelect values are uppercase)
        const updatedCurrency = (userDetails.Currency || 'USD').toUpperCase()

        // Only update if values actually changed to avoid unnecessary re-renders
        const languagesChanged =
            JSON.stringify(updatedLanguages.sort()) !==
            JSON.stringify(languages.sort())
        const specializationsChanged =
            JSON.stringify(updatedSpecializations.sort()) !==
            JSON.stringify(specializations.sort())
        const hourlyRateChanged = updatedHourlyRate !== hourlyRate
        const currencyChanged = updatedCurrency !== currency

        if (languagesChanged) {
            setLanguages(updatedLanguages)
        }
        if (specializationsChanged) {
            setSpecializations(updatedSpecializations)
        }
        if (hourlyRateChanged) {
            setHourlyRate(updatedHourlyRate)
        }
        if (currencyChanged) {
            setCurrency(updatedCurrency)
        }
    }, [
        userDetails.Languages,
        userDetails.Specialization,
        userDetails['Hourly Rate'],
        userDetails.Currency,
    ])

    // Debounced save
    useEffect(() => {
        // Get current values from userDetails for comparison
        const currentLanguagesField = userDetails.Languages
        const currentLanguages = Array.isArray(currentLanguagesField)
            ? currentLanguagesField
            : typeof currentLanguagesField === 'string'
              ? currentLanguagesField
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
              : []

        const currentSpecializationField = userDetails.Specialization
        const currentSpecializations = Array.isArray(currentSpecializationField)
            ? currentSpecializationField
            : typeof currentSpecializationField === 'string'
              ? currentSpecializationField
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
              : []

        const currentHourlyRate = userDetails['Hourly Rate']?.toString() || ''

        const timer = setTimeout(() => {
            // Currency is read-only, so don't check for currency changes
            if (
                hourlyRate !== currentHourlyRate ||
                JSON.stringify(languages.sort()) !==
                    JSON.stringify(currentLanguages.sort()) ||
                JSON.stringify(specializations.sort()) !==
                    JSON.stringify(currentSpecializations.sort())
            ) {
                void handleSave()
            }
        }, 1000) // 1 second debounce

        return () => {
            clearTimeout(timer)
        }
    }, [hourlyRate, languages, specializations, userDetails])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Validate and parse hourly rate
            let rateValue: number | undefined = undefined
            const trimmedRate = hourlyRate.trim()
            if (trimmedRate) {
                const parsed = parseFloat(trimmedRate)
                if (isNaN(parsed) || parsed < 0) {
                    // Invalid number entered
                    toast.error(
                        t(
                            'linguistProfile.invalidRate',
                            'Please enter a valid hourly rate (number >= 0)'
                        )
                    )
                    setIsSaving(false)
                    return
                }
                rateValue = parsed
            }
            // If trimmedRate is empty, rateValue remains undefined (clears the field)

            // Get current values for comparison
            const currentHourlyRate =
                userDetails['Hourly Rate']?.toString() || ''
            // Normalize currency to uppercase for comparison (Airtable singleSelect values are uppercase)
            const currentLanguagesField = userDetails.Languages
            const currentLanguages = Array.isArray(currentLanguagesField)
                ? currentLanguagesField
                : typeof currentLanguagesField === 'string'
                  ? currentLanguagesField
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                  : []
            const currentSpecializationField = userDetails.Specialization
            const currentSpecializations = Array.isArray(
                currentSpecializationField
            )
                ? currentSpecializationField
                : typeof currentSpecializationField === 'string'
                  ? currentSpecializationField
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                  : []

            // Build profile object, only including fields that have actually changed
            const profile: {
                hourlyRate?: number | null
                currency?: string
                languages?: string[]
                specialization?: string[]
            } = {}

            // Hourly Rate: include if changed or cleared
            if (
                rateValue !== undefined &&
                rateValue.toString() !== currentHourlyRate
            ) {
                profile.hourlyRate = rateValue
            } else if (trimmedRate === '' && currentHourlyRate !== '') {
                // User cleared the field - send null to clear it
                profile.hourlyRate = null as unknown as number | undefined // Airtable accepts null to clear
            }

            // Currency is read-only - don't include in save request
            // Currency exchange support will be added later

            // Languages: include if changed (compare sorted arrays)
            const languagesChanged =
                JSON.stringify(languages.sort()) !==
                JSON.stringify(currentLanguages.sort())
            if (languagesChanged) {
                profile.languages = languages.length > 0 ? languages : []
            }

            // Specialization: include if changed (compare sorted arrays)
            const specializationsChanged =
                JSON.stringify(specializations.sort()) !==
                JSON.stringify(currentSpecializations.sort())
            if (specializationsChanged) {
                profile.specialization =
                    specializations.length > 0 ? specializations : []
            }

            // Only save if there are actual changes
            if (Object.keys(profile).length === 0) {
                setIsSaving(false)
                return // No changes to save
            }

            await onSave(profile)

            // Show success toast with localized message
            toast.success(
                t(
                    'linguistProfile.saveSuccess',
                    'Profile settings saved successfully'
                )
            )
        } catch (error) {
            console.error('Failed to save profile:', error)
            // Show error toast with detailed error message
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t(
                          'linguistProfile.saveError',
                          'Failed to save profile settings. Please try again.'
                      )
            toast.error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    const selectedCurrency = CURRENCIES.find((c) => c.code === currency)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">
                    {t('linguistProfile.title')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    {t('linguistProfile.description')}
                </p>
            </div>

            {/* Hourly Rate with Currency */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    {t('linguistProfile.hourlyRate')}
                </label>
                <div className="flex gap-2">
                    <div className="w-32">
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={hourlyRate}
                            onChange={(e) => {
                                setHourlyRate(e.target.value)
                            }}
                            placeholder={t('linguistProfile.ratePlaceholder')}
                        />
                    </div>
                    <Select value={currency} onValueChange={() => {}} disabled>
                        <SelectTrigger
                            className="w-[140px] opacity-60 cursor-not-allowed"
                            title={t(
                                'linguistProfile.currencyReadOnly',
                                'Currency selection will be available with currency exchange support'
                            )}
                        >
                            <SelectValue>
                                {selectedCurrency
                                    ? `${selectedCurrency.symbol} ${selectedCurrency.code}`
                                    : currency}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCIES.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.code} - {curr.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t(
                        'linguistProfile.currencyReadOnly',
                        'Currency selection will be available with currency exchange support'
                    )}
                </p>
                {isSaving && (
                    <p className="text-xs text-gray-500">
                        {t('linguistProfile.saving')}
                    </p>
                )}
            </div>

            {/* Language Pairs */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('linguistProfile.languagePairs')}
                </label>
                <Popover open={languagesOpen} onOpenChange={setLanguagesOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={languagesOpen}
                            className="w-auto min-w-[280px] justify-between h-auto min-h-10 py-2"
                        >
                            <div className="flex flex-wrap gap-1 flex-1">
                                {languages.length === 0 ? (
                                    <span className="text-muted-foreground">
                                        {t('linguistProfile.selectLanguages')}
                                    </span>
                                ) : (
                                    languages.map((lang) => (
                                        <Badge
                                            key={lang}
                                            variant="secondary"
                                            className="mr-1 mb-1"
                                        >
                                            {lang}
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        e.preventDefault()
                                                        setLanguages((prev) =>
                                                            prev.filter(
                                                                (l) =>
                                                                    l !== lang
                                                            )
                                                        )
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setLanguages((prev) =>
                                                        prev.filter(
                                                            (l) => l !== lang
                                                        )
                                                    )
                                                }}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </span>
                                        </Badge>
                                    ))
                                )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder={t(
                                    'linguistProfile.searchLanguages'
                                )}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {t('linguistProfile.noLanguagesFound')}
                                </CommandEmpty>
                                <CommandGroup>
                                    {LANGUAGE_PAIRS.map((lang) => (
                                        <CommandItem
                                            key={lang}
                                            value={lang}
                                            onSelect={() => {
                                                setLanguages((prev) =>
                                                    prev.includes(lang)
                                                        ? prev.filter(
                                                              (l) => l !== lang
                                                          )
                                                        : [...prev, lang]
                                                )
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    languages.includes(lang)
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                            {lang}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Specialization */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('linguistProfile.specialization')}
                </label>
                <Popover
                    open={specializationsOpen}
                    onOpenChange={setSpecializationsOpen}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={specializationsOpen}
                            className="w-auto min-w-[280px] justify-between h-auto min-h-10 py-2"
                        >
                            <div className="flex flex-wrap gap-1 flex-1">
                                {specializations.length === 0 ? (
                                    <span className="text-muted-foreground">
                                        {t(
                                            'linguistProfile.selectSpecializations'
                                        )}
                                    </span>
                                ) : (
                                    specializations.map((spec) => (
                                        <Badge
                                            key={spec}
                                            variant="secondary"
                                            className="mr-1 mb-1"
                                        >
                                            {spec}
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        e.preventDefault()
                                                        setSpecializations(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (s) =>
                                                                        s !==
                                                                        spec
                                                                )
                                                        )
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setSpecializations((prev) =>
                                                        prev.filter(
                                                            (s) => s !== spec
                                                        )
                                                    )
                                                }}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </span>
                                        </Badge>
                                    ))
                                )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder={t(
                                    'linguistProfile.searchSpecializations'
                                )}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {t(
                                        'linguistProfile.noSpecializationsFound'
                                    )}
                                </CommandEmpty>
                                <CommandGroup>
                                    {SPECIALIZATIONS.map((spec) => (
                                        <CommandItem
                                            key={spec}
                                            value={spec}
                                            onSelect={() => {
                                                setSpecializations((prev) =>
                                                    prev.includes(spec)
                                                        ? prev.filter(
                                                              (s) => s !== spec
                                                          )
                                                        : [...prev, spec]
                                                )
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    specializations.includes(
                                                        spec
                                                    )
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                            {spec}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default LinguistProfileSettings

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/molecules/DateRangePicker'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/utils/logger'
import type {
    SearchLinguistsQuery,
    FilterOptionsResponse,
} from '@linguistnow/shared'

interface FilterBarProps {
    filters: SearchLinguistsQuery
    onFiltersChange: (filters: SearchLinguistsQuery) => void
    onClearFilters: () => void
    onDateChange: (
        startDate: string | undefined,
        endDate: string | undefined
    ) => void
}

/**
 * Filter bar component for searching and filtering linguists.
 * Provides language, specialization, timezone, rating, and rate filters.
 * @param filters - Current filter values
 * @param onFiltersChange - Callback when filters change
 * @param onClearFilters - Callback to clear all filters
 * @param onDateChange - Callback when date range changes
 */
const FilterBar: React.FC<FilterBarProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    onDateChange,
}) => {
    const { t } = useTranslation()
    const [filterOptions, setFilterOptions] =
        useState<FilterOptionsResponse | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await axios.get<FilterOptionsResponse>(
                    `${import.meta.env.VITE_API_URL}/api/linguists/filters`
                )
                setFilterOptions(response.data)
                logger.log('Filter options:', response.data)
            } catch (error) {
                console.error('Error fetching filter options:', error)
            } finally {
                setLoading(false)
            }
        }

        void fetchFilterOptions()
    }, [])

    const updateFilter = (key: keyof SearchLinguistsQuery, value: unknown) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const hasActiveFilters =
        filters.languages ||
        filters.specialization ||
        filters.minRate !== undefined ||
        filters.maxRate !== undefined ||
        filters.minRating !== undefined ||
        filters.availableOnly ||
        filters.requiredHours !== undefined

    if (loading) {
        return (
            <div className="w-full mb-4 p-4 border rounded-md">
                <p className="text-sm text-gray-500">
                    {t('dashboard.filters.loading')}
                </p>
            </div>
        )
    }

    return (
        <div className="w-full mb-4 p-4 border rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                    {t('dashboard.filters.title')}
                </h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-sm"
                    >
                        <X className="h-4 w-4 mr-1" />
                        {t('dashboard.filters.clear')}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range Picker */}
                <div className="lg:col-span-2">
                    <label className="text-sm font-medium mb-2 block">
                        {t('dashboard.dateRange.label')}
                    </label>
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onDateChange={onDateChange}
                    />
                </div>
                {/* Language Filter */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        {t('dashboard.filters.languages')}
                    </label>
                    <Select
                        value={filters.languages || '__all__'}
                        onValueChange={(value) => {
                            updateFilter(
                                'languages',
                                value === '__all__' ? undefined : value
                            )
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue
                                placeholder={t(
                                    'dashboard.filters.languagesPlaceholder'
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">
                                {t('dashboard.filters.all')}
                            </SelectItem>
                            {filterOptions?.languages.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {lang}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {filters.languages && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {filters.languages.split(',').map((lang) => (
                                <Badge key={lang} variant="secondary">
                                    {lang}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Specialization Filter */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        {t('dashboard.filters.specialization')}
                    </label>
                    <Select
                        value={filters.specialization || '__all__'}
                        onValueChange={(value) => {
                            updateFilter(
                                'specialization',
                                value === '__all__' ? undefined : value
                            )
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue
                                placeholder={t(
                                    'dashboard.filters.specializationPlaceholder'
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">
                                {t('dashboard.filters.all')}
                            </SelectItem>
                            {filterOptions?.specializations.map((spec) => (
                                <SelectItem key={spec} value={spec}>
                                    {spec}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {filters.specialization && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {filters.specialization.split(',').map((spec) => (
                                <Badge key={spec} variant="secondary">
                                    {spec}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rate Range Filter */}
                {filterOptions && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.filters.hourlyRate')}
                        </label>
                        <div className="px-2">
                            <Slider
                                value={[
                                    filters.minRate ??
                                        filterOptions.rateRange.min,
                                    filters.maxRate ??
                                        filterOptions.rateRange.max,
                                ]}
                                min={filterOptions.rateRange.min}
                                max={filterOptions.rateRange.max}
                                step={5}
                                onValueChange={([min, max]) => {
                                    updateFilter(
                                        'minRate',
                                        min === filterOptions.rateRange.min
                                            ? undefined
                                            : min
                                    )
                                    updateFilter(
                                        'maxRate',
                                        max === filterOptions.rateRange.max
                                            ? undefined
                                            : max
                                    )
                                }}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>
                                    $
                                    {filters.minRate ??
                                        filterOptions.rateRange.min}
                                </span>
                                <span>
                                    $
                                    {filters.maxRate ??
                                        filterOptions.rateRange.max}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Filter */}
                {filterOptions && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.filters.minRating')}
                        </label>
                        <Select
                            value={filters.minRating?.toString() || '__all__'}
                            onValueChange={(value) => {
                                updateFilter(
                                    'minRating',
                                    value === '__all__'
                                        ? undefined
                                        : Number(value)
                                )
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t('dashboard.filters.all')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">
                                    {t('dashboard.filters.all')}
                                </SelectItem>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <SelectItem
                                        key={rating}
                                        value={rating.toString()}
                                    >
                                        {rating}+ ⭐
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Project Size Filter */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium block">
                            {t('dashboard.filters.projectSize')}
                        </label>
                        <div
                            className="relative group"
                            title={t('dashboard.filters.projectSizeTooltip')}
                        >
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        </div>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={filters.requiredHours || ''}
                        onChange={(e) => {
                            updateFilter(
                                'requiredHours',
                                e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                            )
                        }}
                        placeholder={t(
                            'dashboard.filters.projectSizePlaceholder'
                        )}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    {filters.requiredHours && (
                        <p className="text-xs text-gray-500 mt-1">
                            {t('dashboard.filters.projectSizeHint', {
                                hours: filters.requiredHours,
                            })}
                        </p>
                    )}
                </div>

                {/* Availability Toggle */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        {t('dashboard.filters.availability')}
                    </label>
                    <Select
                        value={filters.availableOnly ? 'available' : 'all'}
                        onValueChange={(value) => {
                            updateFilter('availableOnly', value === 'available')
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('dashboard.filters.all')}
                            </SelectItem>
                            <SelectItem value="available">
                                {t('dashboard.filters.availableOnly')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}

export default FilterBar

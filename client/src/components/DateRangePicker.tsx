import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
    enUS,
    fr,
    es,
    de,
    it,
    pt,
    ja,
    ko,
    ar,
    ru,
    zhCN,
    type Locale,
} from 'date-fns/locale'
import { CalendarIcon, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { getWeekStartsOn, getDateFnsLocale } from '@linguistnow/shared'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar } from './ui/calendar'
import { DateInput } from './DateInput'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import { cn } from '../lib/utils'
import {
    PRESETS,
    getPresetRange,
    getDateAdjustedForTimezone,
    type DateRange,
} from '../utils/date-presets'

interface DateRangePickerProps {
    startDate?: string // ISO date string (YYYY-MM-DD)
    endDate?: string // ISO date string (YYYY-MM-DD)
    onDateChange: (
        startDate: string | undefined,
        endDate: string | undefined
    ) => void
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate,
    endDate,
    onDateChange,
}) => {
    const { t, i18n } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [isSmallScreen, setIsSmallScreen] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 960 : false
    )

    // Parse dates
    const initialFrom = startDate
        ? getDateAdjustedForTimezone(startDate)
        : new Date(new Date().setHours(0, 0, 0, 0))
    const initialTo = endDate
        ? getDateAdjustedForTimezone(endDate)
        : initialFrom

    const [range, setRange] = useState<DateRange>({
        from: initialFrom,
        to: initialTo,
    })

    const openedRangeRef = useRef<DateRange | undefined>(undefined)
    const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
        undefined
    )

    useEffect(() => {
        const handleResize = (): void => {
            setIsSmallScreen(window.innerWidth < 960)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        if (startDate || endDate) {
            setRange({
                from: startDate
                    ? getDateAdjustedForTimezone(startDate)
                    : new Date(),
                to: endDate ? getDateAdjustedForTimezone(endDate) : undefined,
            })
        }
    }, [startDate, endDate])

    // Determine weekStartsOn based on locale (needed for preset calculations)
    // Uses shared utility for consistency with AvailabilitySettings
    const weekStartsOn = useMemo((): 0 | 1 => {
        return getWeekStartsOn(i18n.language)
    }, [i18n.language])

    // Use the extracted utility function for preset calculations
    const calculatePresetRange = useMemo(() => {
        return (presetName: string): DateRange => {
            return getPresetRange(presetName, weekStartsOn)
        }
    }, [weekStartsOn])

    const setPreset = (preset: string): void => {
        const newRange = calculatePresetRange(preset)
        setRange(newRange)
    }

    useEffect(() => {
        const checkPreset = (): void => {
            for (const preset of PRESETS) {
                const presetRange = calculatePresetRange(preset.name)
                const normalizedRangeFrom = new Date(range.from)
                normalizedRangeFrom.setHours(0, 0, 0, 0)
                const normalizedPresetFrom = new Date(presetRange.from)
                normalizedPresetFrom.setHours(0, 0, 0, 0)

                const normalizedRangeTo = new Date(range.to ?? 0)
                normalizedRangeTo.setHours(0, 0, 0, 0)
                const normalizedPresetTo = new Date(presetRange.to ?? 0)
                normalizedPresetTo.setHours(0, 0, 0, 0)

                if (
                    normalizedRangeFrom.getTime() ===
                        normalizedPresetFrom.getTime() &&
                    normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
                ) {
                    setSelectedPreset(preset.name)
                    return
                }
            }
            setSelectedPreset(undefined)
        }

        checkPreset()
    }, [range, calculatePresetRange])

    useEffect(() => {
        if (isOpen) {
            openedRangeRef.current = range
        }
    }, [isOpen])

    const resetValues = (): void => {
        setRange({
            from: initialFrom,
            to: initialTo,
        })
    }

    // Map i18next locale codes to date-fns locales
    // Uses shared utility for consistency
    const dateFnsLocale = useMemo((): Locale => {
        const localeMap: Record<string, Locale> = {
            en: enUS,
            fr: fr,
            es: es,
            de: de,
            it: it,
            pt: pt,
            ja: ja,
            ko: ko,
            ar: ar,
            ru: ru,
            'zh-cn': zhCN,
        }
        return getDateFnsLocale(i18n.language, localeMap, enUS)
    }, [i18n.language])

    const formatDate = (date: Date): string => {
        return format(date, 'PPP', {
            locale: dateFnsLocale,
        })
    }

    const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
        if (!a || !b) return a === b
        return (
            a.from.getTime() === b.from.getTime() &&
            (!a.to || !b.to || a.to.getTime() === b.to.getTime())
        )
    }

    const PresetButton = ({
        preset,
        labelKey,
        isSelected,
    }: {
        preset: string
        labelKey: string
        isSelected: boolean
    }): React.ReactElement => (
        <Button
            className={cn(isSelected && 'pointer-events-none')}
            variant="ghost"
            onClick={() => {
                setPreset(preset)
            }}
        >
            <>
                <span
                    className={cn('pr-2 opacity-0', isSelected && 'opacity-70')}
                >
                    <Check className="h-4 w-4" />
                </span>
                {t(labelKey)}
            </>
        </Button>
    )

    return (
        <Popover
            modal={true}
            open={isOpen}
            onOpenChange={(open: boolean) => {
                if (!open) {
                    resetValues()
                }
                setIsOpen(open)
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-auto min-w-[280px] justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <div className="text-right flex-1">
                        <div className="py-1">
                            <div>
                                {range.to
                                    ? `${formatDate(range.from)} - ${formatDate(range.to)}`
                                    : formatDate(range.from)}
                            </div>
                        </div>
                    </div>
                    <div className="pl-1 opacity-60 -mr-2 scale-125">
                        {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto">
                <div className="flex py-2">
                    <div className="flex">
                        <div className="flex flex-col">
                            <div className="flex flex-col lg:flex-row gap-2 px-3 justify-end items-center lg:items-start pb-4 lg:pb-0">
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <DateInput
                                            value={range.from}
                                            onChange={(date) => {
                                                const toDate =
                                                    range.to == null ||
                                                    date > range.to
                                                        ? date
                                                        : range.to
                                                setRange((prevRange) => ({
                                                    ...prevRange,
                                                    from: date,
                                                    to: toDate,
                                                }))
                                            }}
                                        />
                                        <div className="py-1">-</div>
                                        <DateInput
                                            value={range.to}
                                            onChange={(date) => {
                                                const fromDate =
                                                    date < range.from
                                                        ? date
                                                        : range.from
                                                setRange((prevRange) => ({
                                                    ...prevRange,
                                                    from: fromDate,
                                                    to: date,
                                                }))
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {isSmallScreen && (
                                <Select
                                    defaultValue={selectedPreset}
                                    onValueChange={(value: string) => {
                                        setPreset(value)
                                    }}
                                >
                                    <SelectTrigger className="w-[180px] mx-auto mb-2">
                                        <SelectValue
                                            placeholder={t(
                                                'dashboard.dateRange.selectPreset',
                                                'Select...'
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESETS.map((preset) => (
                                            <SelectItem
                                                key={preset.name}
                                                value={preset.name}
                                            >
                                                {t(preset.labelKey)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div>
                                <Calendar
                                    mode="range"
                                    locale={dateFnsLocale}
                                    weekStartsOn={weekStartsOn}
                                    onSelect={(
                                        value:
                                            | { from?: Date; to?: Date }
                                            | undefined
                                    ) => {
                                        if (value?.from != null) {
                                            setRange({
                                                from: value.from,
                                                to: value.to,
                                            })
                                        }
                                    }}
                                    selected={range}
                                    numberOfMonths={isSmallScreen ? 1 : 2}
                                    defaultMonth={
                                        new Date(
                                            new Date().setMonth(
                                                new Date().getMonth() -
                                                    (isSmallScreen ? 0 : 1)
                                            )
                                        )
                                    }
                                    disabled={(date: Date) => {
                                        const today = new Date()
                                        today.setHours(0, 0, 0, 0)
                                        return date < today
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    {!isSmallScreen && (
                        <div className="flex flex-col items-end gap-1 pr-2 pl-6 pb-6">
                            <div className="flex w-full flex-col items-end gap-1 pr-2 pl-6 pb-6">
                                {PRESETS.map((preset) => (
                                    <PresetButton
                                        key={preset.name}
                                        preset={preset.name}
                                        labelKey={preset.labelKey}
                                        isSelected={
                                            selectedPreset === preset.name
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 py-2 pr-4">
                    <Button
                        onClick={() => {
                            setIsOpen(false)
                            resetValues()
                        }}
                        variant="ghost"
                    >
                        {t('dashboard.dateRange.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            setIsOpen(false)
                            if (
                                !areRangesEqual(range, openedRangeRef.current)
                            ) {
                                const fromStr = format(range.from, 'yyyy-MM-dd')
                                const toStr = range.to
                                    ? format(range.to, 'yyyy-MM-dd')
                                    : undefined
                                onDateChange(fromStr, toStr)
                            }
                        }}
                    >
                        {t('dashboard.dateRange.update', 'Update')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default DateRangePicker

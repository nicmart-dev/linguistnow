import { useTranslation } from 'react-i18next'
import { getDirection, type Locale } from './utils'

/**
 * Hook to get the current text direction (RTL or LTR) based on the current language
 * @returns 'rtl' | 'ltr'
 */
export const useDirection = (): 'rtl' | 'ltr' => {
    const { i18n } = useTranslation()
    const currentLocale = i18n.language as Locale
    return getDirection(currentLocale)
}

/**
 * Hook to check if the current language is RTL
 * @returns boolean
 */
export const useIsRTL = (): boolean => {
    const direction = useDirection()
    return direction === 'rtl'
}

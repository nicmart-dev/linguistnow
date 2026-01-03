import React, { createContext, useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import type { i18n } from 'i18next'
import i18nInstance from './index'
import { getLocale, saveLocale, getDirection, type Locale } from './utils'

interface LanguageContextType {
    switchLanguage: (lang: Locale) => void
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
    undefined
)

interface LanguageProviderProps {
    children: ReactNode
}

// Type assertion for i18next instance - needed due to module resolution
const i18n = i18nInstance as unknown as i18n

const LanguageProvider = ({ children }: LanguageProviderProps) => {
    // Update HTML direction and lang attribute when language changes
    const updateDocumentDirection = (locale: Locale) => {
        const direction = getDirection(locale)
        const htmlElement = document.documentElement

        // Set direction attribute
        htmlElement.setAttribute('dir', direction)

        // Set lang attribute
        htmlElement.setAttribute('lang', locale)

        // Add/remove RTL class for CSS targeting if needed
        if (direction === 'rtl') {
            htmlElement.classList.add('rtl')
            htmlElement.classList.remove('ltr')
        } else {
            htmlElement.classList.add('ltr')
            htmlElement.classList.remove('rtl')
        }
    }

    useEffect(() => {
        const detectedLocale = getLocale()
        void i18n.changeLanguage(detectedLocale)
        updateDocumentDirection(detectedLocale)

        // Listen for language changes
        const handleLanguageChanged = (lng: string) => {
            updateDocumentDirection(lng as Locale)
        }

        i18n.on('languageChanged', handleLanguageChanged)

        return () => {
            i18n.off('languageChanged', handleLanguageChanged)
        }
    }, [])

    const switchLanguage = (lang: Locale) => {
        // Type assertion needed due to TypeScript module resolution
        ;(saveLocale as (locale: Locale) => void)(lang)
        void i18n.changeLanguage(lang)
        updateDocumentDirection(lang)
    }

    return (
        <LanguageContext.Provider value={{ switchLanguage }}>
            <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </LanguageContext.Provider>
    )
}

export default LanguageProvider

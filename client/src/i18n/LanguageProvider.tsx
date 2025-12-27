import React, { createContext, useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import type { i18n as I18nType } from 'i18next'
import i18nInstance from './index'
import { getLocale, saveLocale, type Locale } from './utils'

// i18next instance is properly typed after initialization
const i18n = i18nInstance as I18nType

interface LanguageContextType {
    switchLanguage: (lang: Locale) => void
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
    undefined
)

interface LanguageProviderProps {
    children: ReactNode
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
    useEffect(() => {
        const detectedLocale = getLocale()
        void i18n.changeLanguage(detectedLocale)
    }, [])

    const switchLanguage = (lang: Locale) => {
        // Type assertion needed due to TypeScript module resolution
        ;(saveLocale as (locale: Locale) => void)(lang)
        void i18n.changeLanguage(lang)
    }

    return (
        <LanguageContext.Provider value={{ switchLanguage }}>
            <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </LanguageContext.Provider>
    )
}

export default LanguageProvider

// src/i18n/index.ts
import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocale } from './utils'

import enTranslations from './locales/en.json'
import frTranslations from './locales/fr.json'
import zhCnTranslations from './locales/zh-cn.json'
import esTranslations from './locales/es.json'
import deTranslations from './locales/de.json'
import itTranslations from './locales/it.json'
import ptTranslations from './locales/pt.json'
import jaTranslations from './locales/ja.json'
import koTranslations from './locales/ko.json'
import arTranslations from './locales/ar.json'
import ruTranslations from './locales/ru.json'

const resources = {
    en: { translation: enTranslations },
    fr: { translation: frTranslations },
    'zh-cn': { translation: zhCnTranslations },
    es: { translation: esTranslations },
    de: { translation: deTranslations },
    it: { translation: itTranslations },
    pt: { translation: ptTranslations },
    ja: { translation: jaTranslations },
    ko: { translation: koTranslations },
    ar: { translation: arTranslations },
    ru: { translation: ruTranslations },
}

i18next.use(initReactI18next).init({
    resources,
    lng: getLocale(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes values
    },
    react: {
        useSuspense: false, // Disable suspense to avoid issues
        bindI18n: 'languageChanged', // Bind to languageChanged event
        bindI18nStore: 'added removed', // Bind to store events
    },
})

export default i18next

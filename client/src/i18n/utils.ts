/* 
Function to get browser language to support automatically setting language at initial load.

Testing changing the browser language involves adjusting the settings of your browser. Here's how you can do it in different browsers:
Google Chrome

Open Chrome and go to a new tab.
Open Developer Tools by pressing Ctrl + Shift + I (Windows/Linux) or Cmd + Option + I (Mac).
In the DevTools window, click on the three vertical dots (⋮) in the top-right corner.
Go to "More tools" > "Sensors".
Under "Geolocation", select the desired language from the dropdown menu.
*/

export type Locale =
    | 'en'
    | 'fr'
    | 'zh-cn'
    | 'es'
    | 'de'
    | 'it'
    | 'pt'
    | 'ja'
    | 'ko'
    | 'ar'
    | 'ru'

const STORAGE_KEY = 'linguistnow-language'

const isLocalStorageAvailable = (): boolean => {
    try {
        const test = '__localStorage_test__'
        localStorage.setItem(test, test)
        localStorage.removeItem(test)
        return true
    } catch {
        return false
    }
}

export const getLocale = (): Locale => {
    // First, check localStorage for saved language preference
    if (isLocalStorageAvailable()) {
        const savedLanguage = localStorage.getItem(STORAGE_KEY)
        if (savedLanguage) {
            const supportedLocales: Locale[] = [
                'en',
                'fr',
                'zh-cn',
                'es',
                'de',
                'it',
                'pt',
                'ja',
                'ko',
                'ar',
                'ru',
            ]
            if (supportedLocales.includes(savedLanguage as Locale)) {
                return savedLanguage as Locale
            }
        }
    }

    // Fall back to browser language if no saved preference
    const browserLang = navigator.language.toLowerCase()
    const language = browserLang.split(/[-_]/)[0] // Extract language code only

    // Map browser language codes to our locale codes
    const localeMap: Record<string, Locale> = {
        en: 'en',
        fr: 'fr',
        zh: 'zh-cn',
        es: 'es',
        de: 'de',
        it: 'it',
        pt: 'pt',
        ja: 'ja',
        ko: 'ko',
        ar: 'ar',
        ru: 'ru',
    }

    const detectedLocale = localeMap[language] ?? 'en'

    // Save the detected locale to localStorage for future use
    if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, detectedLocale)
    }

    return detectedLocale
}

// RTL languages (only Arabic is currently supported)
const RTL_LANGUAGES: Locale[] = ['ar']

/**
 * Check if a locale is a Right-to-Left (RTL) language
 */
export const isRTL = (locale: Locale): boolean => {
    return RTL_LANGUAGES.includes(locale)
}

/**
 * Get the text direction for a locale
 */
export const getDirection = (locale: Locale): 'ltr' | 'rtl' => {
    return isRTL(locale) ? 'rtl' : 'ltr'
}

export const saveLocale = (locale: Locale): void => {
    if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, locale)
    }
}

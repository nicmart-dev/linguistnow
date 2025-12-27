// src/i18n/index.ts
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl'
import messages from './strings.json' // Import JSON file
import { getLocale } from './utils'

const cache = createIntlCache()

const locale = getLocale()

const intl = createIntl(
    {
        locale,
        messages: messages[locale] as Record<string, string>,
    },
    cache
)

export { RawIntlProvider, intl, locale }

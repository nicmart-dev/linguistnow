// src/i18n/index.js
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import { messages } from './messages';

const cache = createIntlCache();

const getLocale = () => {
    // You can implement your logic to determine the locale
    // For simplicity, let's use navigator.language
    const language = navigator.language.split(/[-_]/)[0]; // Extract language code only
    return ['en', 'fr'].includes(language) ? language : 'en';
};

const locale = getLocale();

const intl = createIntl(
    {
        locale,
        messages: messages[locale],
    },
    cache
);

export { RawIntlProvider, intl, locale };

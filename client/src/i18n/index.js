// src/i18n/index.js
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import messages from "./strings.json"; // Import JSON file
import { getLocale } from "./utils";

const cache = createIntlCache();

const locale = getLocale();

const intl = createIntl(
    {
        locale,
        messages: messages[locale],
    },
    cache
);

export { RawIntlProvider, intl, locale };

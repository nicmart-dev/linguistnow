import React, { createContext, useState, useEffect, type ReactNode } from "react";
import { createIntl, createIntlCache, RawIntlProvider } from "react-intl";
import messages from "./strings.json";
import { getLocale, type Locale } from "./utils";

const cache = createIntlCache();

interface LanguageContextType {
    switchLanguage: (lang: Locale) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
    const [locale, setLocale] = useState<Locale>("en");

    useEffect(() => {
        setLocale(getLocale());
    }, []);

    const intl = createIntl(
        {
            locale,
            messages: messages[locale] as Record<string, string>,
        },
        cache
    );

    const switchLanguage = (lang: Locale) => {
        setLocale(lang);
    };

    return (
        <LanguageContext.Provider value={{ switchLanguage }}>
            <RawIntlProvider value={intl}>{children}</RawIntlProvider>
        </LanguageContext.Provider>
    );
};

export default LanguageProvider;

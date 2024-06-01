import React, { useState } from "react";
import { createIntl, createIntlCache, RawIntlProvider } from "react-intl";
import { messages } from "./messages";

const cache = createIntlCache();

const LanguageContext = React.createContext(); // Create context

const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState("en");

  const intl = createIntl(
    {
      locale,
      messages: messages[locale],
    },
    cache
  );

  const switchLanguage = (lang) => {
    setLocale(lang);
  };

  return (
    <LanguageContext.Provider value={{ switchLanguage }}>
      <RawIntlProvider value={intl}>{children}</RawIntlProvider>
    </LanguageContext.Provider>
  );
};

export { LanguageProvider as default, LanguageContext }; // Export LanguageProvider as default

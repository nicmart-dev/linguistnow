### Overview

This document outlines the implementation of internationalization (i18n) using the [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) libraries in a React application. String translations are externalized to separate locale JSON files in the `client/src/i18n/locales/` directory.

### Components Involved

1. **App Component**
2. **LanguageProvider Component**
3. **Locale Context**
4. **i18n Configuration**

### Supported Locales

The application supports 11 languages:

- English (en)
- French (fr)
- Simplified Chinese (zh-cn)
- Spanish (es)
- German (de)
- Italian (it)
- Portuguese (pt)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Russian (ru)

### i18n Configuration

The i18n configuration is set up in `client/src/i18n/index.ts`:

- Initializes i18next with all locale resources
- Configures React-i18next bindings
- Sets up language detection using browser settings
- Falls back to English if the detected language is not supported

### LanguageProvider Component

- Manages the current locale and language switching.
- Initializes the `I18nextProvider` from `react-i18next`, providing localization data to the application.
- Exposes methods to change the locale via the `switchLanguage` function in the context.
- Automatically detects the browser language on initial load.

### Locale Context

- Utilizes React's context API to provide language switching functionality to child components.
- Allows components throughout the application to change the locale programmatically.

### Translation Files

Translation files are located in `client/src/i18n/locales/`:

- Each locale has its own JSON file (e.g., `en.json`, `fr.json`, `zh-cn.json`)
- Translation keys use dot notation for namespacing (e.g., `dashboard.availability`)
- Plural forms use i18next's plural suffix convention (`_one`, `_other`)
- Interpolation uses double curly braces: `{{variable}}`

### Usage in Components

Components access localized messages using the `useTranslation` hook from `react-i18next`:

```typescript
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
    const { t } = useTranslation()

    return (
        <div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.description', { userName: 'John' })}</p>
        </div>
    )
}
```

### Pluralization

i18next automatically handles plural forms based on the `count` value:

```typescript
// Translation keys: dashboard.errors.invalidRefreshToken_one and dashboard.errors.invalidRefreshToken_other
{
  t("dashboard.errors.invalidRefreshToken", {
    count: 5,
    emails: "user@example.com",
  });
}
```

### Workflow

1. **Initialization**: The `LanguageProvider` component initializes i18next with the detected browser language or falls back to English.
2. **Locale Change**: Users can change the locale through the language selector in the navbar, which calls `switchLanguage` from the context.
3. **Localization**: Components access localized messages using the `useTranslation` hook and `t()` function.

### Conclusion

This design provides a straightforward approach to implementing internationalization in a React application using i18next and react-i18next. It centralizes locale management, supports automatic language detection, and provides a seamless way to handle language translations throughout the application with support for 11 languages.

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RawIntlProvider, intl } from './i18n'
import './tailwind.css'
import './index.css'
import { env } from './env'

// Validate required environment variables at startup
try {
    // This will throw if env vars are invalid
    void env;
} catch (error) {
    console.error('Invalid environment configuration:', error);
    console.error('Please check your .env file or build configuration.');
}

const container = document.getElementById('root')
if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container)

root.render(
    <RawIntlProvider value={intl}>
        <App />
    </RawIntlProvider>
)

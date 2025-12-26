import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RawIntlProvider, intl } from './i18n'
import './tailwind.css'
import './index.css'

// Validate required environment variables at startup
const requiredEnvVars = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file or build configuration.');
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
    <RawIntlProvider value={intl}>
        <App />
    </RawIntlProvider>
)

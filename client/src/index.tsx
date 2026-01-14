import React from 'react'
import { createRoot } from 'react-dom/client'
import AppWrapper from './App'
import './i18n' // Initialize i18n
import './tailwind.css'
import './index.css'
import { env } from './env'

// Suppress harmless console warnings/errors in production only
// In development, show all logs for debugging
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

if (!isDevelopment) {
    // Suppress harmless Cross-Origin-Opener-Policy warnings from @react-oauth/google
    // These warnings occur when the library checks if the OAuth popup is closed,
    // but the browser's security policy blocks this check. They don't affect functionality.
    const originalWarn = console.warn;
    console.warn = (...args) => {
        // Check all arguments for COOP-related messages
        const message = args.map(arg => String(arg)).join(' ');
        // Suppress COOP warnings from OAuth library (can appear in different formats)
        if (message.includes('Cross-Origin-Opener-Policy') || 
            message.includes('window.closed') ||
            message.includes('COOP') ||
            (message.includes('policy') && message.includes('block'))) {
            return; // Suppress this warning in production
        }
        originalWarn.apply(console, args);
    };

    // Also suppress unhandled promise rejections from browser extensions
    // These are often caused by browser extensions and don't affect the app
    const originalError = console.error;
    console.error = (...args) => {
        const message = args.map(arg => String(arg)).join(' ');
        // Suppress common browser extension errors that don't affect functionality
        if (message.includes('message channel closed') && 
            message.includes('asynchronous response')) {
            return; // Suppress browser extension message channel errors in production
        }
        originalError.apply(console, args);
    };
}

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
    <AppWrapper />
)

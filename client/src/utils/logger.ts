/**
 * Conditional logging utility - only logs in development mode
 * In production, these logs are stripped out to reduce console noise
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
    log: (...args: unknown[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors, even in production, as they're important
        console.error(...args);
    },
    info: (...args: unknown[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
};


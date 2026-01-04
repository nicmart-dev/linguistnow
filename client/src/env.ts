import { z } from 'zod'

const envSchema = z.object({
    VITE_GOOGLE_CLIENT_ID: z.string().optional(),
    VITE_API_URL: z.string().optional(),
})

// Parse with defaults for build time (when env vars might not be set)
// These will be replaced at build time by Vite
export const env = envSchema.parse({
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

import { z } from 'zod'

const envSchema = z.object({
    VITE_GOOGLE_CLIENT_ID: z.string().min(1),
    VITE_API_URL: z.url(),
})

export const env = envSchema.parse({
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_API_URL: import.meta.env.VITE_API_URL,
})

import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    FRONTEND_URL: z.url().optional(),
    AIRTABLE_PERSONAL_ACCESS_TOKEN: z.string().min(1).optional(),
    AIRTABLE_API_KEY: z.string().min(1).optional(),
    AIRTABLE_BASE_ID: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.url().optional(),
    BACKEND_URL: z.url().optional(),
    VAULT_ADDR: z.url().optional(),
    VAULT_TOKEN: z.string().optional(),
    VAULT_SECRET_PATH: z.string().optional(),
  })
  .refine(
    (data) => data.AIRTABLE_PERSONAL_ACCESS_TOKEN || data.AIRTABLE_API_KEY,
    {
      message:
        "Either AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set",
    },
  );

let _env: z.infer<typeof envSchema> | null = null;

function getEnv() {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

// Export as a getter object so it behaves like the original env export
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    return getEnv()[prop as keyof typeof _env];
  },
  ownKeys() {
    return Object.keys(getEnv());
  },
  has(_target, prop) {
    return prop in getEnv();
  },
});

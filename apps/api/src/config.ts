import { z } from "zod";

const optionalString = z.string().transform((value) => (value.trim() === "" ? undefined : value.trim())).optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.string().default("info"),
  TENANT_HOST_SUFFIX: z.string().min(1),
  TENANT_DEFAULT_SLUG: z.string().min(1),
  TENANT_DEFAULT_ID: z.string().uuid(),
  REDIS_URL: optionalString,
  SUPABASE_URL: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_ANON_KEY: optionalString,
  CORS_ORIGINS: optionalString
});

export type AppConfig = z.infer<typeof envSchema>;

export const config: AppConfig = envSchema.parse(process.env);

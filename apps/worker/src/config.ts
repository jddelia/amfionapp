import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  REDIS_URL: z.string().min(1),
  QUEUE_PREFIX: z.string().default("amfion")
});

export type WorkerConfig = z.infer<typeof envSchema>;

export const config: WorkerConfig = envSchema.parse(process.env);

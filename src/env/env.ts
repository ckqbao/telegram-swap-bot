import { z } from 'zod';
import * as dotenv from 'dotenv';

const envPath = '.env';

// eslint-disable @typescript-eslint/no-var-requires
const result = dotenv.config({ path: envPath, override: true });

if (result.parsed && !result.error) {
  console.log(`[env] Loaded variables from ${envPath}`);
} else {
  console.log(`[env] No env file found at ${envPath}, skipping`);
}

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  JUPITER_API_URL: z.string().default('https://lite-api.jup.ag'),
  ONE_INCH_API_KEY: z.string(),
  ONE_INCH_BASE_URL: z.string().default('https://api.1inch.com'),
  TELEGRAM_BOT_TOKEN: z.string().default('8063071679:AAGZzFTNZjaKgR-p3Gz7CLHUugNcKp9GkCk'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/postgres'),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const envData = parsed.data;
const developmentSecret = 'development-secret-key-32-chars!!';
const jwtSecret = envData.JWT_SECRET ?? developmentSecret;
if (!envData.JWT_SECRET && envData.NODE_ENV === 'production') {
  console.error('Missing JWT_SECRET in production environment.');
  process.exit(1);
}
if (!envData.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Falling back to a development secret. Do not use this in production.');
}

export const env = {
  ...envData,
  JWT_SECRET: jwtSecret,
};

import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  databaseUrl: z.string().url(),
  jwtSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),
  jwtRefreshExpiresIn: z.string().default('30d'),
  bcryptSaltRounds: z.coerce.number().default(12),
  rateLimitWindowMs: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(100),
  allowedOrigins: z.string().transform(str => str.split(',').map(s => s.trim())).default('http://localhost:5173,http://localhost:3000'),
});

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/henry',
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_min_32_chars_development',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_here_min_32_chars_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS || 12,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000',
};

export const config = configSchema.parse(env);

// Ensure we're not using development secrets in production
if (config.nodeEnv === 'production') {
  if (config.jwtSecret.includes('development') || config.jwtRefreshSecret.includes('development')) {
    throw new Error('Production environment detected but using development JWT secrets. Please set proper JWT secrets in environment variables.');
  }
}
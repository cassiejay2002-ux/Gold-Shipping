/**
 * AurumTrack - System Configuration
 * Validates and exposes environment settings with secure defaults.
 * Never stores or exposes hardcoded secrets.
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  appUrl: string;
  database: {
    url?: string;
    maxConnections: number;
    ssl: boolean;
  };
  auth: {
    provider: 'internal' | 'supabase';
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    sessionDurationSeconds: number;
  };
  storage: {
    provider: 'memory' | 's3' | 'gcs' | 'supabase';
    bucketName: string;
    signedUrlExpirySeconds: number;
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
  };
  security: {
    corsAllowedOrigins: string[];
    rateLimitMaxRequests: number;
    rateLimitWindowMs: number;
    trustProxy: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    redactKeys: string[];
  };
}

export function loadConfig(): AppConfig {
  const isProd = process.env.NODE_ENV === 'production';

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return {
    env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
    port: 3000, // Mandatory container port
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    database: {
      url: process.env.DATABASE_URL,
      maxConnections: isProd ? 20 : 5,
      ssl: isProd,
    },
    auth: {
      provider: (process.env.AUTH_PROVIDER as 'internal' | 'supabase') || 'internal',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      sessionDurationSeconds: 86400, // 24 hours
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as AppConfig['storage']['provider']) || 'memory',
      bucketName: process.env.STORAGE_BUCKET_NAME || 'aurumtrack-secure-vault',
      signedUrlExpirySeconds: 900, // 15 minutes default for sensitive documents
      maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB max
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/json',
      ],
    },
    security: {
      corsAllowedOrigins: allowedOrigins,
      rateLimitMaxRequests: 100, // 100 requests
      rateLimitWindowMs: 60 * 1000, // per minute
      trustProxy: true,
    },
    logging: {
      level: (process.env.LOG_LEVEL as AppConfig['logging']['level']) || 'info',
      redactKeys: [
        'password',
        'token',
        'secret',
        'authorization',
        'bearer',
        'privateKey',
        'apiKey',
        'cookie',
        'cert',
      ],
    },
  };
}

export const config = loadConfig();

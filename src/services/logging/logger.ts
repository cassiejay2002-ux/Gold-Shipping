/**
 * AurumTrack - Structured Logging & Error Handling
 * Formats structured JSON logs, redacts sensitive keys, and prevents credential leaks.
 */

import { config } from '../../config/index.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string; // ISO-8601 UTC
  severity: LogLevel;
  eventType: string;
  message: string;
  requestId?: string;
  organizationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Deeply sanitizes an object by recursively masking any key listed in the redaction list.
 */
export function sanitizeContext(data: unknown, redactKeys: string[] = config.logging.redactKeys): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeContext(item, redactKeys));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = redactKeys.some(rk => key.toLowerCase().includes(rk.toLowerCase()));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value, redactKeys);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class StructuredLogger {
  private levelPriority: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
  };

  private currentLevel = config.logging.level;

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.currentLevel];
  }

  private write(entry: LogEntry): void {
    const isProd = config.env === 'production';
    const logString = JSON.stringify(entry);

    if (entry.severity === 'error' || entry.severity === 'fatal') {
      console.error(logString);
    } else if (entry.severity === 'warn') {
      console.warn(logString);
    } else {
      console.log(logString);
    }
  }

  public log(level: LogLevel, eventType: string, message: string, meta?: {
    requestId?: string;
    organizationId?: string;
    userId?: string;
    context?: Record<string, unknown>;
    error?: Error;
  }): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity: level,
      eventType,
      message,
      requestId: meta?.requestId,
      organizationId: meta?.organizationId,
      userId: meta?.userId,
      context: meta?.context ? (sanitizeContext(meta.context) as Record<string, unknown>) : undefined,
      error: meta?.error
        ? {
            name: meta.error.name,
            message: meta.error.message,
            stack: config.env === 'development' ? meta.error.stack : undefined, // Never leak full stack in production
          }
        : undefined,
    };

    this.write(entry);
  }

  public debug(eventType: string, message: string, meta?: Parameters<StructuredLogger['log']>[3]): void {
    this.log('debug', eventType, message, meta);
  }

  public info(eventType: string, message: string, meta?: Parameters<StructuredLogger['log']>[3]): void {
    this.log('info', eventType, message, meta);
  }

  public warn(eventType: string, message: string, meta?: Parameters<StructuredLogger['log']>[3]): void {
    this.log('warn', eventType, message, meta);
  }

  public error(eventType: string, message: string, meta?: Parameters<StructuredLogger['log']>[3]): void {
    this.log('error', eventType, message, meta);
  }

  public fatal(eventType: string, message: string, meta?: Parameters<StructuredLogger['log']>[3]): void {
    this.log('fatal', eventType, message, meta);
  }
}

export const logger = new StructuredLogger();

// ====================================================================
// Standardized Application Errors (Fail-Closed, Safe Responses)
// ====================================================================
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_FAILED', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication credentials invalid or missing') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions or organization boundary violation') {
    super(message, 403, 'PERMISSION_DENIED');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'RESOURCE_CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please retry later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Format a safe API response for errors that guarantees internal stack traces
 * and sensitive connection details are never shown to end users.
 */
export function formatSafeErrorResponse(err: unknown, requestId?: string) {
  if (err instanceof AppError) {
    return {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
        requestId,
      },
    };
  }

  // Generic or unexpected internal errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected security or processing error occurred.',
      requestId,
    },
  };
}

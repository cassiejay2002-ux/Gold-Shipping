/**
 * AurumTrack - HTTP & API Security Middlewares
 * Enforces secure headers, correlation IDs, rate-limiting, CORS, and safe error handling.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index.js';
import { logger, formatSafeErrorResponse, RateLimitError } from '../../services/logging/logger.js';

// Extend Express Request to include AurumTrack security context
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTimeMs: number;
    }
  }
}

/**
 * Request Correlation ID Middleware
 * Generates or extracts a distributed tracing ID for end-to-end auditability.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('x-correlation-id') || req.header('x-request-id');
  const correlationId = incomingId && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId)
    ? incomingId
    : 'req_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

  req.correlationId = correlationId;
  req.startTimeMs = Date.now();

  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', correlationId);

  next();
}

/**
 * Hardened Security Headers Middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking defense
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  next();
}

/**
 * In-Memory Sliding Window Rate Limiter
 * Guards API endpoints against brute force and denial of service.
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = config.security.rateLimitMaxRequests, windowMs = config.security.rateLimitWindowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodically clean up stale records
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.requests.entries()) {
        const active = timestamps.filter(t => now - t < this.windowMs);
        if (active.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, active);
        }
      }
    }, 60000).unref();
  }

  public checkLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(ip) || [];
    const windowStart = now - this.windowMs;

    const recent = timestamps.filter(t => t > windowStart);
    if (recent.length >= this.maxRequests) {
      return false;
    }

    recent.push(now);
    this.requests.set(ip, recent);
    return true;
  }
}

const rateLimiter = new RateLimiter();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const allowed = rateLimiter.checkLimit(clientIp);

  if (!allowed) {
    logger.warn('RATE_LIMIT_EXCEEDED', `Client ${clientIp} exceeded rate limit`, {
      requestId: req.correlationId,
      context: { path: req.path, method: req.method },
    });
    throw new RateLimitError('Too many requests. Please slow down.');
  }

  next();
}

/**
 * CORS Middleware with strict origin checking
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.header('origin');
  
  if (origin) {
    const isAllowed = config.security.corsAllowedOrigins.includes('*') ||
                      config.security.corsAllowedOrigins.includes(origin);

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID, X-Requested-With');
    }
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

/**
 * Safe Centralized Error Handling Middleware
 * Catch-all handler that formats safe JSON responses and never leaks stack traces.
 */
export function safeErrorHandlerMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = (err as any).statusCode || 500;

  logger.error('HTTP_REQUEST_ERROR', `Request error on ${req.method} ${req.path}: ${err.message}`, {
    requestId: req.correlationId,
    error: err,
    context: {
      path: req.path,
      method: req.method,
      statusCode,
    },
  });

  const responseBody = formatSafeErrorResponse(err, req.correlationId);
  res.status(statusCode).json(responseBody);
}

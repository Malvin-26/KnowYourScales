import type { NextFunction, Request, Response } from 'express';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const helmetMiddleware = (helmet as any).default ?? helmet;
const rateLimitMiddleware = (rateLimit as any).default ?? rateLimit;
const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '').trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (blockedKeys.has(key)) continue;
      sanitized[key] = sanitizeValue(nested);
    }
    return sanitized;
  }

  return value;
}

export const securityHeaders = helmetMiddleware({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const apiRateLimiter = rateLimitMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export const authRateLimiter = rateLimitMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeValue(req.body) as Record<string, unknown>;
  }
  if (req.query) {
    req.query = sanitizeValue(req.query) as Request['query'];
  }
  if (req.params) {
    req.params = sanitizeValue(req.params) as Request['params'];
  }
  next();
}

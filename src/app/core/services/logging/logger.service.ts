import { Injectable, isDevMode } from '@angular/core';

const SENSITIVE_KEY =
  /(authorization|cookie|password|token|email|phone|telephone|ncc|secret|refresh)/i;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isDevMode()) {
      return;
    }
    console.debug(`[PDREF] ${message}`, this.redact(context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!isDevMode()) {
      return;
    }
    console.info(`[PDREF] ${message}`, this.redact(context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!isDevMode()) {
      return;
    }
    console.warn(`[PDREF] ${message}`, this.redact(context));
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (!isDevMode()) {
      return;
    }

    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[PDREF] ${message}`, { ...this.redact(context), errorType });
  }

  private redact(context?: Record<string, unknown>): Record<string, unknown> {
    if (!context) {
      return {};
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      sanitized[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : value;
    }
    return sanitized;
  }
}

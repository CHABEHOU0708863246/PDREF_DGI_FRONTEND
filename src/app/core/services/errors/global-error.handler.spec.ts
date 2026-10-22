import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CorrelationService } from '../correlation/correlation.service';
import { LoggerService } from '../logging/logger.service';
import { NotificationService } from '../notifications/notification.service';
import { GlobalErrorHandler } from './global-error.handler';

describe('GlobalErrorHandler', () => {
  it('affiche une erreur generique sans stack', () => {
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        NotificationService,
        LoggerService,
        CorrelationService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const handler = TestBed.inject(GlobalErrorHandler);
    const notifications = TestBed.inject(NotificationService);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    handler.handleError(new TypeError('boom secret'));

    const toast = notifications.toasts()[0];
    expect(toast?.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(toast)).not.toContain('boom secret');
  });
});

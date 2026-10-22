import type { ErrorHandler } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import { LoggerService } from '../logging/logger.service';
import { NotificationService } from '../notifications/notification.service';
import { CorrelationService } from '../correlation/correlation.service';
import { normalizeProblem } from '../../utils/problem';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationService);
  private readonly correlation = inject(CorrelationService);

  handleError(error: unknown): void {
    const problem = normalizeProblem(error, this.correlation.last);
    this.logger.error('Erreur non geree', error);
    this.notifications.showProblem(problem);
  }
}

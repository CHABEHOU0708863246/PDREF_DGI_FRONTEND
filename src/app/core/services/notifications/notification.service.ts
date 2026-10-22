import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { NotificationTone, ToastMessage } from '../../models/notifications/notification.model';
import { newCorrelationId } from '../../utils/correlation';
import { sanitizeDetail } from '../../utils/problem';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<ToastMessage[]>([]);

  readonly toasts = this.state.asReadonly();

  success(title: string, message: string): void {
    this.push('success', title, message, 4_000);
  }

  info(title: string, message: string): void {
    this.push('info', title, message, 4_000);
  }

  warning(title: string, message: string): void {
    this.push('warning', title, message, 5_000);
  }

  error(title: string, message: string): void {
    this.push('error', title, message, 0);
  }

  showProblem(problem: ApiProblemDetails): void {
    const tone: NotificationTone =
      problem.status === 401 || problem.status === 403 || problem.status === 429
        ? 'warning'
        : 'error';

    const toast: ToastMessage = {
      id: newCorrelationId(),
      tone,
      title: problem.title || problem.code,
      message: sanitizeDetail(problem.detail) ?? this.defaultMessage(problem.code),
      code: problem.code,
      traceId: problem.traceId,
      reference: problem.reference ?? null,
      status: problem.status,
      sticky: true,
    };

    this.state.update((toasts) => [...toasts, toast]);
  }

  dismiss(id: string): void {
    this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.state.set([]);
  }

  private push(tone: NotificationTone, title: string, message: string, duration: number): void {
    if (!this.isBrowser) {
      return;
    }

    const toast: ToastMessage = {
      id: newCorrelationId(),
      tone,
      title,
      message,
      sticky: duration === 0,
    };
    this.state.update((toasts) => [...toasts, toast]);

    if (duration > 0) {
      window.setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  private defaultMessage(code: string): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Verifiez votre connexion puis reessayez.';
      case 'UNAUTHENTICATED':
      case 'SESSION_EXPIRED':
        return 'Votre session a expire. Reconnectez-vous.';
      case 'PERMISSION_DENIED':
        return "Vous n'avez pas les droits necessaires pour cette action.";
      case 'RATE_LIMITED':
        return 'Trop de requetes. Patientez avant de reessayer.';
      case 'SERVICE_UNAVAILABLE':
        return 'Le service est momentanement indisponible.';
      default:
        return 'Une erreur est survenue. Reessayez ou contactez le support.';
    }
  }
}

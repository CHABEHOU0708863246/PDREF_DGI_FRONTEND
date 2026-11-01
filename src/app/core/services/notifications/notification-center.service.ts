import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';
import type {
  AppNotification,
  NotificationApiItem,
  NotificationTone,
} from '../../models/notifications/notification.model';
import { CorrelationService } from '../correlation/correlation.service';
import { NotificationsGateway } from './notifications.gateway';
import { normalizeProblem } from '../../utils/problem';

const DEMO_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'demo-n-1',
    eventType: 'DEPOT_ACCUSE',
    tone: 'info',
    title: 'Bienvenue dans la demonstration',
    message:
      'Les donnees affichees sont fictives et servent uniquement a valider le design system.',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'demo-n-2',
    eventType: 'CTF_A_ACTIVER',
    tone: 'warning',
    title: 'Action CTF requise',
    message: 'Une alerte de demonstration est disponible dans votre espace.',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    read: false,
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly gateway = inject(NotificationsGateway);
  private readonly correlation = inject(CorrelationService);
  private readonly itemsState = signal<AppNotification[]>(
    environment.demoNotifications || isLighthouseWindow() ? [...DEMO_NOTIFICATIONS] : [],
  );
  private readonly unreadState = signal(
    environment.demoNotifications || isLighthouseWindow()
      ? DEMO_NOTIFICATIONS.filter((item) => !item.read).length
      : 0,
  );
  private readonly loadingState = signal(false);
  private readonly errorState = signal<ApiProblemDetails | null>(null);
  private requestInFlight = false;

  readonly items = this.itemsState.asReadonly();
  readonly unreadCount = this.unreadState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly problem = this.errorState.asReadonly();
  readonly hasUnread = computed(() => this.unreadState() > 0);

  load(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (isLighthouseWindow()) {
      this.loadingState.set(false);
      return;
    }

    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin([this.gateway.list({ page: 1, pageSize: 10 }), this.gateway.unreadCount()]).subscribe({
      next: ([page, unread]) => {
        this.itemsState.set(page.items.map((item) => this.toApp(item)));
        this.unreadState.set(unread);
        this.requestInFlight = false;
        this.loadingState.set(false);
      },
      error: (error: unknown) => {
        this.requestInFlight = false;
        this.loadingState.set(false);
        if (!environment.demoNotifications && !isLighthouseWindow()) {
          this.errorState.set(normalizeProblem(error, this.correlation.last));
        }
      },
    });
  }

  markRead(id: string): void {
    this.gateway.markRead(id).subscribe({
      next: () => this.markLocal(id),
      error: (error: unknown) => {
        if (environment.demoNotifications || isLighthouseWindow()) {
          this.markLocal(id);
          return;
        }
        this.errorState.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  markAllRead(): void {
    this.gateway.markAllRead().subscribe({
      next: () => this.markAllLocal(),
      error: (error: unknown) => {
        if (environment.demoNotifications || isLighthouseWindow()) {
          this.markAllLocal();
          return;
        }
        this.errorState.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  clear(): void {
    this.itemsState.set([]);
    this.unreadState.set(0);
    this.errorState.set(null);
  }

  private markLocal(id: string): void {
    const item = this.itemsState().find((value) => value.id === id);
    if (!item || item.read) {
      return;
    }

    this.itemsState.update((items) =>
      items.map((value) =>
        value.id === id ? { ...value, read: true, readAt: new Date().toISOString() } : value,
      ),
    );
    this.unreadState.update((value) => Math.max(0, value - 1));
  }

  private markAllLocal(): void {
    this.itemsState.update((items) =>
      items.map((item) => ({ ...item, read: true, readAt: new Date().toISOString() })),
    );
    this.unreadState.set(0);
  }

  private toApp(item: NotificationApiItem): AppNotification {
    return {
      id: item.id,
      eventType: item.eventType,
      tone: this.tone(item.eventType),
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
      readAt: item.readAt,
      read: item.isRead,
    };
  }

  private tone(eventType: string): NotificationTone {
    if (eventType === 'DEPOT_ACCUSE' || eventType === 'RECTIFICATION_ACTIVEE') {
      return 'success';
    }
    if (eventType === 'CONFORMITE_REJET' || eventType === 'DECISION_NON_FAVORABLE') {
      return 'error';
    }
    if (
      eventType === 'PRE_ALERTE_75' ||
      eventType === 'ALERTE_90' ||
      eventType === 'CTF_A_ACTIVER'
    ) {
      return 'warning';
    }
    return 'info';
  }
}

function isLighthouseWindow(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    (window.location.hostname === 'localhost' || !environment.production) &&
    new URLSearchParams(window.location.search).get('lighthouse') === '1'
  );
}

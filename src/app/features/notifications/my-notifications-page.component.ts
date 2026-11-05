import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { NotificationApiItem } from '../../core/models/notifications/notification.model';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { NotificationsGateway } from '../../core/services/notifications/notifications.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

type ReadFilter = 'all' | 'unread' | 'read';

const LIGHTHOUSE_NOTIFICATIONS: NotificationApiItem[] = [
  {
    id: 'lhci-n1',
    eventType: 'DEPOT_ACCUSE',
    title: 'Depot enregistre',
    message: 'Votre depot a bien ete enregistre.',
    readAt: null,
    isRead: false,
    createdAt: '2026-11-01T13:30:00Z',
  },
  {
    id: 'lhci-n2',
    eventType: 'CTF_A_ACTIVER',
    title: 'Action CTF requise',
    message: 'Un dossier attend une action du CTF.',
    readAt: '2026-11-01T13:31:00Z',
    isRead: true,
    createdAt: '2026-11-01T12:30:00Z',
  },
];

@Component({
  selector: 'pdref-my-notifications-page',
  standalone: true,
  imports: [AbidjanDatePipe, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-notifications-page.component.html',
  styleUrl: './my-notifications-page.component.scss',
})
export class MyNotificationsPageComponent {
  private readonly gateway = inject(NotificationsGateway);
  private readonly correlation = inject(CorrelationService);

  readonly items = signal<NotificationApiItem[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly filter = signal<ReadFilter>('all');
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly pageSize = 10;
  readonly message = signal<string | null>(null);

  constructor() {
    this.load(1);
  }

  load(page = this.page()): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (isLighthouseEnabled()) {
      this.items.set(LIGHTHOUSE_NOTIFICATIONS);
      this.totalCount.set(LIGHTHOUSE_NOTIFICATIONS.length);
      this.page.set(1);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.problem.set(null);
    this.gateway
      .list({
        read: this.filter() === 'all' ? null : this.filter() === 'read',
        page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
          this.page.set(response.page);
          this.totalCount.set(response.totalCount);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.problem.set(normalizeProblem(error, this.correlation.last));
        },
      });
  }

  setFilter(filter: ReadFilter): void {
    this.filter.set(filter);
    this.load(1);
  }

  markRead(item: NotificationApiItem): void {
    if (item.isRead) {
      return;
    }

    this.gateway.markRead(item.id).subscribe({
      next: () => {
        this.message.set('Notification marquee comme lue.');
        this.load(this.page());
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  markAllRead(): void {
    this.gateway.markAllRead().subscribe({
      next: (result) => {
        this.message.set(`${result.count} notification(s) marquee(s) comme lue(s).`);
        this.load(this.page());
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() * this.pageSize < this.totalCount()) {
      this.load(this.page() + 1);
    }
  }

  pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import { AUDIT_EVENT_CODES } from '../../core/models/audit/audit.model';
import type { AuditEvent, AuditFilter, AuditPage } from '../../core/models/audit/audit.model';
import { HttpAuditGateway } from '../../core/services/audit/http-audit.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';

@Component({
  selector: 'pdref-audit-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-list.component.html',
  styleUrl: './audit-list.component.scss',
})
export class AuditListComponent {
  private readonly gateway = inject(HttpAuditGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);

  readonly eventCodes = AUDIT_EVENT_CODES;
  readonly items = signal<AuditEvent[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly canExport = computed(() => this.permissions.hasPermission('Audit_Export'));

  readonly filters = new FormGroup({
    eventCode: new FormControl('', { nonNullable: true }),
    userId: new FormControl('', { nonNullable: true }),
    requestId: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.load();
  }

  apply(): void {
    this.load();
  }

  reset(): void {
    this.filters.reset({ eventCode: '', userId: '', requestId: '', from: '', to: '' });
    this.load();
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);
    this.gateway.query({ ...this.filterValue(), cursor }).subscribe({
      next: (page) => {
        this.items.update((items) => [...items, ...page.items]);
        this.nextCursor.set(page.nextCursor);
        this.loadingMore.set(false);
      },
      error: (error: unknown) => {
        this.loadingMore.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  export(format: 'csv' | 'json'): void {
    if (!this.canExport()) {
      return;
    }

    this.gateway.export(this.filterValue(), format).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `audit.${format}`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.query({ ...this.filterValue(), limit: 50 }).subscribe({
      next: (page: AuditPage) => {
        this.items.set(page.items);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.items.set([]);
        this.nextCursor.set(null);
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  private filterValue(): AuditFilter {
    const value = this.filters.getRawValue();
    return {
      eventCode: value.eventCode || undefined,
      userId: value.userId || undefined,
      requestId: value.requestId || undefined,
      from: value.from ? `${value.from}T00:00:00.000Z` : undefined,
      to: value.to ? `${value.to}T23:59:59.999Z` : undefined,
    };
  }
}

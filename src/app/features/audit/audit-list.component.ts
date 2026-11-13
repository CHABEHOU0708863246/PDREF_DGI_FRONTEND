import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import { AUDIT_EVENT_CODES } from '../../core/models/audit/audit.model';
import type {
  AuditEvent,
  AuditFilter,
  AuditIntegrity,
  AuditPage,
} from '../../core/models/audit/audit.model';
import { HttpAuditGateway } from '../../core/services/audit/http-audit.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';

@Component({
  selector: 'pdref-audit-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    StatePanelComponent,
    SidePanelComponent,
  ],
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
  readonly detail = signal<AuditEvent | null>(null);
  readonly chronology = signal<AuditEvent[] | null>(null);
  readonly integrity = signal<AuditIntegrity | null>(null);
  readonly notice = signal<string | null>(null);
  readonly exporting = signal(false);
  readonly canExport = computed(() => this.permissions.hasPermission('Audit_Export'));

  readonly filters = new FormGroup({
    dossierNumber: new FormControl('', { nonNullable: true }),
    eventCode: new FormControl('', { nonNullable: true }),
    userId: new FormControl('', { nonNullable: true }),
    result: new FormControl('', { nonNullable: true }),
    targetType: new FormControl('', { nonNullable: true }),
    targetId: new FormControl('', { nonNullable: true }),
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
    this.filters.reset({
      dossierNumber: '',
      eventCode: '',
      userId: '',
      result: '',
      targetType: '',
      targetId: '',
      requestId: '',
      from: '',
      to: '',
    });
    this.detail.set(null);
    this.chronology.set(null);
    this.integrity.set(null);
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

  closeDetail(): void {
    this.detail.set(null);
  }

  targetLabel(item: AuditEvent): string {
    if (item.targetDisplayName) {
      return item.targetDisplayName;
    }
    return item.targetId ? 'Element supprime' : '-';
  }

  openDetail(item: AuditEvent): void {
    this.gateway.detail(item.id).subscribe({
      next: (detail) => this.detail.set(detail),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  loadChronology(): void {
    const dossier = this.filters.controls.dossierNumber.value.trim();
    if (!dossier) {
      this.problem.set({
        type: 'about:blank',
        title: 'Dossier obligatoire',
        status: 400,
        detail: 'Saisissez un numero de dossier pour afficher sa chronologie.',
      } as ApiProblemDetails);
      return;
    }

    this.problem.set(null);
    this.gateway.chronology(dossier).subscribe({
      next: (items) => this.chronology.set(items),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  verifyIntegrity(): void {
    this.problem.set(null);
    this.integrity.set(null);
    this.gateway.integrity(this.filterValue()).subscribe({
      next: (result) => this.integrity.set(result),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  export(): void {
    if (!this.canExport() || this.exporting()) {
      return;
    }

    this.exporting.set(true);
    this.problem.set(null);
    this.notice.set(null);
    this.gateway.requestExport(this.filterValue()).subscribe({
      next: (item) => {
        this.notice.set('Export en preparation. Vous serez notifie lorsqu il sera pret.');
        this.pollExport(item.id);
      },
      error: (error: unknown) => {
        this.exporting.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  changes(item: AuditEvent): Array<{ key: string; value: string }> {
    return Object.entries(item.changes ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({ key, value }));
  }

  private pollExport(id: string, attempt = 0): void {
    this.gateway.getExport(id).subscribe({
      next: (item) => {
        if (item.status === 'PRET') {
          this.gateway.downloadExport(id).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = item.fileName ?? `audit.${item.format.toLowerCase()}`;
              anchor.click();
              URL.revokeObjectURL(url);
              this.exporting.set(false);
              this.notice.set('Export telecharge.');
            },
            error: (error: unknown) => {
              this.exporting.set(false);
              this.problem.set(normalizeProblem(error, this.correlation.last));
            },
          });
          return;
        }

        if (item.status === 'ECHEC') {
          this.exporting.set(false);
          this.problem.set({
            type: 'about:blank',
            title: 'Export echoue',
            status: 500,
            detail: item.errorMessage ?? 'La generation de l export a echoue.',
          } as ApiProblemDetails);
          return;
        }

        if (attempt >= 30) {
          this.exporting.set(false);
          this.notice.set('Export toujours en preparation. Consultez vos notifications.');
          return;
        }

        setTimeout(() => this.pollExport(id, attempt + 1), 2_000);
      },
      error: (error: unknown) => {
        this.exporting.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.detail.set(null);
    this.chronology.set(null);
    this.integrity.set(null);
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
      dossierNumber: value.dossierNumber || undefined,
      eventCode: value.eventCode || undefined,
      userId: value.userId || undefined,
      result: value.result || undefined,
      targetType: value.targetType || undefined,
      targetId: value.targetId || undefined,
      requestId: value.requestId || undefined,
      from: value.from ? `${value.from}T00:00:00.000Z` : undefined,
      to: value.to ? `${value.to}T23:59:59.999Z` : undefined,
    };
  }
}

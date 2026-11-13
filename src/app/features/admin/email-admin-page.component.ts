import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import type { EmailOutboxItem, EmailTestResult } from '../../core/models/admin/email-admin.model';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import { EmailAdminGateway } from '../../core/services/admin/email-admin.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-email-admin-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="E-mails transactionnels"
      subtitle="Suivi de l outbox, erreurs SMTP et renvoi des messages en echec."
    />

    @if (notice(); as message) {
      <p class="pd-alert pd-alert--success" role="status">{{ message }}</p>
    }
    @if (problem(); as issue) {
      <p class="pd-alert pd-alert--danger" role="alert">{{ issue.detail ?? issue.title }}</p>
    }

    @if (canManage()) {
      <section class="emails-test" aria-labelledby="emails-test-title">
        <h2 id="emails-test-title">Envoyer un e-mail de test</h2>
        <form [formGroup]="testForm" (ngSubmit)="sendTest()">
          <label class="pd-field">
            <span class="pd-label">Destinataire</span>
            <input class="pd-input" type="email" formControlName="to" autocomplete="email" />
          </label>
          <button class="pd-btn pd-btn--primary" type="submit" [disabled]="testLoading()">
            {{ testLoading() ? 'Envoi...' : 'Envoyer le test' }}
          </button>
        </form>
        @if (testResult(); as result) {
          <p
            class="pd-alert"
            [class.pd-alert--success]="result.success"
            [class.pd-alert--danger]="!result.success"
            role="status"
          >
            {{ result.message }}
          </p>
        }
      </section>
    }

    <section class="emails-filters" aria-label="Filtres e-mails">
      <form [formGroup]="filters" (ngSubmit)="load(1)">
        <label class="pd-field">
          <span class="pd-label">Statut</span>
          <select class="pd-input" formControlName="status">
            <option value="">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="ENVOYEE">Envoyee</option>
            <option value="ECHEC">Echec</option>
            <option value="ECHEC_FINAL">Echec final</option>
          </select>
        </label>
        <div class="emails-filters__actions">
          <button class="pd-btn pd-btn--primary" type="submit">Filtrer</button>
          <button class="pd-btn pd-btn--ghost" type="button" (click)="reset()">
            Reinitialiser
          </button>
        </div>
      </form>
    </section>

    @if (loading()) {
      <p class="pd-muted" role="status">Chargement des e-mails...</p>
    } @else if (items().length === 0) {
      <p class="pd-muted">Aucun e-mail ne correspond au filtre.</p>
    } @else {
      <div class="emails-table-wrap">
        <table class="emails-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Evenement</th>
              <th scope="col">Destinataire</th>
              <th scope="col">Statut</th>
              <th scope="col">Erreur</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <strong>{{ item.eventType }}</strong>
                  @if (item.aggregateId) {
                    <span class="pd-muted"> - {{ item.aggregateId }}</span>
                  }
                </td>
                <td>{{ item.recipientMasked ?? 'Non renseigne' }}</td>
                <td>
                  <span
                    class="email-status"
                    [class.email-status--failed]="
                      item.status === 'ECHEC' || item.status === 'ECHEC_FINAL'
                    "
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                  <span class="pd-muted">{{ item.attempts }} tentative(s)</span>
                </td>
                <td>
                  @if (item.emailErrorCode || item.lastErrorCode) {
                    <code>{{ item.emailErrorCode ?? item.lastErrorCode }}</code>
                  } @else {
                    <span class="pd-muted">Aucune</span>
                  }
                </td>
                <td>
                  @if (canManage() && item.canRetry) {
                    <button
                      class="pd-btn pd-btn--ghost"
                      type="button"
                      (click)="retry(item)"
                      [disabled]="retrying() === item.id"
                    >
                      {{ retrying() === item.id ? 'Renvoi...' : 'Renvoyer' }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <nav class="emails-pagination" aria-label="Pagination des e-mails">
        <button
          class="pd-btn pd-btn--ghost"
          type="button"
          [disabled]="page() <= 1"
          (click)="load(page() - 1)"
        >
          Precedent
        </button>
        <span class="pd-muted">Page {{ page() }} - {{ total() }} e-mail(s)</span>
        <button
          class="pd-btn pd-btn--ghost"
          type="button"
          [disabled]="page() * pageSize >= total()"
          (click)="load(page() + 1)"
        >
          Suivant
        </button>
      </nav>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .emails-test,
      .emails-filters {
        margin-bottom: 1rem;
        padding: 1rem;
        border: 1px solid var(--pd-border);
        border-radius: 0.75rem;
        background: var(--pd-surface);
      }

      .emails-test form,
      .emails-filters form {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: end;
      }

      .emails-table-wrap {
        overflow-x: auto;
      }

      .emails-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }

      .emails-table th,
      .emails-table td {
        padding: 0.65rem;
        text-align: left;
        border-bottom: 1px solid var(--pd-border);
        vertical-align: top;
      }

      .email-status {
        display: block;
        font-weight: 600;
      }

      .email-status--failed {
        color: var(--pd-danger);
      }

      .emails-pagination {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
      }
    `,
  ],
})
export class EmailAdminPageComponent {
  private readonly gateway = inject(EmailAdminGateway);
  private readonly correlation = inject(CorrelationService);
  private readonly permissions = inject(PermissionsService);

  readonly items = signal<EmailOutboxItem[]>([]);
  readonly loading = signal(false);
  readonly retrying = signal<string | null>(null);
  readonly testLoading = signal(false);
  readonly testResult = signal<EmailTestResult | null>(null);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly pageSize = 25;
  readonly canManage = computed(() => this.permissions.hasPermission('Parametres_Manage'));

  readonly filters = new FormGroup({
    status: new FormControl('', { nonNullable: true }),
  });

  readonly testForm = new FormGroup({
    to: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor() {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.problem.set(null);
    this.notice.set(null);
    this.page.set(page);
    this.gateway.list(this.filters.controls.status.value || null, page, this.pageSize).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.total.set(result.totalCount);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  reset(): void {
    this.filters.reset({ status: '' });
    this.load(1);
  }

  retry(item: EmailOutboxItem): void {
    this.retrying.set(item.id);
    this.problem.set(null);
    this.notice.set(null);
    this.gateway.retry(item.id).subscribe({
      next: () => {
        this.retrying.set(null);
        this.notice.set('E-mail remis en file d attente.');
        this.load(this.page());
      },
      error: (error: unknown) => {
        this.retrying.set(null);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  sendTest(): void {
    this.testForm.markAllAsTouched();
    if (this.testForm.invalid || this.testLoading()) {
      return;
    }

    this.testLoading.set(true);
    this.testResult.set(null);
    this.problem.set(null);
    this.gateway.sendTest(this.testForm.controls.to.value).subscribe({
      next: (result) => {
        this.testLoading.set(false);
        this.testResult.set(result);
        this.load(1);
      },
      error: (error: unknown) => {
        this.testLoading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'ENVOYEE':
        return 'Envoyee';
      case 'ECHEC':
        return 'Echec';
      case 'ECHEC_FINAL':
        return 'Echec final';
      default:
        return status;
    }
  }
}

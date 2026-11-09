import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  ImportError,
  ImportErrorPage,
  ImportJobDetail,
} from '../../core/models/imports/import.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { ImportGateway, type DownloadFile } from '../../core/services/imports/import.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { importStatutLabel } from './import-status';

const LIGHTHOUSE_DETAIL: ImportJobDetail = {
  id: 'lh-import-1',
  fileName: 'demandes-novembre.xlsx',
  fileSha256: 'demo',
  templateVersion: 1,
  statut: 'TERMINE',
  totalLignes: 20,
  importees: 19,
  rejetees: 1,
  dejaImportees: 0,
  erreurs: 1,
  nextLigne: 21,
  dateCreation: '2026-11-05T00:00:00Z',
  startedAt: '2026-11-05T00:00:05Z',
  completedAt: '2026-11-05T00:00:20Z',
  lastErrorCode: null,
};

const LIGHTHOUSE_ERRORS: ImportError[] = [
  {
    id: 'lh-error-1',
    ligne: 11,
    colonne: 'dateDepot',
    motif: 'DATE_INVALIDE',
    valeurBrute: '11/25/2026',
  },
];

@Component({
  selector: 'pdref-import-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="'Import - ' + (item()?.fileName || '')"
      subtitle="Suivi du traitement et erreurs par ligne."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de l'import" />
    } @else if (item(); as detail) {
      <div class="actions">
        <button type="button" class="pd-btn pd-btn--primary" (click)="downloadReport('csv')">
          Rapport CSV
        </button>
        <button type="button" class="pd-btn pd-btn--ghost" (click)="downloadReport('xlsx')">
          Rapport Excel
        </button>
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/imports">Retour aux imports</a>
      </div>

      <section class="pd-card summary">
        <div>
          <span class="pd-label">Fichier</span><strong>{{ detail.fileName }}</strong>
        </div>
        <div>
          <span class="pd-label">Version template</span
          ><strong>{{ detail.templateVersion }}</strong>
        </div>
        <div>
          <span class="pd-label">Statut</span><strong>{{ statutLabel(detail.statut) }}</strong>
        </div>
        <div>
          <span class="pd-label">Lignes</span><strong>{{ detail.totalLignes }}</strong>
        </div>
        <div>
          <span class="pd-label">Importees</span><strong>{{ detail.importees }}</strong>
        </div>
        <div>
          <span class="pd-label">Rejetees</span><strong>{{ detail.rejetees }}</strong>
        </div>
        <div>
          <span class="pd-label">Deja importees</span><strong>{{ detail.dejaImportees }}</strong>
        </div>
        <div>
          <span class="pd-label">Erreurs</span><strong>{{ detail.erreurs }}</strong>
        </div>
        <div>
          <span class="pd-label">Date</span><strong>{{ detail.dateCreation | abidjanDate }}</strong>
        </div>
        <div>
          <span class="pd-label">Termine le</span
          ><strong>{{ detail.completedAt | abidjanDate }}</strong>
        </div>
      </section>

      <section class="pd-card">
        <div class="head">
          <h2>Erreurs par ligne</h2>
          <span class="pd-muted">{{ errors().totalCount }} erreur(s)</span>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); loadErrors()">
          <label class="pd-field">
            <span class="pd-label">Colonne</span>
            <input
              class="pd-input"
              name="colonne"
              [value]="filters.colonne"
              (input)="onColonne($event)"
              placeholder="Ex. dateDepot"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Motif</span>
            <input
              class="pd-input"
              name="motif"
              [value]="filters.motif"
              (input)="onMotif($event)"
              placeholder="Ex. DATE_INVALIDE"
            />
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (errors().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune erreur"
            message="Toutes les lignes ont ete traitees."
          />
        } @else {
          <div class="table-wrap" tabindex="0" role="region" aria-label="Erreurs de l'import">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Colonne</th>
                  <th>Motif</th>
                  <th>Valeur masquee</th>
                </tr>
              </thead>
              <tbody>
                @for (error of errors().items; track error.id) {
                  <tr>
                    <td>{{ error.ligne }}</td>
                    <td>{{ error.colonne }}</td>
                    <td>{{ error.motif }}</td>
                    <td>{{ error.valeurBrute || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      .actions,
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .actions {
        margin-bottom: 1rem;
      }
      .summary > div {
        display: grid;
        min-width: 11rem;
      }
      .head,
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
        justify-content: space-between;
      }
      .filters {
        justify-content: start;
        margin: 1rem 0;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class ImportDetailPageComponent {
  private readonly gateway = inject(ImportGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly importId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<ImportJobDetail | null>(null);
  readonly errors = signal<ImportErrorPage>({
    items: [],
    page: 1,
    pageSize: 50,
    totalCount: 0,
  });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly filters = { colonne: '', motif: '' };

  constructor() {
    if (isLighthouseEnabled()) {
      this.item.set(LIGHTHOUSE_DETAIL);
      this.errors.set({
        items: LIGHTHOUSE_ERRORS,
        page: 1,
        pageSize: 50,
        totalCount: LIGHTHOUSE_ERRORS.length,
      });
      this.loading.set(false);
      return;
    }

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.importId).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        this.loadErrors();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  loadErrors(): void {
    this.gateway.errors(this.importId, this.filters).subscribe({
      next: (errors) => this.errors.set(errors),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  onColonne(event: Event): void {
    this.filters.colonne = (event.target as HTMLInputElement).value;
  }

  onMotif(event: Event): void {
    this.filters.motif = (event.target as HTMLInputElement).value;
  }

  downloadReport(format: 'csv' | 'xlsx'): void {
    this.download(this.gateway.downloadReport(this.importId, format));
  }

  statutLabel(statut: string): string {
    return importStatutLabel(statut);
  }

  private download(source: Observable<DownloadFile>): void {
    source.subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }
}

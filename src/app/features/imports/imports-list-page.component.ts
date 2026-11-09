import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { ImportJob, ImportPage } from '../../core/models/imports/import.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { UploadFieldComponent } from '../../core/components/upload-field/upload-field.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { ImportGateway, type DownloadFile } from '../../core/services/imports/import.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { IMPORT_STATUTS, importStatutLabel } from './import-status';

const LIGHTHOUSE_ITEMS: ImportJob[] = [
  {
    id: 'lh-import-1',
    fileName: 'demandes-novembre.xlsx',
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
  },
  {
    id: 'lh-import-2',
    fileName: 'demandes-octobre.xlsx',
    templateVersion: 1,
    statut: 'EN_COURS',
    totalLignes: 8,
    importees: 5,
    rejetees: 0,
    dejaImportees: 0,
    erreurs: 0,
    nextLigne: 7,
    dateCreation: '2026-11-04T00:00:00Z',
    startedAt: '2026-11-04T00:00:05Z',
    completedAt: null,
    lastErrorCode: null,
  },
];

@Component({
  selector: 'pdref-imports-list-page',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    UploadFieldComponent,
    AbidjanDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Imports"
      subtitle="Import Excel de masse, suivi des traitements et rapports."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="pd-card upload">
        <div class="head">
          <div>
            <h2>Nouvel import</h2>
            <p class="pd-muted">
              Template v1, une ligne invalide n'empeche pas le traitement des autres.
            </p>
          </div>
          <button type="button" class="pd-btn pd-btn--ghost" (click)="downloadTemplate()">
            Telecharger le template
          </button>
        </div>
        @if (canExecute()) {
          <pdref-upload-field
            label="Fichier Excel"
            hint="Format .xlsx, 10 Mo maximum"
            accept=".xlsx"
            [multiple]="false"
            [maxFiles]="1"
            [maxSizeBytes]="10485760"
            [disabled]="uploading()"
            (filesSelected)="onFiles($event)"
          />
          @if (uploading()) {
            <p class="pd-muted" role="status">Import en cours de creation...</p>
          }
        } @else {
          <p class="pd-muted">Vous avez uniquement un acces en lecture aux imports.</p>
        }
      </section>

      <section class="pd-card">
        <div class="head">
          <h2>Historique des imports</h2>
          <span class="pd-muted">{{ page().totalCount }} import(s)</span>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); load()">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              name="search"
              [value]="filters.search"
              (input)="onSearch($event)"
              placeholder="Nom du fichier"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Statut</span>
            <select
              class="pd-input"
              name="statut"
              [value]="filters.statut"
              (change)="onStatut($event)"
            >
              <option value="">Tous</option>
              @for (statut of statuts; track statut.value) {
                <option [value]="statut.value">{{ statut.label }}</option>
              }
            </select>
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des imports" />
        } @else if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun import"
            message="Aucun fichier ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap" tabindex="0" role="region" aria-label="Liste des imports">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Statut</th>
                  <th>Lignes</th>
                  <th>Importees</th>
                  <th>Rejetees</th>
                  <th>Erreurs</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/imports', item.id]">
                        {{ item.fileName }}
                      </a>
                    </td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
                    </td>
                    <td>{{ item.totalLignes }}</td>
                    <td>{{ item.importees }}</td>
                    <td>{{ item.rejetees }}</td>
                    <td>{{ item.erreurs }}</td>
                    <td>{{ item.dateCreation | abidjanDate }}</td>
                    <td class="actions">
                      <button
                        type="button"
                        class="pd-btn pd-btn--ghost pd-btn--sm"
                        (click)="downloadReport(item)"
                      >
                        Rapport
                      </button>
                    </td>
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
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ImportsListPageComponent {
  private readonly gateway = inject(ImportGateway);
  private readonly permissions = inject(PermissionsService);

  readonly statuts = IMPORT_STATUTS;
  readonly page = signal<ImportPage>({ items: [], page: 1, pageSize: 20, totalCount: 0 });
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly filters = { search: '', statut: '' };

  constructor() {
    if (isLighthouseEnabled()) {
      this.page.set({
        items: LIGHTHOUSE_ITEMS,
        page: 1,
        pageSize: 20,
        totalCount: LIGHTHOUSE_ITEMS.length,
      });
      this.loading.set(false);
      return;
    }

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list(this.filters).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  onSearch(event: Event): void {
    this.filters.search = (event.target as HTMLInputElement).value;
  }

  onStatut(event: Event): void {
    this.filters.statut = (event.target as HTMLSelectElement).value;
  }

  onFiles(files: readonly File[]): void {
    const file = files[0];
    if (!file || this.uploading() || !this.canExecute()) {
      return;
    }

    this.uploading.set(true);
    this.problem.set(null);
    this.gateway.upload(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  canExecute(): boolean {
    return this.permissions.hasPermission('Imports_Execute');
  }

  downloadTemplate(): void {
    this.download(this.gateway.downloadTemplate());
  }

  downloadReport(item: ImportJob): void {
    this.download(this.gateway.downloadReport(item.id));
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

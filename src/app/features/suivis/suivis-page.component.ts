import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { SuiviPage, SuiviQuery } from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { IconComponent } from '../../core/components/icon/icon.component';
import { RowActionsComponent } from '../../core/components/row-actions/row-actions.component';
import { etapeLabel } from '../../core/utils/labels';

const LIGHTHOUSE_PAGE: SuiviPage = {
  items: [
    {
      id: 'lh-suivi-1',
      demandeId: 'lh-demande-1',
      numero: '2026-0001',
      cycle: 1,
      contribuable: { ncc: '1234567A', raisonSociale: 'Client demonstration' },
      statut: 'AVIS_EN_COURS',
      avisRecus: 1,
      avisTotal: 3,
      avisFavorables: 1,
      avisNonFavorables: 0,
      transmissionsCount: 1,
      etapeCourante: 'AVIS_DERAR',
      demandeStatut: 'EN_CIRCUIT',
      dateDepot: '2026-11-05T00:00:00Z',
      dateOuverture: '2026-11-05T00:00:00Z',
      dateCloture: null,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

@Component({
  selector: 'pdref-suivis-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    IconComponent,
    RowActionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Suivis"
      subtitle="Avis des directions et validation globale des demandes."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="pd-card">
        <div class="head">
          <div>
            <h2>Dossiers en suivi</h2>
            <p class="pd-muted">{{ page().totalCount }} dossier(s)</p>
          </div>
          @if (canExport()) {
            <button type="button" class="pd-btn pd-btn--ghost" (click)="exportBase()">
              Exporter la base-demandes
            </button>
          }
        </div>

        <form class="filters" (ngSubmit)="load(1)">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              [(ngModel)]="filters.search"
              name="search"
              placeholder="Numéro, NCC ou raison sociale"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Statut</span>
            <select class="pd-input" [(ngModel)]="filters.statut" name="statut">
              <option value="">Tous</option>
              <option value="AVIS_EN_COURS">Avis en cours</option>
              <option value="AVIS_COMPLET">Avis complet</option>
              <option value="VALIDATION_EN_ATTENTE">Validation en attente</option>
              <option value="VALIDATION_POSEE">Validation posee</option>
              <option value="CLOTURE">Clôture</option>
            </select>
          </label>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="reset()">
              Réinitialiser
            </button>
          </div>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des suivis" />
        } @else if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun suivi"
            message="Aucun dossier ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Contribuable</th>
                  <th>Avis</th>
                  <th>Statut</th>
                  <th>Étape</th>
                  <th>Ouverture</th>
                  <th class="pd-col-actions"><span class="pd-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/suivis', item.demandeId]">
                        {{ item.numero }}
                      </a>
                    </td>
                    <td>
                      <strong>{{ item.contribuable.raisonSociale }}</strong>
                      <div class="pd-muted">{{ item.contribuable.ncc }}</div>
                    </td>
                    <td>{{ item.avisRecus }} / {{ item.avisTotal }}</td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
                    </td>
                    <td>{{ etapeLabel(item.etapeCourante) }}</td>
                    <td>{{ item.dateOuverture | abidjanDate }}</td>
                    <td class="pd-col-actions">
                      <pdref-row-actions [label]="'Actions pour le dossier ' + item.numero">
                        <a
                          class="pd-menu-item"
                          role="menuitem"
                          [routerLink]="['/dashboard/suivis', item.demandeId]"
                        >
                          <pdref-icon name="eye" size="sm" />Ouvrir le dossier
                        </a>
                        <button
                          type="button"
                          class="pd-menu-item"
                          role="menuitem"
                          (click)="exportPdf(item.demandeId)"
                        >
                          <pdref-icon name="download" size="sm" />Télécharger la fiche PDF
                        </button>
                      </pdref-row-actions>
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
      .filters .pd-field {
        min-width: 14rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
      .actions-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
    `,
  ],
})
export class SuivisPageComponent {
  readonly etapeLabel = etapeLabel;
  private readonly gateway = inject(SuivisGateway);
  private readonly permissions = inject(PermissionsService);

  readonly filters: SuiviQuery = { page: 1, pageSize: 20, search: '', statut: '' };
  readonly page = signal<SuiviPage>({ items: [], page: 1, pageSize: 20, totalCount: 0 });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);

  constructor() {
    if (isLighthouseEnabled()) {
      this.page.set(LIGHTHOUSE_PAGE);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  load(page = this.filters.page ?? 1): void {
    this.filters.page = page;
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list(this.filters).subscribe({
      next: (result) => {
        this.page.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  reset(): void {
    this.filters.search = '';
    this.filters.statut = '';
    this.load(1);
  }

  canExport(): boolean {
    return this.permissions.hasPermission('Suivis_Read');
  }

  exportPdf(demandeId: string): void {
    this.gateway.exportPdf(demandeId).subscribe({
      next: (result) => {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = result.fileName ?? 'suivi.pdf';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  exportBase(): void {
    this.gateway.exportBase(this.filters).subscribe({
      next: (result) => {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = result.fileName ?? 'base-demandes.xlsx';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  statutLabel(statut: string): string {
    return (
      {
        AVIS_EN_COURS: 'Avis en cours',
        AVIS_COMPLET: 'Avis complet',
        VALIDATION_EN_ATTENTE: 'Validation en attente',
        VALIDATION_POSEE: 'Validation posee',
        CLOTURE: 'Cloture',
      }[statut] ?? statut
    );
  }
}

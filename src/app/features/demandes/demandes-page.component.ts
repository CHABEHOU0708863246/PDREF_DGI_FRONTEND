import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  DemandePage,
  DemandeQuery,
  DemandeSummary,
} from '../../core/models/demandes/demande.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { DemandesGateway } from '../../core/services/demandes/demandes.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

const LIGHTHOUSE_DEMANDES: DemandeSummary[] = [
  {
    id: 'lh-demande-1',
    numero: '2026-0001',
    origine: 'AGENT',
    statut: 'EN_CIRCUIT',
    contribuable: {
      id: 'lh-contribuable-1',
      ncc: '1234567A',
      raisonSociale: 'Client demonstration',
      centreImpotId: 'GUDEF',
      centreImpotLibelle: 'GUDEF',
      directionRattachementId: 'DGE',
    },
    dateDepot: '2026-11-05T00:00:00Z',
    pdfManquant: false,
    exercicePrincipal: 2026,
    etapeCourante: 'CONFORMITE_AUTO',
    createdAt: '2026-11-05T00:00:00Z',
  },
];

@Component({
  selector: 'pdref-demandes-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Demandes"
      subtitle="Demandes de rectification déposées au titre de l'article 24."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="pd-card demandes-card">
        <div class="demandes-head">
          <div>
            <h2>Registre des demandes</h2>
            <p class="pd-muted">{{ page().totalCount }} demande(s)</p>
          </div>
          @if (canCreate()) {
            <a class="pd-btn pd-btn--primary" routerLink="/dashboard/demandes/nouvelle">
              Nouvelle demande
            </a>
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
              <option value="DEPOSEE">Déposée</option>
              <option value="EN_CIRCUIT">En circuit</option>
              <option value="REJETEE">Rejetée</option>
              <option value="CLOTUREE">Clôturée</option>
              <option value="ABANDONNEE">Abandonnée</option>
            </select>
          </label>
          <label class="pd-field">
            <span class="pd-label">Origine</span>
            <select class="pd-input" [(ngModel)]="filters.origine" name="origine">
              <option value="">Toutes</option>
              <option value="PORTAIL_EIMPOTS">Portail e-impôts</option>
              <option value="AGENT">Agent</option>
              <option value="IMPORT">Import</option>
              <option value="MIGRATION">Migration</option>
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
          <pdref-state-panel state="loading" title="Chargement des demandes" />
        } @else if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune demande"
            message="Aucune demande ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Contribuable</th>
                  <th>Exercice</th>
                  <th>Origine</th>
                  <th>Statut</th>
                  <th>Dépôt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/demandes', item.id]">
                        {{ item.numero || 'Brouillon' }}
                      </a>
                    </td>
                    <td>
                      <strong>{{ item.contribuable.raisonSociale }}</strong>
                      <div class="pd-muted">{{ item.contribuable.ncc }}</div>
                    </td>
                    <td>{{ item.exercicePrincipal || '-' }}</td>
                    <td>{{ origineLabel(item.origine) }}</td>
                    <td>
                      <span class="pd-chip" [class.pd-chip--danger]="item.statut === 'REJETEE'">{{
                        statutLabel(item.statut)
                      }}</span>
                      @if (item.pdfManquant) {
                        <span class="pd-chip pd-chip--danger">PDF a joindre</span>
                      }
                    </td>
                    <td>{{ item.dateDepot | abidjanDate }}</td>
                    <td>
                      <a
                        class="pd-btn pd-btn--ghost pd-btn--sm"
                        [routerLink]="['/dashboard/demandes', item.id]"
                        >Détail</a
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <nav class="pd-actions" aria-label="Pagination">
            <button
              type="button"
              class="pd-btn pd-btn--ghost pd-btn--sm"
              [disabled]="page().page <= 1"
              (click)="load(page().page - 1)"
            >
              Précédent
            </button>
            <span>Page {{ page().page }} / {{ pages() }}</span>
            <button
              type="button"
              class="pd-btn pd-btn--ghost pd-btn--sm"
              [disabled]="page().page >= pages()"
              (click)="load(page().page + 1)"
            >
              Suivant
            </button>
          </nav>
        }
      </section>
    }
  `,
  styleUrl: './demandes-page.component.scss',
})
export class DemandesPageComponent {
  private readonly gateway = inject(DemandesGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  readonly page = signal<DemandePage>({ items: [], page: 1, pageSize: 20, totalCount: 0 });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly filters: DemandeQuery = { page: 1, pageSize: 20 };

  constructor() {
    if (isLighthouseEnabled()) {
      this.page.set({ items: LIGHTHOUSE_DEMANDES, page: 1, pageSize: 20, totalCount: 1 });
      this.loading.set(false);
      return;
    }
    this.load();
  }

  canCreate(): boolean {
    return this.permissions.hasPermission('Demandes_Create');
  }

  load(page = this.page().page): void {
    this.loading.set(true);
    this.problem.set(null);
    this.filters.page = page;
    this.gateway.list(this.filters).subscribe({
      next: (result) => {
        this.page.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  reset(): void {
    this.filters.search = null;
    this.filters.statut = null;
    this.filters.origine = null;
    this.load(1);
  }

  pages(): number {
    return Math.max(1, Math.ceil(this.page().totalCount / this.page().pageSize));
  }

  statutLabel(value: string): string {
    return (
      {
        BROUILLON: 'Brouillon',
        DEPOSEE: 'Déposée',
        EN_CIRCUIT: 'En circuit',
        REJETEE: 'Rejetée',
        CLOTUREE: 'Clôturée',
        ABANDONNEE: 'Abandonnée',
      }[value] ?? value
    );
  }

  origineLabel(value: string): string {
    return (
      {
        PORTAIL_EIMPOTS: 'Portail e-impôts',
        AGENT: 'Agent',
        IMPORT: 'Import',
        MIGRATION: 'Migration',
      }[value] ?? value
    );
  }
}

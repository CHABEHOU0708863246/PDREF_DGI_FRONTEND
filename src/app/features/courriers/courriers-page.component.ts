import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  CourrierPage,
  CourrierQuery,
  CourrierSummary,
} from '../../core/models/courriers/courrier.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';

const LIGHTHOUSE_COURRIERS: CourrierSummary[] = [
  {
    id: 'lh-courrier-1',
    sens: 'ENTRANT',
    typeCourrier: 'COURRIER',
    numero: 'C-2026-000001',
    dateArrivee: '2026-11-05T00:00:00Z',
    dateEmission: null,
    references: 'REF-DEMO',
    expediteur: 'DGI',
    objet: 'Demande de renseignement',
    imputation: 'GUDEF',
    estLie: true,
    contribuable: {
      id: 'lh-contribuable-1',
      ncc: null,
      nccMasque: '123****7A',
      raisonSociale: 'Client demonstration',
    },
    createdAt: '2026-11-05T00:00:00Z',
  },
];
@Component({
  selector: 'pdref-courriers-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Courriers"
      subtitle="Registre des courriers entrants et sortants de la GUDEF."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="pd-card courriers-card">
        <div class="courriers-head">
          <h2>Registre</h2>
          @if (canCreate()) {
            <a class="pd-btn pd-btn--primary" routerLink="/dashboard/courriers/nouveau"
              >Nouveau courrier</a
            >
          }
        </div>

        <form class="filters" (ngSubmit)="load(1)">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              [(ngModel)]="filters.search"
              name="search"
              placeholder="Numero ou objet"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Type</span>
            <select class="pd-input" [(ngModel)]="filters.typeCourrier" name="typeCourrier">
              <option value="">Tous</option>
              <option value="COURRIER">Courrier</option>
              <option value="SIGICI">SIGICI</option>
              <option value="PORTAIL">Portail</option>
              <option value="REPONSE_DGI">Reponse DGI</option>
            </select>
          </label>
          <label class="pd-field">
            <span class="pd-label">Sens</span>
            <select class="pd-input" [(ngModel)]="filters.sens" name="sens">
              <option value="">Tous</option>
              <option value="ENTRANT">Entrant</option>
              <option value="SORTANT">Sortant</option>
            </select>
          </label>
          <label class="pd-field">
            <span class="pd-label">Expediteur</span>
            <input class="pd-input" [(ngModel)]="filters.expediteur" name="expediteur" />
          </label>
          <label class="pd-field">
            <span class="pd-label">Date du</span>
            <input class="pd-input" type="date" [(ngModel)]="filters.dateDu" name="dateDu" />
          </label>
          <label class="pd-field">
            <span class="pd-label">Date au</span>
            <input class="pd-input" type="date" [(ngModel)]="filters.dateAu" name="dateAu" />
          </label>
          <label class="pd-field">
            <span class="pd-label">Lien</span>
            <select class="pd-input" [(ngModel)]="filters.lie" name="lie">
              <option value="">Tous</option>
              <option value="true">Lie</option>
              <option value="false">Non lie</option>
            </select>
          </label>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="reset()">
              Reinitialiser
            </button>
          </div>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des courriers" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun courrier"
            message="Aucun courrier ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Type</th>
                  <th>Sens</th>
                  <th>Date</th>
                  <th>Expediteur</th>
                  <th>Objet</th>
                  <th>Contribuable</th>
                  <th>Lien</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/courriers', item.id]">{{
                        item.numero
                      }}</a>
                    </td>
                    <td>{{ typeLabel(item.typeCourrier) }}</td>
                    <td>{{ sensLabel(item.sens) }}</td>
                    <td>{{ item.dateArrivee || item.dateEmission | abidjanDate }}</td>
                    <td>{{ item.expediteur }}</td>
                    <td>{{ item.objet }}</td>
                    <td>{{ item.contribuable?.raisonSociale || '-' }}</td>
                    <td>{{ item.estLie ? 'Lie' : 'Non lie' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button
              type="button"
              class="pd-btn pd-btn--ghost"
              [disabled]="page() <= 1"
              (click)="load(page() - 1)"
            >
              Precedent
            </button>
            <span>Page {{ page() }} / {{ pages() }}</span>
            <button
              type="button"
              class="pd-btn pd-btn--ghost"
              [disabled]="page() >= pages()"
              (click)="load(page() + 1)"
            >
              Suivant
            </button>
            <span class="pd-muted">{{ total() }} courrier(s)</span>
          </div>
        }
      </section>
    }
  `,
  styleUrl: './courriers-page.component.scss',
})
export class CourriersPageComponent {
  private readonly gateway = inject(CourriersGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  readonly items = signal<CourrierSummary[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly pages = signal(1);
  readonly filters = {
    search: '',
    typeCourrier: '',
    sens: '',
    expediteur: '',
    dateDu: '',
    dateAu: '',
    lie: '',
  };

  constructor() {
    this.load();
  }

  canCreate(): boolean {
    return this.permissions.hasPermission('Courriers_Create');
  }

  load(page = this.page()): void {
    if (isLighthouseEnabled()) {
      this.items.set(LIGHTHOUSE_COURRIERS);
      this.page.set(1);
      this.total.set(LIGHTHOUSE_COURRIERS.length);
      this.pages.set(1);
      this.loading.set(false);
      this.problem.set(null);
      return;
    }

    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list(this.query(page)).subscribe({
      next: (result: CourrierPage) => {
        this.items.set(result.items);
        this.page.set(result.page);
        this.total.set(result.totalCount);
        this.pages.set(Math.max(1, Math.ceil(result.totalCount / result.pageSize)));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  reset(): void {
    this.filters.search = '';
    this.filters.typeCourrier = '';
    this.filters.sens = '';
    this.filters.expediteur = '';
    this.filters.dateDu = '';
    this.filters.dateAu = '';
    this.filters.lie = '';
    this.load(1);
  }

  typeLabel(type: string): string {
    return type === 'REPONSE_DGI' ? 'Reponse DGI' : type.charAt(0) + type.slice(1).toLowerCase();
  }

  sensLabel(sens: string): string {
    return sens === 'ENTRANT' ? 'Entrant' : 'Sortant';
  }

  private query(page: number): CourrierQuery {
    return {
      search: this.filters.search || null,
      typeCourrier: this.filters.typeCourrier
        ? (this.filters.typeCourrier as CourrierQuery['typeCourrier'])
        : null,
      sens: this.filters.sens ? (this.filters.sens as CourrierQuery['sens']) : null,
      expediteur: this.filters.expediteur || null,
      dateDu: this.filters.dateDu || null,
      dateAu: this.filters.dateAu || null,
      lie: this.filters.lie === '' ? null : this.filters.lie === 'true',
      page,
      pageSize: this.pageSize,
      sort: 'date',
      direction: 'desc',
    };
  }
}

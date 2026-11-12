import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import type {
  DashboardKpis,
  DashboardNominatifPage,
  DashboardQualite,
} from '../../../core/models/dashboard/dashboard.model';
import {
  BarChartComponent,
  type BarChartDatum,
} from '../../../core/components/bar-chart/bar-chart.component';
import { KpiCardComponent } from '../../../core/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../../core/components/state-panel/state-panel.component';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { DashboardGateway } from '../../../core/services/dashboard/dashboard.gateway';
import { isLighthouseEnabled } from '../../../core/utils/lighthouse';
import { normalizeProblem } from '../../../core/utils/problem';

const LIGHTHOUSE_KPIS: DashboardKpis = {
  courriersRecus: 42,
  rejetes: 3,
  totalDemandes: 18,
  enCours: 9,
  favorables: 6,
  nonFavorables: 3,
  enRetard: 2,
  dateCalcul: '2026-11-09T10:00:00Z',
};

const LIGHTHOUSE_QUALITE: DashboardQualite = {
  totalContribuables: 120,
  sansEmail: 12,
  sansTelephone: 18,
  sansCentre: 3,
  nccHorsFormat: 2,
  pourcentageSansEmail: 10,
  pourcentageSansTelephone: 15,
  pourcentageSansCentre: 2.5,
  pourcentageNccHorsFormat: 1.67,
};

const LIGHTHOUSE_NOMINATIF: DashboardNominatifPage = {
  items: [
    {
      demandeId: 'lh-demande-1',
      numeroDemande: '2026-0001',
      contribuable: 'Client demonstration',
      ncc: '1234567A',
      etat: 'EN_CIRCUIT',
      niveauTraitement: 'GUDEF',
      delaiGudefJo: 4,
      delaiDirectionsJo: 0,
      delaiCtfJo: 0,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
};

@Component({
  selector: 'pdref-dashboard-home',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    KpiCardComponent,
    BarChartComponent,
    StatePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Tableau de bord"
      subtitle="Pilotage des courriers, demandes, circuits et qualite des donnees."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="toolbar pd-card" aria-label="Filtres du tableau de bord">
        <label class="pd-field"
          ><span class="pd-label">Periode</span>
          <select class="pd-input" [value]="filters.periode" (change)="onPeriode($event)">
            @for (period of periods; track period.value) {
              <option [value]="period.value">{{ period.label }}</option>
            }
          </select>
        </label>
        <label class="pd-field"
          ><span class="pd-label">Statut</span>
          <select class="pd-input" [value]="filters.statut" (change)="onStatut($event)">
            <option value="">Tous</option>
            <option value="EN_CIRCUIT">En circuit</option>
            <option value="REJETEE">Rejetees</option>
            <option value="CLOTUREE">Cloturees</option>
          </select>
        </label>
        <button type="button" class="pd-btn pd-btn--primary" (click)="load()">Actualiser</button>
        <span class="pd-muted">{{ kpis()?.dateCalcul || '' }}</span>
        @if (canImputation()) {
          <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/imputations">Imputation GUDEF</a>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/pilotage/charge"
          >Charge de travail</a
        >
      </section>

      <section class="kpis" aria-label="Indicateurs cles">
        <pdref-kpi-card
          label="Courriers recus"
          [value]="kpis()?.courriersRecus ?? null"
          icon="file"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Rejetes"
          [value]="kpis()?.rejetes ?? null"
          icon="alert-triangle"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Total demandes"
          [value]="kpis()?.totalDemandes ?? null"
          icon="clipboard"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="En cours"
          [value]="kpis()?.enCours ?? null"
          icon="layout"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Favorables"
          [value]="kpis()?.favorables ?? null"
          icon="check"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Non favorables"
          [value]="kpis()?.nonFavorables ?? null"
          icon="alert-triangle"
          [state]="kpiState()"
        />
        <a
          class="kpi-link"
          [routerLink]="['/dashboard/pilotage/dossiers']"
          [queryParams]="{
            source: 'DASHBOARD',
            metric: 'EN_RETARD',
            periode: filters.periode,
            statut: filters.statut || null,
          }"
        >
          <pdref-kpi-card
            label="En retard"
            [value]="kpis()?.enRetard ?? null"
            icon="clock"
            [state]="kpiState()"
          />
        </a>
      </section>

      <section class="pd-card">
        <h2>Demandes par statut</h2>
        <pdref-bar-chart
          title="Demandes par statut"
          unit="demandes"
          [series]="chartData()"
          (barClick)="openMetric($event)"
        />
      </section>

      <section class="pd-card">
        <h2>Qualite des donnees</h2>
        @if (qualite(); as quality) {
          <div class="quality">
            <span
              >Sans e-mail <strong>{{ quality.pourcentageSansEmail }} %</strong></span
            >
            <span
              >Sans telephone <strong>{{ quality.pourcentageSansTelephone }} %</strong></span
            >
            <span
              >Sans centre <strong>{{ quality.pourcentageSansCentre }} %</strong></span
            >
            <span
              >NCC hors format <strong>{{ quality.pourcentageNccHorsFormat }} %</strong></span
            >
          </div>
        } @else {
          <p class="pd-muted">Qualite indisponible.</p>
        }
      </section>

      @if (canNominatif()) {
        <section class="pd-card">
          <div class="tabs" role="tablist" aria-label="Vues du tableau de bord">
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="tab() === 'synthese'"
              (click)="setTab('synthese')"
            >
              Synthese
            </button>
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="tab() === 'nominatif'"
              (click)="setTab('nominatif')"
            >
              Tableau nominatif
            </button>
          </div>
          @if (tab() === 'nominatif') {
            @if (nominatif().items.length === 0) {
              <pdref-state-panel
                state="empty"
                title="Aucune demande"
                message="Aucune demande ne correspond aux filtres."
              />
            } @else {
              <div class="table-wrap" tabindex="0" role="region" aria-label="Tableau nominatif">
                <table class="pd-table">
                  <thead>
                    <tr>
                      <th>Demande</th>
                      <th>Contribuable</th>
                      <th>NCC</th>
                      <th>Etat</th>
                      <th>Niveau</th>
                      <th>Delai GUDEF</th>
                      <th>Delai directions</th>
                      <th>Delai CTF</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of nominatif().items; track item.demandeId) {
                      <tr>
                        <td>{{ item.numeroDemande }}</td>
                        <td>{{ item.contribuable }}</td>
                        <td>{{ item.ncc }}</td>
                        <td>{{ item.etat }}</td>
                        <td>{{ item.niveauTraitement }}</td>
                        <td>{{ item.delaiGudefJo }} JO</td>
                        <td>{{ item.delaiDirectionsJo }} JO</td>
                        <td>{{ item.delaiCtfJo }} JO</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </section>
      }
    }
  `,
  styles: [
    `
      .toolbar,
      .quality,
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
      }
      .toolbar {
        margin-bottom: 1rem;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .quality {
        align-items: center;
      }
      .quality strong {
        display: block;
      }
      .tabs {
        margin-bottom: 1rem;
      }
      .tabs button {
        border: 0;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
        padding: 0.5rem;
      }
      .tabs button[aria-selected='true'] {
        border-bottom: 2px solid var(--color-primary);
        color: var(--color-primary);
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class DashboardHomeComponent implements OnDestroy {
  private readonly gateway = inject(DashboardGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly router = inject(Router);
  private readonly timer: ReturnType<typeof setInterval> | null;

  readonly periods = [
    { value: '7j', label: '7 jours' },
    { value: '30j', label: '30 jours' },
    { value: '3m', label: '3 mois' },
    { value: '6m', label: '6 mois' },
    { value: 'annee', label: 'Annee' },
    { value: 'tout', label: 'Tout' },
  ];
  readonly filters = { periode: '30j', statut: '' };
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly qualite = signal<DashboardQualite | null>(null);
  readonly nominatif = signal<DashboardNominatifPage>({
    items: [],
    page: 1,
    pageSize: 25,
    totalCount: 0,
  });
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly tab = signal<'synthese' | 'nominatif'>('synthese');
  readonly kpiState = computed(() => (this.kpis() ? ('success' as const) : ('empty' as const)));
  readonly chartData = computed<BarChartDatum[]>(() => {
    const kpis = this.kpis();
    return kpis
      ? [
          { label: 'En cours', value: kpis.enCours },
          { label: 'Favorables', value: kpis.favorables },
          { label: 'Non favorables', value: kpis.nonFavorables },
          { label: 'Rejetes', value: kpis.rejetes },
        ]
      : [];
  });
  readonly canNominatif = () => this.permissions.hasPermission('Dashboard_ReadDg');
  readonly canImputation = () => this.permissions.hasPermission('Suivis_Read');

  constructor() {
    if (isLighthouseEnabled()) {
      this.kpis.set(LIGHTHOUSE_KPIS);
      this.qualite.set(LIGHTHOUSE_QUALITE);
      this.nominatif.set(LIGHTHOUSE_NOMINATIF);
      this.timer = null;
      return;
    }
    this.load();
    this.timer = setInterval(() => this.load(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  load(): void {
    this.problem.set(null);
    this.gateway.kpis(this.filters).subscribe({
      next: (kpis) => this.kpis.set(kpis),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
    this.gateway.qualite().subscribe({
      next: (quality) => this.qualite.set(quality),
      error: () => this.qualite.set(null),
    });
  }

  loadNominatif(): void {
    this.gateway.nominatif(this.filters).subscribe({
      next: (page) => this.nominatif.set(page),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  openMetric(label: string): void {
    const map: Record<string, string> = {
      'En cours': 'EN_COURS',
      Favorables: 'FAVORABLES',
      'Non favorables': 'NON_FAVORABLES',
      Rejetes: 'REJETES',
    };
    void this.router.navigate(['/dashboard/pilotage/dossiers'], {
      queryParams: {
        source: 'DASHBOARD',
        metric: map[label] ?? 'TOTAL',
        periode: this.filters.periode,
        statut: this.filters.statut || null,
      },
    });
  }

  onPeriode(event: Event): void {
    this.filters.periode = (event.target as HTMLSelectElement).value;
    this.load();
  }
  onStatut(event: Event): void {
    this.filters.statut = (event.target as HTMLSelectElement).value;
    this.load();
  }
  setTab(tab: 'synthese' | 'nominatif'): void {
    this.tab.set(tab);
    if (tab === 'nominatif') {
      this.loadNominatif();
    }
  }
}

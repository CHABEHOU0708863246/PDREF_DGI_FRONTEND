import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import type {
  DashboardAnalytique,
  DashboardKpis,
  DashboardNominatifPage,
  DashboardQualite,
} from '../../../core/models/dashboard/dashboard.model';
import type { BarChartDatum } from '../../../core/components/bar-chart/bar-chart.component';
import type { ComparisonDatum } from '../../../core/components/comparison-bar-chart/comparison-bar-chart.component';
import { ComparisonBarChartComponent } from '../../../core/components/comparison-bar-chart/comparison-bar-chart.component';
import type { DonutDatum } from '../../../core/components/donut-chart/donut-chart.component';
import { DonutChartComponent } from '../../../core/components/donut-chart/donut-chart.component';
import type { LineDatum } from '../../../core/components/line-chart/line-chart.component';
import { LineChartComponent } from '../../../core/components/line-chart/line-chart.component';
import { KpiCardComponent } from '../../../core/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';
import { LiveClockComponent } from '../../../core/components/live-clock/live-clock.component';
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

const LIGHTHOUSE_ANALYTIQUE: DashboardAnalytique = {
  tauxTraitement: 50,
  dureeMoyenneJours: 42,
  total: 18,
  enCours: 9,
  enRetard: 2,
  repartition: [
    { code: 'EN_COURS', libelle: 'En cours', valeur: 9 },
    { code: 'FAVORABLE', libelle: 'Favorables', valeur: 6 },
    { code: 'NON_FAVORABLE', libelle: 'Non favorables', valeur: 3 },
    { code: 'REJETE', libelle: 'Rejetés', valeur: 0 },
  ],
  evolution: [
    { periode: '2026-06', libelle: 'Juin', total: 2, favorables: 1, nonFavorables: 0 },
    { periode: '2026-07', libelle: 'Juil.', total: 4, favorables: 2, nonFavorables: 1 },
    { periode: '2026-08', libelle: 'Aout', total: 3, favorables: 1, nonFavorables: 0 },
    { periode: '2026-09', libelle: 'Sept.', total: 5, favorables: 3, nonFavorables: 1 },
    { periode: '2026-10', libelle: 'Oct.', total: 2, favorables: 1, nonFavorables: 0 },
    { periode: '2026-11', libelle: 'Nov.', total: 2, favorables: 0, nonFavorables: 1 },
  ],
  directions: [
    { directionCode: 'DERAR', libelle: 'DERAR', total: 12, enCours: 3, tauxTraitement: 75 },
    { directionCode: 'DVFN', libelle: 'DVFN', total: 12, enCours: 4, tauxTraitement: 66.7 },
    { directionCode: 'DME', libelle: 'DME', total: 12, enCours: 2, tauxTraitement: 83.3 },
  ],
  demandesRecentes: [
    {
      demandeId: 'lh-demande-1',
      numero: '2026-0024',
      contribuable: 'Client demonstration',
      statut: 'EN_COURS',
      dateDepot: '2026-11-08T00:00:00Z',
    },
  ],
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
    LiveClockComponent,
    KpiCardComponent,
    DonutChartComponent,
    LineChartComponent,
    ComparisonBarChartComponent,
    StatePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Tableau de bord"
      subtitle="Pilotage des courriers, demandes, circuits et qualité des données."
    >
      <pdref-live-clock [lastRefreshAt]="lastRefreshAt()" />
    </pdref-page-header>

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="toolbar pd-card" aria-label="Filtres du tableau de bord">
        <label class="pd-field"
          ><span class="pd-label">Période</span>
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
        @if (canImputation()) {
          <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/imputations">Imputation GUDEF</a>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/pilotage/charge"
          >Charge de travail</a
        >
      </section>

      <section class="kpis" aria-label="Indicateurs clés">
        <pdref-kpi-card
          label="Courriers reçus"
          [value]="kpis()?.courriersRecus ?? null"
          icon="inbox"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Rejetés"
          [value]="kpis()?.rejetes ?? null"
          icon="x-circle"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Total demandes"
          [value]="kpis()?.totalDemandes ?? null"
          icon="file-text"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="En cours"
          [value]="kpis()?.enCours ?? null"
          icon="activity"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Favorables"
          [value]="kpis()?.favorables ?? null"
          icon="check-circle"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Non favorables"
          [value]="kpis()?.nonFavorables ?? null"
          icon="alert-circle"
          [state]="kpiState()"
        />
        <pdref-kpi-card
          label="Taux de traitement"
          [value]="formatRate(analytique()?.tauxTraitement ?? null)"
          icon="bar-chart"
          [state]="analytiqueState()"
        />
        <pdref-kpi-card
          label="Durée moyenne"
          [value]="analytique()?.dureeMoyenneJours ?? null"
          unit="j"
          icon="clock"
          [state]="analytiqueState()"
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
            icon="alert-triangle"
            [state]="kpiState()"
          />
        </a>
      </section>

      <div class="analytics" aria-label="Graphiques du tableau de bord">
        <section class="pd-card">
          <h2>Répartition des demandes</h2>
          <pdref-donut-chart
            [series]="repartitionData()"
            title="Répartition des demandes"
            unit="demandes"
          />
          <p class="pd-muted">Toutes les demandes de la période, y compris les rejets.</p>
        </section>

        <section class="pd-card gauge-card">
          <h2>Taux de traitement global</h2>
          <div class="gauge" [style.background]="gaugeBackground()">
            <span>{{ formatRate(analytique()?.tauxTraitement ?? null) }}</span>
          </div>
          <p class="pd-muted">Objectif : 100%</p>
        </section>

        <section class="pd-card wide">
          <div class="head">
            <h2>Évolution des demandes</h2>
            <span class="pd-muted">6 derniers mois</span>
          </div>
          <pdref-line-chart [series]="evolutionData()" title="Évolution des demandes" />
        </section>

        <section class="pd-card wide">
          <div class="head">
            <h2>Demandes par direction</h2>
            <span class="pd-muted">Avis : total vs en attente</span>
          </div>
          <pdref-comparison-bar-chart
            [series]="directionBars()"
            title="Demandes par direction"
            currentLabel="Total"
            previousLabel="En attente"
          />
        </section>

        <section class="pd-card">
          <h2>Taux de traitement par direction</h2>
          <div class="rates">
            @for (item of directions(); track item.directionCode) {
              <div class="rate">
                <span class="rate__label">{{ item.libelle }}</span>
                <div class="rate__bar">
                  <span [style.inline-size.%]="clamp(item.tauxTraitement)"></span>
                </div>
                <strong>{{ formatRate(item.tauxTraitement) }}</strong>
              </div>
            } @empty {
              <p class="pd-muted">Aucun avis enregistre.</p>
            }
          </div>
          <p class="pd-muted">Objectif : 100%</p>
        </section>

        <section class="pd-card">
          <div class="head">
            <h2>Demandes recentes</h2>
            <a class="pd-link" routerLink="/dashboard/demandes">Voir tous</a>
          </div>
          @if (recentes().length === 0) {
            <p class="pd-muted">Aucune demande recente.</p>
          } @else {
            <ul class="recent">
              @for (item of recentes(); track item.demandeId) {
                <li>
                  <a class="recent__main" [routerLink]="['/dashboard/demandes', item.demandeId]">
                    <strong>{{ item.numero }}</strong>
                    <span>{{ item.contribuable }}</span>
                  </a>
                  <span class="status" [class]="'status status--' + item.statut.toLowerCase()">
                    {{ statutLabel(item.statut) }}
                  </span>
                </li>
              }
            </ul>
          }
        </section>
      </div>

      <section class="pd-card">
        <h2>Qualité des données</h2>
        @if (qualite(); as quality) {
          <div class="quality">
            <span
              >Sans e-mail <strong>{{ quality.pourcentageSansEmail }} %</strong></span
            >
            <span
              >Sans téléphone <strong>{{ quality.pourcentageSansTelephone }} %</strong></span
            >
            <span
              >Sans centre <strong>{{ quality.pourcentageSansCentre }} %</strong></span
            >
            <span
              >NCC hors format <strong>{{ quality.pourcentageNccHorsFormat }} %</strong></span
            >
          </div>
        } @else {
          <p class="pd-muted">Qualité indisponible.</p>
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
                      <th>État</th>
                      <th>Niveau</th>
                      <th>Délai GUDEF</th>
                      <th>Délai directions</th>
                      <th>Délai autorisation</th>
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
      .analytics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-block-end: 1rem;
      }
      .analytics > .pd-card {
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }
      .analytics h2 {
        margin: 0;
      }
      .analytics .head {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: baseline;
        justify-content: space-between;
      }
      .wide {
        grid-column: span 2;
      }
      .gauge-card {
        justify-items: center;
        text-align: center;
      }
      .gauge {
        inline-size: 150px;
        block-size: 150px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        position: relative;
      }
      .gauge::before {
        content: '';
        position: absolute;
        inset: 18px;
        border-radius: 50%;
        background: var(--color-surface, #fff);
      }
      .gauge span {
        position: relative;
        font-size: 1.35rem;
        font-weight: 700;
      }
      .rates {
        display: grid;
        gap: 0.6rem;
      }
      .rate {
        display: grid;
        grid-template-columns: minmax(5rem, 8rem) minmax(0, 1fr) auto;
        gap: 0.5rem;
        align-items: center;
        font-size: var(--text-sm);
      }
      .rate__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .rate__bar {
        block-size: 0.6rem;
        border-radius: 999px;
        background: var(--color-border);
        overflow: hidden;
      }
      .rate__bar span {
        display: block;
        block-size: 100%;
        border-radius: inherit;
        background: var(--color-primary);
      }
      .recent {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.5rem;
      }
      .recent li {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: space-between;
        border-block-end: 1px solid var(--color-border);
        padding-block-end: 0.45rem;
      }
      .recent__main {
        display: grid;
        min-inline-size: 0;
      }
      .recent__main span {
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status {
        flex: none;
        font-size: var(--text-xs, 0.7rem);
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: var(--color-border);
      }
      .status--favorable {
        background: #d9f2e3;
        color: #1b6b3f;
      }
      .status--non_favorable,
      .status--rejete {
        background: #f7dcd9;
        color: #8c2f28;
      }
      .status--en_cours {
        background: #dde9f7;
        color: #1d4f7c;
      }
      @media (max-width: 63.99rem) {
        .analytics {
          grid-template-columns: 1fr;
        }
        .wide {
          grid-column: auto;
        }
      }
    `,
  ],
})
export class DashboardHomeComponent implements OnDestroy {
  private readonly gateway = inject(DashboardGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly timer: ReturnType<typeof setInterval> | null;

  readonly periods = [
    { value: '7j', label: '7 jours' },
    { value: '30j', label: '30 jours' },
    { value: '3m', label: '3 mois' },
    { value: '6m', label: '6 mois' },
    { value: 'annee', label: 'Année' },
    { value: 'tout', label: 'Tout' },
  ];
  readonly filters = { periode: '30j', statut: '' };
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly analytique = signal<DashboardAnalytique | null>(null);
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
          { label: 'Rejetés', value: kpis.rejetes },
        ]
      : [];
  });
  readonly canNominatif = () => this.permissions.hasPermission('Dashboard_ReadDg');
  readonly canImputation = () => this.permissions.hasPermission('Etapes_Imputer');
  readonly lastRefreshAt = signal(Date.now());

  readonly analytiqueState = computed(() =>
    this.analytique() ? ('success' as const) : ('empty' as const),
  );

  readonly repartitionData = computed<DonutDatum[]>(() =>
    (this.analytique()?.repartition ?? [])
      .filter((item) => item.valeur > 0)
      .map((item) => ({ label: item.libelle, value: item.valeur })),
  );

  readonly evolutionData = computed<LineDatum[]>(() =>
    (this.analytique()?.evolution ?? []).map((item) => ({
      label: item.libelle,
      value: item.total,
    })),
  );

  readonly directionBars = computed<ComparisonDatum[]>(() =>
    (this.analytique()?.directions ?? []).map((item) => ({
      label: item.libelle,
      courant: item.total,
      precedent: item.enCours,
    })),
  );

  readonly directions = computed(() => this.analytique()?.directions ?? []);
  readonly recentes = computed(() => this.analytique()?.demandesRecentes ?? []);
  readonly gaugeBackground = computed(() => {
    const value = this.clamp(this.analytique()?.tauxTraitement ?? 0);
    return `conic-gradient(var(--color-primary) 0 ${value}%, var(--color-border) ${value}% 100%)`;
  });

  constructor() {
    if (isLighthouseEnabled()) {
      this.kpis.set(LIGHTHOUSE_KPIS);
      this.analytique.set(LIGHTHOUSE_ANALYTIQUE);
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
      next: (kpis) => {
        this.kpis.set(kpis);
        this.lastRefreshAt.set(Date.now());
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
    this.gateway.qualite().subscribe({
      next: (quality) => this.qualite.set(quality),
      error: () => this.qualite.set(null),
    });
    this.gateway.analytique(this.filters).subscribe({
      next: (analytique) => this.analytique.set(analytique),
      error: () => this.analytique.set(null),
    });
  }

  loadNominatif(): void {
    this.gateway.nominatif(this.filters).subscribe({
      next: (page) => this.nominatif.set(page),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  formatRate(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1).replace('.', ',')} %`;
  }

  clamp(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  statutLabel(statut: string): string {
    return (
      {
        EN_COURS: 'En cours',
        FAVORABLE: 'Avis favorable',
        NON_FAVORABLE: 'Avis non favorable',
        REJETE: 'Rejete',
        CLOTURE: 'Cloture',
        ABANDONNE: 'Abandonne',
      }[statut] ?? statut
    );
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

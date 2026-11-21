import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { Alerte, AlertePage, AlerteStats } from '../../core/models/alertes/alerte.model';
import {
  BarChartComponent,
  type BarChartDatum,
} from '../../core/components/bar-chart/bar-chart.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { AlerteGateway } from '../../core/services/alertes/alerte.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { etapeLabel } from '../../core/utils/labels';

const LIGHTHOUSE_PAGE: AlertePage = {
  items: [
    {
      id: 'lh-alerte-1',
      demandeId: 'lh-demande-1',
      numeroDemande: '2026-0001',
      cycle: 1,
      etape: 'VERIF_GUDEF',
      type: 'RETARD',
      directionId: 'GUDEF',
      dateEcheance: '2026-11-05T00:00:00Z',
      joursRetard: 4,
      statut: 'OUVERTE',
      derniereRelanceAt: null,
    },
    {
      id: 'lh-alerte-2',
      demandeId: 'lh-demande-2',
      numeroDemande: '2026-0002',
      cycle: 1,
      etape: 'AVIS_DERAR',
      type: 'ECHEANCE',
      directionId: 'DERAR',
      dateEcheance: '2026-11-09T00:00:00Z',
      joursRetard: 0,
      statut: 'OUVERTE',
      derniereRelanceAt: null,
    },
  ],
  page: 1,
  pageSize: 50,
  totalCount: 2,
  ouvertes: 2,
  resolues: 0,
  enRetard: 1,
};

const LIGHTHOUSE_STATS: AlerteStats = {
  granularite: 'semaine',
  points: [
    { periode: '2026-S44', libelle: '2026-S44', valeur: 3 },
    { periode: '2026-S45', libelle: '2026-S45', valeur: 6 },
    { periode: '2026-S46', libelle: '2026-S46', valeur: 2 },
  ],
};

@Component({
  selector: 'pdref-alertes-page',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    BarChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header title="Alertes" subtitle="Echeances, retards et plafonds de traitement." />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="stats" aria-label="Compteurs des alertes">
        <div class="pd-card stat">
          <span class="pd-label">Ouvertes</span><strong>{{ page().ouvertes }}</strong>
        </div>
        <a
          class="pd-card stat"
          [routerLink]="['/dashboard/pilotage/dossiers']"
          [queryParams]="{ source: 'ALERTES', metric: 'EN_RETARD' }"
        >
          <span class="pd-label">En retard</span><strong>{{ page().enRetard }}</strong>
        </a>
        <div class="pd-card stat">
          <span class="pd-label">Resolues</span><strong>{{ page().resolues }}</strong>
        </div>
      </section>

      <section class="pd-card">
        <div class="head">
          <h2>Volume d'alertes</h2>
          <label class="pd-field granularity">
            <span class="pd-label">Granularite</span>
            <select class="pd-input" [value]="granularity()" (change)="onGranularity($event)">
              <option value="semaine">Par semaine</option>
              <option value="mois">Par mois</option>
            </select>
          </label>
        </div>
        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des alertes" />
        } @else {
          <pdref-bar-chart
            title="Alertes ouvertes par période"
            unit="alertes"
            [series]="chartData()"
            (barClick)="openPeriod($event)"
          />
        }
      </section>

      <section class="pd-card">
        <div class="head">
          <h2>Liste des alertes</h2>
          <span class="pd-muted">{{ page().totalCount }} alerte(s)</span>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); load()">
          <label class="pd-field"
            ><span class="pd-label">Du</span>
            <input
              class="pd-input"
              type="date"
              [value]="filters.dateDu"
              (input)="onDateDu($event)"
            />
          </label>
          <label class="pd-field"
            ><span class="pd-label">Au</span>
            <input
              class="pd-input"
              type="date"
              [value]="filters.dateAu"
              (input)="onDateAu($event)"
            />
          </label>
          <label class="pd-field"
            ><span class="pd-label">Direction</span>
            <select class="pd-input" [value]="filters.directionId" (change)="onDirection($event)">
              <option value="">Toutes</option>
              @for (direction of directions; track direction) {
                <option [value]="direction">{{ direction }}</option>
              }
            </select>
          </label>
          <label class="pd-field"
            ><span class="pd-label">Type</span>
            <select class="pd-input" [value]="filters.type" (change)="onType($event)">
              <option value="">Tous</option>
              @for (type of types; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </label>
          <label class="pd-field"
            ><span class="pd-label">Étape</span>
            <input
              class="pd-input"
              [value]="filters.etape"
              (input)="onEtape($event)"
              placeholder="Ex. VERIF_GUDEF"
            />
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune alerte"
            message="Aucune alerte ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap" tabindex="0" role="region" aria-label="Liste des alertes">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Direction</th>
                  <th>Étape</th>
                  <th>Type</th>
                  <th>Échéance</th>
                  <th>Retard</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/demandes', item.demandeId]">{{
                        item.numeroDemande
                      }}</a>
                    </td>
                    <td>{{ item.directionId }}</td>
                    <td>{{ etapeLabel(item.etape) }}</td>
                    <td>
                      <span
                        class="pd-chip"
                        [class.pd-chip--danger]="isDanger(item)"
                        [class.pd-chip--warning]="!isDanger(item)"
                        >{{ typeLabel(item.type) }}</span
                      >
                    </td>
                    <td>{{ item.dateEcheance | abidjanDate }}</td>
                    <td>{{ item.joursRetard }} JO</td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
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
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .stat {
        display: grid;
        gap: 0.5rem;
      }
      .stat strong {
        font-size: 2rem;
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
      .granularity {
        min-width: 10rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class AlertesPageComponent {
  readonly etapeLabel = etapeLabel;
  private readonly gateway = inject(AlerteGateway);
  private readonly router = inject(Router);
  readonly page = signal<AlertePage>({
    items: [],
    page: 1,
    pageSize: 50,
    totalCount: 0,
    ouvertes: 0,
    resolues: 0,
    enRetard: 0,
  });
  readonly stats = signal<AlerteStats>({ granularite: 'semaine', points: [] });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly granularity = signal<'semaine' | 'mois'>('semaine');
  readonly filters = { dateDu: '', dateAu: '', directionId: '', type: '', etape: '' };
  readonly directions = ['GUDEF', 'DERAR', 'DVFN', 'RATTACHEMENT', 'CTF'];
  readonly types = [
    { value: 'ECHEANCE', label: 'Echeance' },
    { value: 'RETARD', label: 'Retard' },
    { value: 'PLAFOND_30JO', label: 'Plafond 30 JO' },
    { value: 'LEGACY_PREALERTE', label: 'Legacy pre-alerte' },
    { value: 'LEGACY_ALERTE', label: 'Legacy alerte' },
  ];
  readonly chartData = signal<BarChartDatum[]>([]);

  constructor() {
    if (isLighthouseEnabled()) {
      this.page.set(LIGHTHOUSE_PAGE);
      this.stats.set(LIGHTHOUSE_STATS);
      this.chartData.set(this.toChart(LIGHTHOUSE_STATS));
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
        this.loadStats();
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  loadStats(): void {
    this.gateway
      .stats({
        granularite: this.granularity(),
        dateDu: this.filters.dateDu,
        dateAu: this.filters.dateAu,
      })
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.chartData.set(this.toChart(stats));
        },
        error: () => this.chartData.set([]),
      });
  }

  onGranularity(event: Event): void {
    this.granularity.set((event.target as HTMLSelectElement).value as 'semaine' | 'mois');
    this.loadStats();
  }
  onDateDu(event: Event): void {
    this.filters.dateDu = (event.target as HTMLInputElement).value;
  }
  onDateAu(event: Event): void {
    this.filters.dateAu = (event.target as HTMLInputElement).value;
  }
  onDirection(event: Event): void {
    this.filters.directionId = (event.target as HTMLSelectElement).value;
  }
  onType(event: Event): void {
    this.filters.type = (event.target as HTMLSelectElement).value;
  }
  onEtape(event: Event): void {
    this.filters.etape = (event.target as HTMLInputElement).value;
  }

  filterPeriod(period: string): void {
    const range = periodRange(period);
    if (range) {
      this.filters.dateDu = range[0];
      this.filters.dateAu = range[1];
      this.load();
    }
  }

  openPeriod(period: string): void {
    const range = periodRange(period);
    if (!range) {
      return;
    }
    void this.router.navigate(['/dashboard/pilotage/dossiers'], {
      queryParams: {
        source: 'ALERTES',
        metric: 'OUVERTES',
        dateDu: range[0],
        dateAu: range[1],
        directionId: this.filters.directionId || null,
        type: this.filters.type || null,
        etape: this.filters.etape || null,
      },
    });
  }

  typeLabel(type: string): string {
    return this.types.find((item) => item.value === type)?.label ?? type;
  }
  statutLabel(statut: string): string {
    return statut === 'OUVERTE' ? 'Ouverte' : 'Resolue';
  }
  isDanger(item: Alerte): boolean {
    return item.type === 'RETARD' || item.type === 'PLAFOND_30JO' || item.type === 'LEGACY_ALERTE';
  }

  private toChart(stats: AlerteStats): BarChartDatum[] {
    return stats.points.map((point) => ({ label: point.libelle, value: point.valeur }));
  }
}

function periodRange(period: string): [string, string] | null {
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) {
    const year = Number(month[1]);
    const m = Number(month[2]);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 0));
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }
  const week = /^(\d{4})-S(\d{2})$/.exec(period);
  if (week) {
    const year = Number(week[1]);
    const w = Number(week[2]);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const day = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
  }
  return null;
}

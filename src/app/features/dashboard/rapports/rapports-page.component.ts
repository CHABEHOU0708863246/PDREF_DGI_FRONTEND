import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import type {
  RapportExport,
  RapportFormat,
  RapportLigne,
  RapportQuery,
  RapportStatistiques,
  RapportStatistiquesSection,
  RapportType,
} from '../../../core/models/rapports/rapport.model';
import type { ComparisonDatum } from '../../../core/components/comparison-bar-chart/comparison-bar-chart.component';
import { ComparisonBarChartComponent } from '../../../core/components/comparison-bar-chart/comparison-bar-chart.component';
import type { DonutDatum } from '../../../core/components/donut-chart/donut-chart.component';
import { DonutChartComponent } from '../../../core/components/donut-chart/donut-chart.component';
import { KpiCardComponent } from '../../../core/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../../core/components/state-panel/state-panel.component';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { RapportGateway } from '../../../core/services/rapports/rapport.gateway';
import { isLighthouseEnabled } from '../../../core/utils/lighthouse';
import { normalizeProblem } from '../../../core/utils/problem';

const LIGHTHOUSE_STATS: RapportStatistiques = {
  type: 'ANNUEL',
  libelle: 'Annee 2026',
  dateDu: '2026-01-01',
  dateAu: '2026-12-31',
  dateDuPrecedent: '2025-01-01',
  dateAuPrecedent: '2025-12-31',
  kpis: {
    formulees: 16,
    traitees: 6,
    tauxTraitement: 37.5,
    favorables: 3,
    tauxReponseFavorable: 50,
    stockGlobal: 10,
    formuleesPrecedent: 8,
    traiteesPrecedent: 4,
    favorablesPrecedent: 2,
    stockGlobalPrecedent: 4,
  },
  evolution: [
    { label: 'Janv.', courant: 1, precedent: 0 },
    { label: 'Fevr.', courant: 2, precedent: 1 },
    { label: 'Mars', courant: 3, precedent: 1 },
    { label: 'Avril', courant: 1, precedent: 2 },
    { label: 'Mai', courant: 4, precedent: 0 },
  ],
  sections: [
    {
      code: 'SYSTEME_COMPTABLE',
      titre: 'Repartition par systeme comptable',
      lignes: [
        { code: 'NORMAL', libelle: 'Normal/OHADA', courant: 8, precedent: 3, ecart: 5 },
        { code: 'SMT', libelle: 'SMT', courant: 3, precedent: 4, ecart: -1 },
        { code: 'RSI', libelle: 'RSI', courant: 5, precedent: 1, ecart: 4 },
        { code: 'TOTAL', libelle: 'Total', courant: 16, precedent: 8, ecart: 8, estTotal: true },
      ],
    },
    {
      code: 'SECTEUR',
      titre: "Repartition par secteur d'activite",
      lignes: [
        { code: 'AGRICULTURE', libelle: 'AGRICULTURE', courant: 7, precedent: 2, ecart: 5 },
        { code: 'BTP', libelle: 'BTP', courant: 2, precedent: 2, ecart: 0 },
        { code: 'SERVICES', libelle: 'SERVICES', courant: 7, precedent: 2, ecart: 5 },
        { code: 'TOTAL', libelle: 'Total', courant: 16, precedent: 8, ecart: 8, estTotal: true },
      ],
    },
  ],
  avis: [
    {
      code: 'DERAR',
      libelle: 'DERAR',
      favorables: 7,
      nonFavorables: 2,
      total: 9,
      precedent: 5,
      ecart: 4,
    },
    {
      code: 'DVFN',
      libelle: 'DVFN',
      favorables: 7,
      nonFavorables: 0,
      total: 7,
      precedent: 5,
      ecart: 2,
    },
    {
      code: 'TOTAL',
      libelle: 'Total',
      favorables: 14,
      nonFavorables: 2,
      total: 16,
      precedent: 10,
      ecart: 6,
      estTotal: true,
    },
  ],
  directions: [
    {
      directionId: 'DME',
      directionLibelle: 'DME',
      formulees: 1,
      traitees: 0,
      tauxTraitement: 0,
      favorables: 0,
      tauxReponseFavorable: null,
      stockGlobal: 1,
    },
    {
      directionId: 'TOTAL',
      directionLibelle: 'Total',
      formulees: 16,
      traitees: 6,
      tauxTraitement: 37.5,
      favorables: 3,
      tauxReponseFavorable: 50,
      stockGlobal: 10,
      estTotal: true,
    },
  ],
  legende: ['Formulee = demande deposee pendant la periode.'],
};

const LIGHTHOUSE_EXPORTS: RapportExport[] = [
  {
    id: 'lh-export-1',
    format: 'PDF',
    type: 'ANNUEL',
    dateDu: '2026-01-01',
    dateAu: '2026-12-31',
    directionId: null,
    statut: 'PRET',
    fileName: 'rapport_ANNUEL.pdf',
    createdAt: '2026-11-09T10:00:00Z',
    completedAt: '2026-11-09T10:01:00Z',
    expiresAt: '2026-12-09T10:01:00Z',
    errorMessage: null,
  },
];

interface KpiView {
  label: string;
  value: string | number;
  hint: string;
  icon: 'file' | 'clipboard' | 'layout' | 'check' | 'clock';
}

@Component({
  selector: 'pdref-rapports-page',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    KpiCardComponent,
    DonutChartComponent,
    ComparisonBarChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Rapports et statistiques"
      subtitle="Demandes, avis et traitements par système comptable, secteur, direction et type d'erreur."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement des rapports" />
    } @else if (stats(); as data) {
      <section class="filters pd-card" aria-label="Filtres des rapports">
        <label class="pd-field">
          <span class="pd-label">Période</span>
          <select class="pd-input" [value]="type()" (change)="onType($event)">
            @for (item of types; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
        </label>
        <label class="pd-field">
          <span class="pd-label">Date de référence</span>
          <input
            class="pd-input"
            type="date"
            [value]="dateReference()"
            (input)="onDateReference($event)"
          />
        </label>
        @if (type() === 'PERSONNALISE') {
          <label class="pd-field">
            <span class="pd-label">Du</span>
            <input class="pd-input" type="date" [value]="dateDu()" (input)="onDateDu($event)" />
          </label>
          <label class="pd-field">
            <span class="pd-label">Au</span>
            <input class="pd-input" type="date" [value]="dateAu()" (input)="onDateAu($event)" />
          </label>
        }
        <label class="pd-field">
          <span class="pd-label">Direction</span>
          <select class="pd-input" [value]="directionId()" (change)="onDirection($event)">
            <option value="">Toutes</option>
            @for (direction of directionOptions(); track direction.directionId) {
              <option [value]="direction.directionId">{{ direction.directionLibelle }}</option>
            }
          </select>
        </label>
        <button type="button" class="pd-btn pd-btn--primary" (click)="load()">Afficher</button>
      </section>

      <section class="period pd-card" aria-label="Période du rapport">
        <div>
          <h2>{{ data.libelle }}</h2>
          <p class="pd-muted">
            {{ formatDate(data.dateDu) }} au {{ formatDate(data.dateAu) }} — compare a
            {{ formatDate(data.dateDuPrecedent) }} au {{ formatDate(data.dateAuPrecedent) }}
          </p>
        </div>
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/pilotage/dossiers"
          >Voir les dossiers</a
        >
      </section>

      <section class="kpis" aria-label="Indicateurs de la période">
        @for (kpi of kpiCards(); track kpi.label) {
          <pdref-kpi-card
            [label]="kpi.label"
            [value]="kpi.value"
            [hint]="kpi.hint"
            [icon]="kpi.icon"
          />
        }
      </section>

      <section class="pd-card" aria-label="Évolution des demandes">
        <div class="head">
          <h2>Évolution des demandes</h2>
          <span class="pd-muted">Période courante et meme période de l'année precedente</span>
        </div>
        <pdref-comparison-bar-chart
          [series]="evolutionSeries()"
          title="Évolution des demandes"
          [currentLabel]="data.libelle"
          previousLabel="Annee precedente"
        />
      </section>

      <div class="report-grid">
        @for (section of data.sections; track section.code) {
          <section class="pd-card report-card" [attr.aria-label]="section.titre">
            <h2>{{ section.titre }}</h2>
            <pdref-donut-chart
              [series]="donutFor(section)"
              [title]="section.titre"
              unit="demandes"
            />
            <div class="table-wrap" tabindex="0" role="region" [attr.aria-label]="section.titre">
              <table class="pd-table">
                <caption class="pd-muted">
                  {{
                    section.titre
                  }}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Libellé</th>
                    <th scope="col" class="num">{{ data.libelle }}</th>
                    <th scope="col" class="num">Précédent</th>
                    <th scope="col" class="num">Ecart</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of section.lignes; track line.code) {
                    <tr [class.total]="line.estTotal">
                      <th scope="row">{{ line.libelle }}</th>
                      <td class="num">{{ line.courant }}</td>
                      <td class="num">{{ line.precedent }}</td>
                      <td
                        class="num"
                        [class.positive]="line.ecart > 0"
                        [class.negative]="line.ecart < 0"
                      >
                        {{ formatEcart(line.ecart) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      </div>

      <section class="pd-card" aria-label="Avis emis par les directions">
        <div class="head">
          <h2>Avis emis par les directions competentes</h2>
          <span class="pd-muted">{{ data.libelle }}</span>
        </div>
        @if (data.avis.length === 0) {
          <p class="pd-muted">Aucun avis emis sur la période.</p>
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th scope="col">Direction</th>
                  <th scope="col" class="num">Favorables</th>
                  <th scope="col" class="num">Non favorables</th>
                  <th scope="col" class="num">Total</th>
                  <th scope="col" class="num">Précédent</th>
                  <th scope="col" class="num">Ecart</th>
                </tr>
              </thead>
              <tbody>
                @for (line of data.avis; track line.code) {
                  <tr [class.total]="line.estTotal">
                    <th scope="row">{{ line.libelle }}</th>
                    <td class="num">{{ line.favorables }}</td>
                    <td class="num">{{ line.nonFavorables }}</td>
                    <td class="num">{{ line.total }}</td>
                    <td class="num">{{ line.precedent }}</td>
                    <td
                      class="num"
                      [class.positive]="line.ecart > 0"
                      [class.negative]="line.ecart < 0"
                    >
                      {{ formatEcart(line.ecart) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="pd-card" aria-label="Situation par direction de rattachement">
        <div class="head">
          <h2>Situation par direction de rattachement</h2>
          <span class="pd-muted">Taux de traitement acheve et taux de réponse favorable</span>
        </div>
        <div class="table-wrap">
          <table class="pd-table">
            <thead>
              <tr>
                <th scope="col">Direction</th>
                <th scope="col" class="num">Formulees</th>
                <th scope="col" class="num">Traitees</th>
                <th scope="col" class="num">Taux de traitement</th>
                <th scope="col" class="num">Favorables</th>
                <th scope="col" class="num">Taux favorable</th>
                <th scope="col" class="num">Stock</th>
              </tr>
            </thead>
            <tbody>
              @for (line of data.directions; track line.directionId) {
                <tr [class.total]="line.estTotal">
                  <th scope="row">
                    @if (line.estTotal) {
                      {{ line.directionLibelle }}
                    } @else {
                      <a
                        class="pd-link"
                        [routerLink]="['/dashboard/pilotage/dossiers']"
                        [queryParams]="directionQuery(line)"
                      >
                        {{ line.directionLibelle }}
                      </a>
                    }
                  </th>
                  <td class="num">{{ line.formulees }}</td>
                  <td class="num">{{ line.traitees }}</td>
                  <td class="num">{{ formatRate(line.tauxTraitement) }}</td>
                  <td class="num">{{ line.favorables }}</td>
                  <td class="num">{{ formatRate(line.tauxReponseFavorable) }}</td>
                  <td class="num">{{ line.stockGlobal }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="pd-card legend" aria-label="Definitions des indicateurs">
        <h2>Definitions</h2>
        @for (definition of data.legende; track definition) {
          <p class="pd-muted">{{ definition }}</p>
        }
      </section>

      <section class="export-bar pd-card" aria-label="Preparation des exports">
        <div>
          <h2>Export du rapport par direction</h2>
          <p class="pd-muted">
            PDF, Excel ou Word prepare en arriere-plan, selon la période filtree.
          </p>
        </div>
        <label class="pd-field">
          <span class="pd-label">Format</span>
          <select class="pd-input" [value]="format()" (change)="onFormat($event)">
            @for (item of formats; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="pd-btn pd-btn--primary"
          [disabled]="!canExport()"
          (click)="createExport()"
        >
          Exporter
        </button>
      </section>

      @if (notice()) {
        <p class="pd-card notice" role="status" aria-live="polite">{{ notice() }}</p>
      }

      <section class="pd-card" aria-label="Mes exports">
        <div class="head">
          <h2>Mes exports</h2>
          <button type="button" class="pd-btn pd-btn--ghost" (click)="loadExports()">
            Actualiser
          </button>
        </div>
        @if (exports().length === 0) {
          <p class="pd-muted">Aucun export demande.</p>
        } @else {
          <ul class="exports">
            @for (item of exports(); track item.id) {
              <li>
                <span class="pd-chip">{{ item.format }}</span>
                <span>{{ formatDate(item.dateDu) }} - {{ formatDate(item.dateAu) }}</span>
                <span class="pd-muted">{{ statutLabel(item.statut) }}</span>
                @if (item.statut === 'PRET' && canExport()) {
                  <button type="button" class="pd-btn pd-btn--ghost" (click)="download(item)">
                    Télécharger
                  </button>
                }
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
  styles: [
    `
      .filters,
      .period,
      .head,
      .exports li {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
      }
      .filters,
      .period,
      .export-bar {
        margin-block-end: 1rem;
      }
      .period,
      .head,
      .export-bar {
        justify-content: space-between;
      }
      .period h2,
      .head h2,
      .export-bar h2 {
        margin: 0;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 1rem;
        margin-block-end: 1rem;
      }
      .report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
        gap: 1rem;
        margin-block-end: 1rem;
      }
      .report-card {
        display: grid;
        gap: 0.75rem;
      }
      .report-card h2 {
        margin: 0;
      }
      .table-wrap {
        overflow-x: auto;
        margin-block-start: 0.5rem;
      }
      .pd-table .num {
        text-align: end;
        font-variant-numeric: tabular-nums;
      }
      .positive {
        color: var(--color-success, #1b7f4b);
        font-weight: 600;
      }
      .negative {
        color: var(--color-danger, #b3423a);
        font-weight: 600;
      }
      .total th,
      .total td {
        font-weight: 600;
      }
      .legend p {
        margin: 0.25rem 0;
      }
      .notice {
        margin-block-end: 1rem;
      }
      .exports {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: grid;
        gap: 0.75rem;
      }
      .exports li {
        align-items: center;
      }
      @media (max-width: 47.99rem) {
        .report-grid {
          grid-template-columns: 1fr;
        }
        .export-bar,
        .head {
          align-items: stretch;
        }
      }
    `,
  ],
})
export class RapportsPageComponent {
  private readonly gateway = inject(RapportGateway);
  private readonly permissions = inject(PermissionsService);
  readonly stats = signal<RapportStatistiques | null>(null);
  readonly exports = signal<RapportExport[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal('');
  readonly type = signal<RapportType>('ANNUEL');
  readonly dateReference = signal(today());
  readonly dateDu = signal('');
  readonly dateAu = signal('');
  readonly directionId = signal('');
  readonly format = signal<RapportFormat>('PDF');
  readonly canExport = computed(() => this.permissions.hasPermission('Rapports_Export'));
  readonly types = [
    { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'TRIMESTRIEL', label: 'Trimestriel' },
    { value: 'ANNUEL', label: 'Annuel' },
    { value: 'PERSONNALISE', label: 'Personnalise' },
  ] as const;
  readonly formats = [
    { value: 'PDF', label: 'PDF' },
    { value: 'EXCEL', label: 'Excel' },
    { value: 'WORD', label: 'Word' },
  ] as const;

  readonly kpiCards = computed<KpiView[]>(() => {
    const kpis = this.stats()?.kpis;
    if (!kpis) {
      return [];
    }
    return [
      {
        label: 'Demandes formulees',
        value: kpis.formulees,
        hint: `Precedent : ${kpis.formuleesPrecedent}`,
        icon: 'clipboard',
      },
      {
        label: 'Demandes traitees',
        value: kpis.traitees,
        hint: `Precedent : ${kpis.traiteesPrecedent}`,
        icon: 'check',
      },
      {
        label: 'Taux de traitement',
        value: this.formatRate(kpis.tauxTraitement),
        hint: 'Traitees / formulees',
        icon: 'layout',
      },
      {
        label: 'Reponses favorables',
        value: kpis.favorables,
        hint: `Precedent : ${kpis.favorablesPrecedent}`,
        icon: 'check',
      },
      {
        label: 'Taux de reponse favorable',
        value: this.formatRate(kpis.tauxReponseFavorable),
        hint: 'Favorables / traitees',
        icon: 'file',
      },
      {
        label: 'Stock global',
        value: kpis.stockGlobal,
        hint: `Precedent : ${kpis.stockGlobalPrecedent}`,
        icon: 'clock',
      },
    ];
  });

  readonly directionOptions = signal<RapportLigne[]>([]);

  constructor() {
    if (isLighthouseEnabled()) {
      this.stats.set(LIGHTHOUSE_STATS);
      this.exports.set(LIGHTHOUSE_EXPORTS);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.statistiques(this.query()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        if (!this.directionId()) {
          this.directionOptions.set(stats.directions.filter((item) => !item.estTotal));
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
    this.loadExports();
  }

  loadExports(): void {
    this.gateway.exports().subscribe({
      next: (items) => this.exports.set(items),
      error: () => this.exports.set([]),
    });
  }

  createExport(): void {
    if (!this.canExport()) {
      return;
    }
    this.notice.set('Export en preparation, vous serez prevenu.');
    this.gateway.createExport({ ...this.query(), format: this.format() }).subscribe({
      next: () => this.loadExports(),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  download(item: RapportExport): void {
    this.gateway.download(item.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.fileName ?? `rapport.${item.format.toLowerCase()}`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  evolutionSeries(): ComparisonDatum[] {
    return (this.stats()?.evolution ?? []).map((point) => ({
      label: point.label,
      courant: point.courant,
      precedent: point.precedent,
    }));
  }

  donutFor(section: RapportStatistiquesSection): DonutDatum[] {
    const lines = section.lignes
      .filter((line) => !line.estTotal && line.courant > 0)
      .sort((left, right) => right.courant - left.courant);
    if (lines.length <= 6) {
      return lines.map((line) => ({ label: line.libelle, value: line.courant }));
    }
    const top = lines.slice(0, 6).map((line) => ({ label: line.libelle, value: line.courant }));
    const rest = lines.slice(6).reduce((sum, line) => sum + line.courant, 0);
    return rest > 0 ? [...top, { label: 'Autres', value: rest }] : top;
  }

  directionQuery(line: RapportLigne) {
    return {
      source: 'RAPPORTS',
      metric: 'FORMULEES',
      directionId: line.directionId,
      rapportType: this.type(),
      dateReference: this.dateReference() || null,
      dateDu: this.dateDu() || null,
      dateAu: this.dateAu() || null,
    };
  }

  onType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as RapportType);
    this.load();
  }

  onDateReference(event: Event): void {
    this.dateReference.set((event.target as HTMLInputElement).value);
  }

  onDateDu(event: Event): void {
    this.dateDu.set((event.target as HTMLInputElement).value);
  }

  onDateAu(event: Event): void {
    this.dateAu.set((event.target as HTMLInputElement).value);
  }

  onDirection(event: Event): void {
    this.directionId.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  onFormat(event: Event): void {
    this.format.set((event.target as HTMLSelectElement).value as RapportFormat);
  }

  formatRate(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1).replace('.', ',')} %`;
  }

  formatEcart(value: number): string {
    return value > 0 ? `+${value}` : String(value);
  }

  formatDate(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('fr-CI', { timeZone: 'Africa/Abidjan' }).format(date);
  }

  statutLabel(statut: RapportExport['statut']): string {
    return this.statutLabels[statut] ?? statut;
  }

  private readonly statutLabels: Record<RapportExport['statut'], string> = {
    EN_ATTENTE: 'En attente',
    EN_PREPARATION: 'En preparation',
    PRET: 'Pret',
    ECHEC: 'Echec',
    PURGE: 'Purge',
  };

  private query(): RapportQuery {
    return {
      type: this.type(),
      dateReference: this.dateReference() || null,
      dateDu: this.type() === 'PERSONNALISE' ? this.dateDu() || null : null,
      dateAu: this.type() === 'PERSONNALISE' ? this.dateAu() || null : null,
      directionId: this.directionId() || null,
    };
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

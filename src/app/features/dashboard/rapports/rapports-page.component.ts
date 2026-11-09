import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import type {
  RapportExport,
  RapportFormat,
  RapportResponse,
  RapportType,
} from '../../../core/models/rapports/rapport.model';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../../core/components/state-panel/state-panel.component';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { RapportGateway } from '../../../core/services/rapports/rapport.gateway';
import { isLighthouseEnabled } from '../../../core/utils/lighthouse';
import { normalizeProblem } from '../../../core/utils/problem';

const LIGHTHOUSE_REPORT: RapportResponse = {
  type: 'MENSUEL',
  libelle: 'Mois de 11/2026',
  dateDu: '2026-11-01',
  dateAu: '2026-11-30',
  lignes: [
    {
      directionId: 'GUDEF',
      directionLibelle: 'GUDEF',
      formulees: 18,
      traitees: 12,
      tauxTraitement: 66.7,
      favorables: 8,
      tauxReponseFavorable: 66.7,
      stockGlobal: 6,
    },
    {
      directionId: 'DERAR',
      directionLibelle: 'DERAR',
      formulees: 9,
      traitees: 5,
      tauxTraitement: 55.6,
      favorables: 3,
      tauxReponseFavorable: 60,
      stockGlobal: 4,
    },
  ],
  legende: [
    'Traitee = decision globale favorable ou non favorable.',
    'Taux de traitement = traitees / formulees.',
    'Taux de reponse favorable = favorables / traitees.',
    'Stock global = demandes en circuit non encore decidees.',
  ],
};

const LIGHTHOUSE_EXPORTS: RapportExport[] = [
  {
    id: 'lh-export-1',
    format: 'PDF',
    type: 'MENSUEL',
    dateDu: '2026-11-01',
    dateAu: '2026-11-30',
    directionId: null,
    statut: 'PRET',
    fileName: 'rapport_MENSUEL.pdf',
    createdAt: '2026-11-09T10:00:00Z',
    completedAt: '2026-11-09T10:01:00Z',
    expiresAt: '2026-12-09T10:01:00Z',
    errorMessage: null,
  },
  {
    id: 'lh-export-2',
    format: 'EXCEL',
    type: 'MENSUEL',
    dateDu: '2026-11-01',
    dateAu: '2026-11-30',
    directionId: 'GUDEF',
    statut: 'EN_ATTENTE',
    fileName: null,
    createdAt: '2026-11-09T10:02:00Z',
    completedAt: null,
    expiresAt: '2026-12-09T10:02:00Z',
    errorMessage: null,
  },
];

@Component({
  selector: 'pdref-rapports-page',
  standalone: true,
  imports: [PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Rapports"
      subtitle="Activite par direction, formules et decisions de la periode."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement des rapports" />
    } @else {
      <section class="filters pd-card" aria-label="Filtres des rapports">
        <label class="pd-field">
          <span class="pd-label">Periode</span>
          <select class="pd-input" [value]="type()" (change)="onType($event)">
            @for (item of types; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
        </label>
        <label class="pd-field">
          <span class="pd-label">Date de reference</span>
          <input
            class="pd-input"
            type="date"
            [value]="dateReference()"
            (input)="onDateReference($event)"
          />
        </label>
        <label class="pd-field">
          <span class="pd-label">Du (optionnel)</span>
          <input class="pd-input" type="date" [value]="dateDu()" (input)="onDateDu($event)" />
        </label>
        <label class="pd-field">
          <span class="pd-label">Au (optionnel)</span>
          <input class="pd-input" type="date" [value]="dateAu()" (input)="onDateAu($event)" />
        </label>
        <label class="pd-field">
          <span class="pd-label">Direction</span>
          <select class="pd-input" [value]="directionId()" (change)="onDirection($event)">
            <option value="">Toutes</option>
            @for (direction of directions; track direction) {
              <option [value]="direction">{{ direction }}</option>
            }
          </select>
        </label>
        <button type="button" class="pd-btn pd-btn--primary" (click)="load()">Afficher</button>
      </section>

      <section class="export-bar pd-card" aria-label="Preparation des exports">
        <div>
          <h2>Export</h2>
          <p class="pd-muted">PDF, Excel ou Word prepare en arriere-plan.</p>
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

      @if (report(); as data) {
        @if (data.lignes.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune donnee"
            message="Aucune direction ne correspond aux filtres."
          />
        } @else {
          <section class="pd-card">
            <div class="head">
              <h2>{{ data.libelle }}</h2>
              <span class="pd-muted"
                >{{ formatDate(data.dateDu) }} - {{ formatDate(data.dateAu) }}</span
              >
            </div>
            <div class="table-wrap" tabindex="0" role="region" aria-label="Rapports par direction">
              <table class="pd-table">
                <caption class="pd-muted">
                  Rapports par direction
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Formulees</th>
                    <th scope="col">Traitees</th>
                    <th scope="col">Taux de traitement</th>
                    <th scope="col">Favorables</th>
                    <th scope="col">Taux favorable</th>
                    <th scope="col">Stock global</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of data.lignes; track line.directionId) {
                    <tr [class.total]="line.estTotal">
                      <th scope="row">{{ line.directionLibelle }}</th>
                      <td>{{ line.formulees }}</td>
                      <td>{{ line.traitees }}</td>
                      <td>{{ formatRate(line.tauxTraitement) }}</td>
                      <td>{{ line.favorables }}</td>
                      <td>{{ formatRate(line.tauxReponseFavorable) }}</td>
                      <td>{{ line.stockGlobal }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="legend" aria-label="Definitions des indicateurs">
              @for (definition of data.legende; track definition) {
                <p class="pd-muted">{{ definition }}</p>
              }
            </div>
          </section>
        }
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
                    Telecharger
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
      .export-bar,
      .head,
      .exports li {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
      }
      .filters,
      .export-bar {
        margin-bottom: 1rem;
      }
      .export-bar,
      .head {
        justify-content: space-between;
      }
      .export-bar h2,
      .head h2 {
        margin: 0;
      }
      .notice {
        margin-bottom: 1rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
      .legend {
        margin-top: 1rem;
      }
      .legend p {
        margin: 0.25rem 0;
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
      .total th,
      .total td {
        font-weight: 600;
      }
      @media (max-width: 47.99rem) {
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
  readonly report = signal<RapportResponse | null>(null);
  readonly exports = signal<RapportExport[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal('');
  readonly type = signal<RapportType>('MENSUEL');
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
  readonly directions = ['GUDEF', 'DERAR', 'DVFN', 'RATTACHEMENT', 'CTF'];

  constructor() {
    if (isLighthouseEnabled()) {
      this.report.set(LIGHTHOUSE_REPORT);
      this.exports.set(LIGHTHOUSE_EXPORTS);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.query()).subscribe({
      next: (report) => {
        this.report.set(report);
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
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
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

  private query() {
    return {
      type: this.type(),
      dateReference: this.dateReference() || null,
      dateDu: this.dateDu() || null,
      dateAu: this.dateAu() || null,
      directionId: this.directionId() || null,
    };
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

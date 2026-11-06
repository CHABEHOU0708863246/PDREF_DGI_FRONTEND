import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  Contribuable,
  ContribuableQuality,
  ContribuableQuery,
} from '../../core/models/contribuables/contribuable.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-contribuables-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Contribuables"
      subtitle="Consultez et gerez les fiches contribuables. Les contacts sont masques par defaut."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="contribuables-card pd-card">
        <div class="contribuables-head">
          <h2>Liste</h2>
          <a class="pd-btn pd-btn--primary" routerLink="/dashboard/contribuables/nouveau"
            >Nouveau contribuable</a
          >
        </div>

        <div class="quality-grid">
          <article class="pd-card">
            <strong>{{ quality()?.pourcentageSansEmail ?? 0 }} %</strong><span>Sans email</span>
          </article>
          <article class="pd-card">
            <strong>{{ quality()?.pourcentageSansTelephone ?? 0 }} %</strong
            ><span>Sans telephone</span>
          </article>
          <article class="pd-card">
            <strong>{{ quality()?.pourcentageSansCentre ?? 0 }} %</strong><span>Sans centre</span>
          </article>
          <article class="pd-card">
            <strong>{{ quality()?.pourcentageNccHorsFormat ?? 0 }} %</strong
            ><span>NCC hors format</span>
          </article>
        </div>

        <form class="filters" (ngSubmit)="load(1)">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              [(ngModel)]="filters.search"
              name="search"
              placeholder="NCC ou raison sociale"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Systeme comptable</span>
            <input
              class="pd-input"
              [(ngModel)]="filters.systemeComptable"
              name="systemeComptable"
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">Secteur</span>
            <input class="pd-input" [(ngModel)]="filters.secteur" name="secteur" />
          </label>
          <label class="check"
            ><input type="checkbox" [(ngModel)]="filters.sansEmail" name="sansEmail" /> Sans
            email</label
          >
          <label class="check"
            ><input type="checkbox" [(ngModel)]="filters.sansTelephone" name="sansTelephone" /> Sans
            telephone</label
          >
          <label class="check"
            ><input type="checkbox" [(ngModel)]="filters.nccHorsFormat" name="nccHorsFormat" /> NCC
            hors format</label
          >
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="export('csv')">
              Export CSV
            </button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="export('xls')">
              Export Excel
            </button>
          </div>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des contribuables" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun contribuable"
            message="Aucune fiche ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>NCC</th>
                  <th>Raison sociale</th>
                  <th>Systeme</th>
                  <th>Centre</th>
                  <th>Email</th>
                  <th>Telephone</th>
                  <th>Qualite</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>{{ item.ncc }}</td>
                    <td>{{ item.raisonSociale }}</td>
                    <td>{{ item.systemeComptable }}</td>
                    <td>{{ item.centreImpotLibelle || item.centreImpotId }}</td>
                    <td>{{ item.emailMasque || '-' }}</td>
                    <td>{{ item.telephoneMasque || '-' }}</td>
                    <td>
                      @if (item.nccHorsFormat) {
                        <span class="pd-chip">NCC hors format</span>
                      }
                      @if (item.emailManquant) {
                        <span class="pd-chip">Sans email</span>
                      }
                      @if (item.telephoneManquant) {
                        <span class="pd-chip">Sans telephone</span>
                      }
                    </td>
                    <td>
                      <a
                        class="pd-btn pd-btn--ghost pd-btn--sm"
                        [routerLink]="['/dashboard/contribuables', item.id]"
                        >Detail</a
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
              [disabled]="page() === 1"
              (click)="load(page() - 1)"
            >
              Precedente
            </button>
            <span>Page {{ page() }} / {{ pageCount() }}</span>
            <button
              type="button"
              class="pd-btn pd-btn--ghost pd-btn--sm"
              [disabled]="page() >= pageCount()"
              (click)="load(page() + 1)"
            >
              Suivante
            </button>
          </nav>
        }
      </section>
    }
  `,
  styleUrl: './contribuables-page.component.scss',
})
export class ContribuablesPageComponent {
  private readonly gateway = inject(ContribuablesGateway);
  private readonly correlation = inject(CorrelationService);
  readonly items = signal<Contribuable[]>([]);
  readonly quality = signal<ContribuableQuality | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly pageSize = 20;
  readonly filters: ContribuableQuery = {
    search: '',
    systemeComptable: '',
    secteur: '',
    sansEmail: false,
    sansTelephone: false,
    nccHorsFormat: false,
  };

  constructor() {
    this.load(1);
  }

  load(page = 1): void {
    if (isLighthouseEnabled()) {
      this.items.set([LIGHTHOUSE_CONTRIBUABLE]);
      this.quality.set(LIGHTHOUSE_QUALITY);
      this.totalCount.set(1);
      this.page.set(1);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list({ ...this.filters, page, pageSize: this.pageSize }).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.page.set(response.page);
        this.totalCount.set(response.totalCount);
        this.gateway.quality().subscribe({
          next: (quality) => this.quality.set(quality),
          error: () => undefined,
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  export(format: 'csv' | 'xls'): void {
    this.gateway.export({ ...this.filters }, format).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }
}

const LIGHTHOUSE_CONTRIBUABLE: Contribuable = {
  id: 'lhci-contrib',
  ncc: '1234567A',
  raisonSociale: 'Client Alpha',
  systemeComptable: 'SYSCOHADA',
  centreImpotId: 'c-gudef',
  centreImpotLibelle: 'GUDEF',
  directionRattachementId: 'd-gudef',
  secteur: 'SERVICE',
  formeJuridique: 'SA',
  zoneId: null,
  adresse: 'Abidjan',
  emailMasque: 'j***@example.ci',
  telephoneMasque: '***12',
  email: null,
  telephone: null,
  emailManquant: false,
  telephoneManquant: false,
  nccHorsFormat: false,
  centreRattachementManquant: false,
  evalueLe: '2026-11-01T00:00:00Z',
  isArchived: false,
  archivedAt: null,
};

const LIGHTHOUSE_QUALITY: ContribuableQuality = {
  total: 1,
  sansEmail: 0,
  sansTelephone: 0,
  sansCentre: 0,
  nccHorsFormat: 0,
  pourcentageSansEmail: 0,
  pourcentageSansTelephone: 0,
  pourcentageSansCentre: 0,
  pourcentageNccHorsFormat: 0,
};

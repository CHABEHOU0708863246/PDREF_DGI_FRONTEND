import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { RejetListItem, RejetMotif, RejetPage } from '../../core/models/rejets/rejet.model';
import { ConfirmDialogComponent } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogWithInputComponent } from '../../core/components/confirm-dialog-with-input/confirm-dialog-with-input.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { REJET_FAMILLES, REJET_STATUTS, rejetFamilleLabel, rejetStatutLabel } from './rejet-status';

const LIGHTHOUSE_MOTIFS: RejetMotif[] = [
  {
    code: 'PIECE_JUSTIFICATIVE_MANQUANTE',
    libelle: 'Piece justificative manquante',
    legacy: false,
    selectionnable: true,
  },
  {
    code: 'INFORMATION_INCOMPLETE',
    libelle: 'Information incomplete',
    legacy: false,
    selectionnable: true,
  },
  {
    code: 'MOTIF_NON_SPECIFIE',
    libelle: 'Motif non specifie',
    legacy: true,
    selectionnable: false,
  },
];

const LIGHTHOUSE_ITEMS: RejetListItem[] = [
  {
    id: 'lh-rejet-1',
    demandeId: 'lh-demande-2',
    numeroDemande: '2026-0002',
    cycle: 2,
    cycleCourant: 2,
    famille: 'PAR_AGENT',
    motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
    motifLibelle: 'Piece justificative manquante',
    commentaire: 'Piece complementaire requise pour instruction.',
    statut: 'EN_ATTENTE_CORRECTION',
    pieceComplementaireRequise: true,
    dateCreation: '2026-11-05T00:00:00Z',
    dateReprise: null,
    dateAbandon: null,
    motifAbandon: null,
  },
  {
    id: 'lh-rejet-2',
    demandeId: 'lh-demande-3',
    numeroDemande: '2026-0003',
    cycle: 1,
    cycleCourant: 2,
    famille: 'PAR_AGENT',
    motifCode: 'INFORMATION_INCOMPLETE',
    motifLibelle: 'Information incomplete',
    commentaire: 'Informations comptables incompletes.',
    statut: 'CORRIGE',
    pieceComplementaireRequise: false,
    dateCreation: '2026-11-03T00:00:00Z',
    dateReprise: '2026-11-04T00:00:00Z',
    dateAbandon: null,
    motifAbandon: null,
  },
  {
    id: 'auto:lh-demande-4',
    demandeId: 'lh-demande-4',
    numeroDemande: '2026-0004',
    cycle: 1,
    cycleCourant: 1,
    famille: 'AUTOMATIQUE_CONFORMITE',
    motifCode: 'CONFORMITE_INCOMPLETE',
    motifLibelle: 'Conformite incomplete',
    commentaire: null,
    statut: 'CLOTURE_DEFINITIVE',
    pieceComplementaireRequise: false,
    dateCreation: '2026-11-02T00:00:00Z',
    dateReprise: null,
    dateAbandon: null,
    motifAbandon: null,
  },
];

@Component({
  selector: 'pdref-rejets-list-page',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    ConfirmDialogComponent,
    ConfirmDialogWithInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Rejets"
      subtitle="Rejets agent, reprises de cycle et abandons definitifs."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="stats" aria-label="Compteurs des rejets">
        <div class="pd-card stat">
          <span class="pd-label">En attente de correction</span>
          <strong>{{ page().enAttenteCorrectionCount }}</strong>
        </div>
        <div class="pd-card stat">
          <span class="pd-label">Corriges</span>
          <strong>{{ page().corrigeCount }}</strong>
        </div>
        <div class="pd-card stat">
          <span class="pd-label">Abandonnes</span>
          <strong>{{ page().abandonneCount }}</strong>
        </div>
      </section>

      <section class="pd-card">
        <div class="head">
          <h2>Dossiers rejetes</h2>
          <span class="pd-muted">{{ page().totalCount }} dossier(s)</span>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); load()">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              name="search"
              [value]="filters.search"
              (input)="onSearch($event)"
              placeholder="Numero de demande, motif"
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
          <label class="pd-field">
            <span class="pd-label">Famille</span>
            <select
              class="pd-input"
              name="famille"
              [value]="filters.famille"
              (change)="onFamille($event)"
            >
              <option value="">Toutes</option>
              @for (famille of familles; track famille.value) {
                <option [value]="famille.value">{{ famille.label }}</option>
              }
            </select>
          </label>
          <label class="pd-field">
            <span class="pd-label">Motif</span>
            <select
              class="pd-input"
              name="motifCode"
              [value]="filters.motifCode"
              (change)="onMotif($event)"
            >
              <option value="">Tous</option>
              @for (motif of motifs(); track motif.code) {
                <option [value]="motif.code">{{ motif.libelle }}</option>
              }
            </select>
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des rejets" />
        } @else if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun rejet"
            message="Aucun dossier ne correspond aux filtres."
          />
        } @else {
          <div class="table-wrap" tabindex="0" role="region" aria-label="Liste des rejets">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Famille</th>
                  <th>Cycle</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/rejets', item.id]">
                        {{ item.numeroDemande }}
                      </a>
                    </td>
                    <td>{{ familleLabel(item.famille) }}</td>
                    <td>{{ item.cycle }} / {{ item.cycleCourant }}</td>
                    <td>{{ item.motifLibelle }}</td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
                      @if (item.piecesRecues) {
                        <span class="pd-chip pieces-chip">Pièces reçues</span>
                      }
                    </td>
                    <td>{{ item.dateCreation | abidjanDate }}</td>
                    <td class="actions">
                      @if (canReprendre() && isActionable(item)) {
                        <button
                          type="button"
                          class="pd-btn pd-btn--primary pd-btn--sm"
                          (click)="askReprendre(item)"
                        >
                          Reprendre
                        </button>
                      }
                      @if (canAbandonner() && isActionable(item)) {
                        <button
                          type="button"
                          class="pd-btn pd-btn--danger pd-btn--sm"
                          (click)="askAbandon(item)"
                        >
                          Abandonner
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    }

    <pdref-confirm-dialog
      [open]="repriseOpen()"
      (openChange)="repriseOpen.set($event)"
      title="Reprendre le dossier"
      [message]="'Reprendre ' + (repriseTarget()?.numeroDemande || '') + ' au cycle suivant ?'"
      details="Le circuit sera rouvert a l'etape VERIF_GUDEF et les avis precedents seront conserves."
      confirmLabel="Reprendre"
      (confirmed)="confirmReprendre()"
      (cancelled)="closeReprise()"
    />

    <pdref-confirm-dialog-with-input
      [open]="abandonOpen()"
      (openChange)="abandonOpen.set($event)"
      title="Abandonner definitivement"
      [message]="
        'Abandonner ' + (abandonTarget()?.numeroDemande || '') + ' ? Cette action est terminale.'
      "
      inputLabel="Motif d'abandon"
      placeholder="Saisissez le motif d'abandon..."
      hint="Le motif est conserve dans l'historique du rejet."
      confirmLabel="Abandonner"
      [minLength]="10"
      [multiline]="true"
      (confirmed)="confirmAbandon($event)"
      (cancelled)="closeAbandon()"
    />
  `,
  styles: [
    `
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
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
      .table-wrap {
        overflow-x: auto;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pieces-chip {
        margin-left: 0.35rem;
        background: var(--pd-accent-soft, #e8f5e9);
      }
    `,
  ],
})
export class RejetsListPageComponent {
  private readonly gateway = inject(RejetGateway);
  private readonly permissions = inject(PermissionsService);

  readonly statuts = REJET_STATUTS;
  readonly familles = REJET_FAMILLES;
  readonly page = signal<RejetPage>({
    items: [],
    page: 1,
    pageSize: 50,
    totalCount: 0,
    enAttenteCorrectionCount: 0,
    corrigeCount: 0,
    abandonneCount: 0,
  });
  readonly motifs = signal<RejetMotif[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly repriseOpen = signal(false);
  readonly abandonOpen = signal(false);
  readonly repriseTarget = signal<RejetListItem | null>(null);
  readonly abandonTarget = signal<RejetListItem | null>(null);
  readonly busy = signal(false);
  readonly filters = { search: '', statut: '', famille: '', motifCode: '' };

  constructor() {
    if (isLighthouseEnabled()) {
      this.motifs.set(LIGHTHOUSE_MOTIFS);
      this.page.set({
        items: LIGHTHOUSE_ITEMS,
        page: 1,
        pageSize: 50,
        totalCount: LIGHTHOUSE_ITEMS.length,
        enAttenteCorrectionCount: 1,
        corrigeCount: 1,
        abandonneCount: 0,
      });
      this.loading.set(false);
      return;
    }

    this.loadMotifs();
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

  loadMotifs(): void {
    this.gateway.motifs().subscribe({
      next: (motifs) => this.motifs.set(motifs),
      error: () => this.motifs.set([]),
    });
  }

  onSearch(event: Event): void {
    this.filters.search = (event.target as HTMLInputElement).value;
  }

  onStatut(event: Event): void {
    this.filters.statut = (event.target as HTMLSelectElement).value;
  }

  onFamille(event: Event): void {
    this.filters.famille = (event.target as HTMLSelectElement).value;
  }

  onMotif(event: Event): void {
    this.filters.motifCode = (event.target as HTMLSelectElement).value;
  }

  canReprendre(): boolean {
    return this.permissions.hasPermission('Rejets_Reprendre');
  }

  canAbandonner(): boolean {
    return this.permissions.hasPermission('Rejets_Abandonner');
  }

  isActionable(item: RejetListItem): boolean {
    return item.famille === 'PAR_AGENT' && item.statut === 'EN_ATTENTE_CORRECTION';
  }

  askReprendre(item: RejetListItem): void {
    if (!this.canReprendre() || !this.isActionable(item)) {
      return;
    }
    this.repriseTarget.set(item);
    this.repriseOpen.set(true);
  }

  confirmReprendre(): void {
    const target = this.repriseTarget();
    if (!target || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.gateway.reprendre(target.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeReprise();
        this.load();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.closeReprise();
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  closeReprise(): void {
    this.repriseOpen.set(false);
    this.repriseTarget.set(null);
  }

  askAbandon(item: RejetListItem): void {
    if (!this.canAbandonner() || !this.isActionable(item)) {
      return;
    }
    this.abandonTarget.set(item);
    this.abandonOpen.set(true);
  }

  confirmAbandon(motif: string): void {
    const target = this.abandonTarget();
    if (!target || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.gateway.abandonner(target.id, motif).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeAbandon();
        this.load();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.closeAbandon();
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  closeAbandon(): void {
    this.abandonOpen.set(false);
    this.abandonTarget.set(null);
  }

  statutLabel(statut: string): string {
    return rejetStatutLabel(statut);
  }

  familleLabel(famille: string): string {
    return rejetFamilleLabel(famille);
  }
}

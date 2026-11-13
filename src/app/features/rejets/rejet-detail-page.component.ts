import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { RejetDetail } from '../../core/models/rejets/rejet.model';
import { ConfirmDialogComponent } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogWithInputComponent } from '../../core/components/confirm-dialog-with-input/confirm-dialog-with-input.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { rejetFamilleLabel, rejetStatutLabel } from './rejet-status';

const LIGHTHOUSE_DETAIL: RejetDetail = {
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
  pieceComplementaireFileId: null,
  dateCreation: '2026-11-05T00:00:00Z',
  dateReprise: null,
  reprisePar: null,
  dateAbandon: null,
  abandonnePar: null,
  motifAbandon: null,
  dateClotureDefinitive: null,
  historique: [
    {
      id: 'lh-rejet-0',
      cycle: 1,
      famille: 'PAR_AGENT',
      motifCode: 'INFORMATION_INCOMPLETE',
      motifLibelle: 'Information incomplete',
      statut: 'CORRIGE',
      dateCreation: '2026-11-01T00:00:00Z',
      dateReprise: '2026-11-02T00:00:00Z',
      dateAbandon: null,
    },
    {
      id: 'lh-rejet-1',
      cycle: 2,
      famille: 'PAR_AGENT',
      motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
      motifLibelle: 'Piece justificative manquante',
      statut: 'EN_ATTENTE_CORRECTION',
      dateCreation: '2026-11-05T00:00:00Z',
      dateReprise: null,
      dateAbandon: null,
    },
  ],
};

@Component({
  selector: 'pdref-rejet-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    SidePanelComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    ConfirmDialogComponent,
    ConfirmDialogWithInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-side-panel
      [open]="true"
      [title]="'Rejet - ' + (item()?.numeroDemande || '')"
      size="lg"
      (closeRequested)="close()"
    >
      @if (problem(); as issue) {
        <pdref-state-panel
          state="error"
          [problem]="issue"
          actionLabel="Reessayer"
          (retry)="load()"
        />
      } @else if (loading()) {
        <pdref-state-panel state="loading" title="Chargement du rejet" />
      } @else if (item(); as detail) {
        <div class="actions">
          @if (canReprendre() && isActionable(detail)) {
            <button type="button" class="pd-btn pd-btn--primary" (click)="repriseOpen.set(true)">
              Reprendre
            </button>
          }
          @if (canAbandonner() && isActionable(detail)) {
            <button type="button" class="pd-btn pd-btn--danger" (click)="abandonOpen.set(true)">
              Abandonner
            </button>
          }
          <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/rejets">Retour aux rejets</a>
        </div>

        <section class="pd-card summary">
          <div>
            <span class="pd-label">Demande</span><strong>{{ detail.numeroDemande }}</strong>
          </div>
          <div>
            <span class="pd-label">Famille</span><strong>{{ familleLabel(detail.famille) }}</strong>
          </div>
          <div>
            <span class="pd-label">Cycle du rejet</span><strong>{{ detail.cycle }}</strong>
          </div>
          <div>
            <span class="pd-label">Cycle courant</span><strong>{{ detail.cycleCourant }}</strong>
          </div>
          <div>
            <span class="pd-label">Statut</span><strong>{{ statutLabel(detail.statut) }}</strong>
          </div>
          <div>
            <span class="pd-label">Motif</span><strong>{{ detail.motifLibelle }}</strong>
          </div>
          <div>
            <span class="pd-label">Piece complementaire</span
            ><strong>{{ detail.pieceComplementaireRequise ? 'Requise' : 'Non requise' }}</strong>
          </div>
          <div>
            <span class="pd-label">Date du rejet</span
            ><strong>{{ detail.dateCreation | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Date de reprise</span
            ><strong>{{ detail.dateReprise | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Date d'abandon</span
            ><strong>{{ detail.dateAbandon | abidjanDate }}</strong>
          </div>
        </section>

        @if (detail.commentaire) {
          <section class="pd-card">
            <h2>Commentaire</h2>
            <p>{{ detail.commentaire }}</p>
          </section>
        }

        @if (detail.piecesContribuable?.length) {
          <section class="pd-card">
            <h2>Pièces reçues</h2>
            @for (envoi of detail.piecesContribuable; track envoi.id) {
              <article class="piece-depot">
                <strong>{{ envoi.createdAt | abidjanDate }}</strong>
                @if (envoi.message) {
                  <p>{{ envoi.message }}</p>
                }
                <ul>
                  @for (file of envoi.files; track file.fileGroupId) {
                    <li>{{ file.fileName }} ({{ file.sizeBytes }} octets)</li>
                  }
                </ul>
              </article>
            }
          </section>
        }

        @if (detail.motifAbandon) {
          <section class="pd-card">
            <h2>Motif d'abandon</h2>
            <p>{{ detail.motifAbandon }}</p>
          </section>
        }

        <section class="pd-card">
          <h2>Historique des cycles</h2>
          <div
            class="table-wrap"
            tabindex="0"
            role="region"
            aria-label="Historique des cycles de rejet"
          >
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Famille</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (cycle of detail.historique; track cycle.id) {
                  <tr>
                    <td>{{ cycle.cycle }}</td>
                    <td>{{ familleLabel(cycle.famille) }}</td>
                    <td>{{ cycle.motifLibelle }}</td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(cycle.statut) }}</span>
                    </td>
                    <td>{{ cycle.dateCreation | abidjanDate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </pdref-side-panel>

    <pdref-confirm-dialog
      [open]="repriseOpen()"
      (openChange)="repriseOpen.set($event)"
      title="Reprendre le dossier"
      message="Reprendre ce dossier au cycle suivant ?"
      details="Le circuit sera rouvert a l'etape VERIF_GUDEF et les avis precedents seront conserves."
      confirmLabel="Reprendre"
      (confirmed)="reprendre()"
    />

    <pdref-confirm-dialog-with-input
      [open]="abandonOpen()"
      (openChange)="abandonOpen.set($event)"
      title="Abandonner definitivement"
      message="Cette action est terminale. Confirmer l'abandon du dossier ?"
      inputLabel="Motif d'abandon"
      placeholder="Saisissez le motif d'abandon..."
      hint="Le motif est conserve dans l'historique du rejet."
      confirmLabel="Abandonner"
      [minLength]="10"
      [multiline]="true"
      (confirmed)="abandonner($event)"
    />
  `,
  styles: [
    `
      .actions,
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .actions {
        margin-bottom: 1rem;
      }
      .summary > div {
        display: grid;
        min-width: 11rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
      .piece-depot {
        border-top: 1px solid var(--pd-border);
        padding: 0.75rem 0;
      }
      .piece-depot:first-of-type {
        border-top: 0;
      }
      .piece-depot ul {
        margin: 0.5rem 0 0;
        padding-left: 1.25rem;
      }
    `,
  ],
})
export class RejetDetailPageComponent {
  private readonly gateway = inject(RejetGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsService);
  private readonly rejetId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<RejetDetail | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly repriseOpen = signal(false);
  readonly abandonOpen = signal(false);
  readonly busy = signal(false);

  constructor() {
    if (isLighthouseEnabled()) {
      this.item.set(LIGHTHOUSE_DETAIL);
      this.loading.set(false);
      return;
    }

    this.load();
  }

  close(): void {
    void this.router.navigate(['/dashboard/rejets']);
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.rejetId).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  canReprendre(): boolean {
    return this.permissions.hasPermission('Rejets_Reprendre');
  }

  canAbandonner(): boolean {
    return this.permissions.hasPermission('Rejets_Abandonner');
  }

  isActionable(item: RejetDetail): boolean {
    return item.famille === 'PAR_AGENT' && item.statut === 'EN_ATTENTE_CORRECTION';
  }

  reprendre(): void {
    if (!this.canReprendre() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.gateway.reprendre(this.rejetId).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.repriseOpen.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.repriseOpen.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  abandonner(motif: string): void {
    if (!this.canAbandonner() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.gateway.abandonner(this.rejetId, motif).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.abandonOpen.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.abandonOpen.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  statutLabel(statut: string): string {
    return rejetStatutLabel(statut);
  }

  familleLabel(famille: string): string {
    return rejetFamilleLabel(famille);
  }
}

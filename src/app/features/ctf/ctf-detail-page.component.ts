import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CtfDetail } from '../../core/models/ctf/ctf.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CtfGateway } from '../../core/services/ctf/ctf.gateway';
import { normalizeProblem } from '../../core/utils/problem';
import { ctfStatutLabel } from './ctf-status';

@Component({
  selector: 'pdref-ctf-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="'CTF - ' + (item()?.numeroDemande || '')"
      subtitle="Detail de l'autorisation de rectification."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de l'autorisation CTF" />
    } @else if (item(); as detail) {
      <div class="actions">
        @if (canActiver() && detail.statut === 'A_ACTIVER') {
          <button
            type="button"
            class="pd-btn pd-btn--primary"
            [disabled]="busy()"
            (click)="activer()"
          >
            Activer
          </button>
        }
        @if (
          canRetour() && (detail.statut === 'ACTIVEE' || detail.statut === 'CONTRIBUABLE_INFORME')
        ) {
          <button type="button" class="pd-btn pd-btn--ghost" [disabled]="busy()" (click)="retour()">
            Retour GUDEF
          </button>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/ctf/suivi">Retour au suivi</a>
      </div>

      <section class="pd-card summary">
        <div>
          <span class="pd-label">Demande</span><strong>{{ detail.numeroDemande }}</strong>
        </div>
        <div>
          <span class="pd-label">Contribuable</span><strong>{{ detail.raisonSociale }}</strong>
        </div>
        <div>
          <span class="pd-label">NCC</span><strong>{{ detail.ncc }}</strong>
        </div>
        <div>
          <span class="pd-label">Cycle</span><strong>{{ detail.cycle }}</strong>
        </div>
        <div>
          <span class="pd-label">Statut</span><strong>{{ statutLabel(detail.statut) }}</strong>
        </div>
        <div>
          <span class="pd-label">Activation</span
          ><strong>{{ detail.echeanceActivation | abidjanDate }}</strong>
        </div>
        <div>
          <span class="pd-label">Depot</span
          ><strong>{{ detail.echeanceDepot | abidjanDate }}</strong>
        </div>
        <div>
          <span class="pd-label">Delai depot</span
          ><strong>{{ detail.joursRestantsDepot }} JO</strong>
        </div>
        <div>
          <span class="pd-label">Courrier</span><strong>{{ detail.courrierId }}</strong>
        </div>
        <div>
          <span class="pd-label">Reference activation</span
          ><strong>{{ detail.referenceActivation || '-' }}</strong>
        </div>
        <div>
          <span class="pd-label">Retour GUDEF</span
          ><strong>{{ detail.dateRetourGudef | abidjanDate }}</strong>
        </div>
        <div>
          <span class="pd-label">Cloture</span
          ><strong>{{ detail.dateCloture | abidjanDate }}</strong>
        </div>
        <div>
          <span class="pd-label">Motif</span><strong>{{ detail.motifCloture || '-' }}</strong>
        </div>
        <div>
          <span class="pd-label">Tentatives</span><strong>{{ detail.tentatives }}</strong>
        </div>
      </section>

      @if (detail.derniereErreur) {
        <section class="pd-card">
          <h2>Derniere erreur</h2>
          <p class="pd-error">{{ detail.derniereErreur }}</p>
        </section>
      }
    }
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
    `,
  ],
})
export class CtfDetailPageComponent {
  private readonly gateway = inject(CtfGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionsService);
  private readonly demandeId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<CtfDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.demandeId).subscribe({
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

  canActiver(): boolean {
    return this.permissions.hasPermission('Ctf_Activer');
  }

  canRetour(): boolean {
    return this.permissions.hasPermission('Ctf_Retour');
  }

  activer(): void {
    if (this.busy() || !this.canActiver()) {
      return;
    }

    this.busy.set(true);
    this.gateway.activer(this.demandeId).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  retour(): void {
    if (this.busy() || !this.canRetour()) {
      return;
    }

    this.busy.set(true);
    this.gateway.retourGudef(this.demandeId).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  statutLabel(statut: string): string {
    return ctfStatutLabel(statut);
  }
}

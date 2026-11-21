import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CtfListItem } from '../../core/models/ctf/ctf.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CtfGateway } from '../../core/services/ctf/ctf.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
import type { IntegrationModes } from '../../core/models/integrations/integration.model';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { ctfStatutLabel } from './ctf-status';

const LIGHTHOUSE_ITEMS: CtfListItem[] = [
  {
    id: 'lh-ctf-1',
    demandeId: 'lh-demande-1',
    numeroDemande: '2026-0001',
    cycle: 1,
    ncc: '1234567A',
    raisonSociale: 'Client demonstration',
    statut: 'A_ACTIVER',
    dateCreation: '2026-11-05T00:00:00Z',
    echeanceActivation: '2026-11-12T00:00:00Z',
    echeanceDepot: '2026-11-26T00:00:00Z',
    joursRestantsActivation: 5,
    joursRestantsDepot: 15,
    motifCloture: null,
    dateCloture: null,
  },
];

@Component({
  selector: 'pdref-ctf-a-activer-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Autorisations a activer"
      subtitle="Autorisations de rectification en attente d'activation."
    />

    @if (modes()?.eImpots === 'MANUEL') {
      <p>
        <span class="pd-chip">Autorisation dans PDREF</span>
      </p>
      <p class="pd-muted">
        En mode manuel, ouvrez le dossier pour enregistrer la référence, la date d'activation et la
        preuve. Le bouton d activation automatique n'est pas utilise.
      </p>
    }
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="pd-card">
        <div class="head">
          <h2>Dossiers a autoriser</h2>
          <div class="head-actions">
            <span class="pd-muted">{{ items().length }} dossier(s)</span>
            <a class="pd-btn pd-btn--ghost pd-btn--sm" routerLink="/dashboard/ctf/suivi">
              Tous les dossiers CTF
            </a>
          </div>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); load()">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              name="search"
              [value]="filters.search"
              (input)="onSearch($event)"
              placeholder="Numéro, NCC ou raison sociale"
            />
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des autorisations" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune autorisation a activer"
            [message]="emptyMessage()"
          />
        } @else {
          <div
            class="table-wrap"
            tabindex="0"
            role="region"
            aria-label="Liste des autorisations a activer"
          >
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Contribuable</th>
                  <th>Cycle</th>
                  <th>Délai activation</th>
                  <th>Délai dépôt</th>
                  <th>Statut</th>
                  <th class="pd-col-actions"><span class="pd-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/ctf', item.demandeId]">
                        {{ item.numeroDemande }}
                      </a>
                    </td>
                    <td>
                      <strong>{{ item.raisonSociale }}</strong>
                      <div class="pd-muted">{{ item.ncc }}</div>
                    </td>
                    <td>{{ item.cycle }}</td>
                    <td>{{ item.joursRestantsActivation }} JO</td>
                    <td>{{ item.joursRestantsDepot }} JO</td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
                    </td>
                    <td class="pd-col-actions pd-col-actions--wide">
                      @if (manualEImpots()) {
                        <a
                          class="pd-btn pd-btn--primary pd-btn--sm"
                          [routerLink]="['/dashboard/ctf', item.demandeId]"
                        >
                          Enregistrer
                        </a>
                      } @else if (canActiver()) {
                        <button
                          type="button"
                          class="pd-btn pd-btn--primary pd-btn--sm"
                          [disabled]="isActivating(item.id)"
                          (click)="activer(item)"
                        >
                          {{ isActivating(item.id) ? 'Activation...' : 'Activer' }}
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
  `,
  styles: [
    `
      .head,
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
        justify-content: space-between;
      }
      .head-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .filters {
        justify-content: start;
        margin: 1rem 0;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class CtfAActiverPageComponent {
  private readonly gateway = inject(CtfGateway);
  private readonly integrations = inject(IntegrationGateway);
  private readonly permissions = inject(PermissionsService);

  readonly items = signal<CtfListItem[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly activating = signal<ReadonlySet<string>>(new Set());
  readonly modes = signal<IntegrationModes | null>(null);
  readonly filters = { search: '' };

  constructor() {
    if (isLighthouseEnabled()) {
      this.modes.set({ eImpots: 'MANUEL', signature: 'MANUEL' });
      this.items.set(LIGHTHOUSE_ITEMS);
      this.loading.set(false);
      return;
    }
    this.integrations.modes().subscribe({ next: (modes) => this.modes.set(modes) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.aActiver(this.filters).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  onSearch(event: Event): void {
    this.filters.search = (event.target as HTMLInputElement).value;
  }

  canActiver(): boolean {
    return this.permissions.hasPermission('Ctf_Activer');
  }

  manualEImpots(): boolean {
    return this.modes()?.eImpots === 'MANUEL';
  }

  emptyMessage(): string {
    if (this.filters.search.trim()) {
      return 'Aucun dossier ne correspond aux filtres.';
    }
    return this.manualEImpots()
      ? "Aucune autorisation en attente. La validation globale d'un dossier doit d'abord etre prononcee favorablement par le Sous-Directeur."
      : 'Aucune autorisation en attente.';
  }

  isActivating(id: string): boolean {
    return this.activating().has(id);
  }

  activer(item: CtfListItem): void {
    if (this.activating().has(item.id) || !this.canActiver()) {
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Activer la rectification ${item.numeroDemande} ?`)
    ) {
      return;
    }

    this.activating.update((current) => new Set(current).add(item.id));
    this.gateway.activer(item.demandeId).subscribe({
      next: () => {
        this.activating.update((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
        this.load();
      },
      error: (error: unknown) => {
        this.activating.update((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  statutLabel(statut: string): string {
    return ctfStatutLabel(statut);
  }
}

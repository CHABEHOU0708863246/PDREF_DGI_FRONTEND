import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CtfListItem } from '../../core/models/ctf/ctf.model';
import type { IntegrationModes } from '../../core/models/integrations/integration.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CtfGateway } from '../../core/services/ctf/ctf.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import { CTF_STATUTS, ctfStatutLabel } from './ctf-status';

const LIGHTHOUSE_ITEMS: CtfListItem[] = [
  {
    id: 'lh-ctf-1',
    demandeId: 'lh-demande-1',
    numeroDemande: '2026-0001',
    cycle: 1,
    ncc: '1234567A',
    raisonSociale: 'Client demonstration',
    statut: 'CONTRIBUABLE_INFORME',
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
  selector: 'pdref-ctf-suivi-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Suivi des autorisations"
      subtitle="Activations, retours GUDEF et clotures des rectifications."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="pd-card">
        <div class="head">
          <h2>Autorisations de rectification</h2>
          <span class="pd-muted">{{ items().length }} dossier(s)</span>
        </div>
        <form class="filters" (submit)="$event.preventDefault(); load()">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              name="search"
              [value]="filters.search"
              (input)="onSearch($event)"
              placeholder="Numero, NCC ou raison sociale"
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
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement du suivi des autorisations" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune autorisation"
            message="Aucun dossier ne correspond aux filtres."
          />
        } @else {
          <div
            class="table-wrap"
            tabindex="0"
            role="region"
            aria-label="Suivi des autorisations CTF"
          >
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Contribuable</th>
                  <th>Cycle</th>
                  <th>Echeance depot</th>
                  <th>Statut</th>
                  <th>Motif</th>
                  <th></th>
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
                    <td>
                      {{ item.echeanceDepot | abidjanDate }}
                      <div class="pd-muted">{{ item.joursRestantsDepot }} JO</div>
                    </td>
                    <td>
                      <span class="pd-chip">{{ statutLabel(item.statut) }}</span>
                    </td>
                    <td>{{ item.motifCloture || '-' }}</td>
                    <td class="actions">
                      @if (canActiver() && item.statut === 'A_ACTIVER') {
                        @if (manualEImpots()) {
                          <a
                            class="pd-btn pd-btn--ghost pd-btn--sm"
                            [routerLink]="['/dashboard/ctf', item.demandeId]"
                          >
                            Enregistrer
                          </a>
                        } @else {
                          <button
                            type="button"
                            class="pd-btn pd-btn--primary pd-btn--sm"
                            [disabled]="isActivating(item.id)"
                            (click)="activer(item)"
                          >
                            {{ isActivating(item.id) ? 'Activation...' : 'Activer' }}
                          </button>
                        }
                      }
                      @if (
                        canRetour() &&
                        (item.statut === 'ACTIVEE' || item.statut === 'CONTRIBUABLE_INFORME')
                      ) {
                        <button
                          type="button"
                          class="pd-btn pd-btn--ghost pd-btn--sm"
                          [disabled]="isReturning(item.id)"
                          (click)="retour(item)"
                        >
                          {{ isReturning(item.id) ? 'Retour...' : 'Retour GUDEF' }}
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
    `,
  ],
})
export class CtfSuiviPageComponent {
  private readonly gateway = inject(CtfGateway);
  private readonly integrations = inject(IntegrationGateway);
  private readonly permissions = inject(PermissionsService);

  readonly statuts = CTF_STATUTS;
  readonly items = signal<CtfListItem[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly activating = signal<ReadonlySet<string>>(new Set());
  readonly returning = signal<ReadonlySet<string>>(new Set());
  readonly modes = signal<IntegrationModes | null>(null);
  readonly filters = { search: '', statut: '' };

  constructor() {
    if (isLighthouseEnabled()) {
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
    this.gateway.list(this.filters).subscribe({
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

  onStatut(event: Event): void {
    this.filters.statut = (event.target as HTMLSelectElement).value;
  }

  canActiver(): boolean {
    return this.permissions.hasPermission('Ctf_Activer');
  }

  manualEImpots(): boolean {
    return this.modes()?.eImpots === 'MANUEL';
  }

  canRetour(): boolean {
    return this.permissions.hasPermission('Ctf_Retour');
  }

  isActivating(id: string): boolean {
    return this.activating().has(id);
  }

  isReturning(id: string): boolean {
    return this.returning().has(id);
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
        this.removeFrom(this.activating, item.id);
        this.load();
      },
      error: (error: unknown) => {
        this.removeFrom(this.activating, item.id);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  retour(item: CtfListItem): void {
    if (this.returning().has(item.id) || !this.canRetour()) {
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Confirmer le retour GUDEF de ${item.numeroDemande} ?`)
    ) {
      return;
    }

    this.returning.update((current) => new Set(current).add(item.id));
    this.gateway.retourGudef(item.demandeId).subscribe({
      next: () => {
        this.removeFrom(this.returning, item.id);
        this.load();
      },
      error: (error: unknown) => {
        this.removeFrom(this.returning, item.id);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  statutLabel(statut: string): string {
    return ctfStatutLabel(statut);
  }

  private removeFrom(target: WritableSignal<ReadonlySet<string>>, id: string): void {
    target.update((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }
}

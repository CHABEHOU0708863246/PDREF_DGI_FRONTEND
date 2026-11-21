import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  ImputationAgent,
  ImputationItem,
  ImputationPage,
} from '../../core/models/suivis/imputation.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { ImputationGateway } from '../../core/services/suivis/imputation.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-imputation-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Imputation GUDEF"
      subtitle="Distribution et suivi des dossiers de vérification."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      @if (notice()) {
        <p class="pd-card notice" role="status">{{ notice() }}</p>
      }

      @if (canImpute()) {
        <section class="pd-card distribuer" aria-label="A distribuer">
          <div class="head">
            <div>
              <h2>A distribuer</h2>
              <p class="pd-muted">{{ page().nonAttribues }} dossier(s) sans attribution.</p>
            </div>
            <label class="pd-field inline">
              <input type="checkbox" [checked]="aDistribuer()" (change)="onADistribuer($event)" />
              <span class="pd-label">A distribuer uniquement</span>
            </label>
          </div>
        </section>
      }

      @if (selected(); as current) {
        <section class="pd-card assign-panel" aria-label="Attribution">
          <h2>Attribuer {{ current.numero }}</h2>
          <div class="assign-form">
            <label class="pd-field">
              <span class="pd-label">Agent</span>
              <select class="pd-input" [value]="agentId()" (change)="onAgent($event)">
                <option value="">Selectionner</option>
                @for (agent of agents(); track agent.userId) {
                  <option [value]="agent.userId">{{ agent.displayName }}</option>
                }
              </select>
            </label>
            <label class="pd-field">
              <span class="pd-label">Instruction</span>
              <select class="pd-input" [value]="instruction()" (change)="onInstruction($event)">
                <option value="">Aucune</option>
                @for (item of instructions(); track item) {
                  <option [value]="item">{{ item }}</option>
                }
              </select>
            </label>
            <button
              type="button"
              class="pd-btn pd-btn--primary"
              [disabled]="!agentId() || busy()"
              (click)="assign()"
            >
              Attribuer / Réattribuer
            </button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="selected.set(null)">
              Annuler
            </button>
          </div>
        </section>
      }

      <section class="pd-card">
        <div class="head">
          <div>
            <h2>{{ canImpute() ? 'Dossiers de verification' : 'Mes dossiers a verifier' }}</h2>
            <p class="pd-muted">{{ page().totalCount }} dossier(s)</p>
          </div>
          <button type="button" class="pd-btn pd-btn--ghost" (click)="load()">Actualiser</button>
        </div>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des dossiers" />
        } @else if (page().items.length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun dossier"
            message="Aucun dossier ne correspond."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Contribuable</th>
                  <th>Échéance</th>
                  <th>Agent</th>
                  <th>Instruction</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of page().items; track item.demandeId) {
                  <tr>
                    <td>
                      <a class="pd-link" [routerLink]="['/dashboard/suivis', item.demandeId]">
                        {{ item.numero }}
                      </a>
                      @if (item.enRetard) {
                        <span class="pd-chip pd-chip--danger">En retard</span>
                      }
                    </td>
                    <td>
                      <strong>{{ item.contribuable }}</strong>
                      <div class="pd-muted">{{ item.ncc }}</div>
                    </td>
                    <td>{{ item.echeance ? (item.echeance | date: 'dd/MM/yyyy') : '-' }}</td>
                    <td>{{ item.assigneeName || 'A distribuer' }}</td>
                    <td>{{ item.instruction || '-' }}</td>
                    <td>
                      @if (canImpute()) {
                        <button
                          type="button"
                          class="pd-btn pd-btn--ghost pd-btn--sm"
                          (click)="select(item)"
                        >
                          {{ item.assigneeUserId ? 'Reattribuer' : 'Attribuer' }}
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
      .assign-form {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
        justify-content: space-between;
      }
      .head {
        margin-bottom: 1rem;
      }
      .assign-form {
        justify-content: start;
      }
      .inline {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .notice {
        margin-bottom: 1rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class ImputationPageComponent {
  private readonly gateway = inject(ImputationGateway);
  private readonly permissions = inject(PermissionsService);

  readonly page = signal<ImputationPage>({
    items: [],
    page: 1,
    pageSize: 50,
    totalCount: 0,
    nonAttribues: 0,
  });
  readonly agents = signal<ImputationAgent[]>([]);
  readonly instructions = signal<string[]>([]);
  readonly selected = signal<ImputationItem | null>(null);
  readonly agentId = signal('');
  readonly instruction = signal('');
  readonly aDistribuer = signal(false);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly notice = signal('');
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly canImpute = computed(() => this.permissions.hasPermission('Etapes_Imputer'));

  constructor() {
    this.load();
    if (this.canImpute()) {
      this.gateway
        .agents()
        .subscribe({ next: (items) => this.agents.set(items), error: () => this.agents.set([]) });
      this.gateway.instructions().subscribe({
        next: (items) => this.instructions.set(items),
        error: () => this.instructions.set([]),
      });
    }
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list({ aDistribuer: this.aDistribuer() }).subscribe({
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

  onADistribuer(event: Event): void {
    this.aDistribuer.set((event.target as HTMLInputElement).checked);
    this.load();
  }

  onAgent(event: Event): void {
    this.agentId.set((event.target as HTMLSelectElement).value);
  }

  onInstruction(event: Event): void {
    this.instruction.set((event.target as HTMLSelectElement).value);
  }

  select(item: ImputationItem): void {
    this.selected.set(item);
    this.agentId.set(item.assigneeUserId ?? '');
    this.instruction.set(item.instruction ?? '');
  }

  assign(): void {
    const item = this.selected();
    if (!item || !this.agentId() || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.gateway.assign(item.demandeId, this.agentId(), this.instruction()).subscribe({
      next: () => {
        this.busy.set(false);
        this.selected.set(null);
        this.notice.set('Dossier attribue.');
        this.load();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }
}

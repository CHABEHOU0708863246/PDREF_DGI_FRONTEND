import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { WorkflowDefinition } from '../../core/models/workflows/workflow.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { WorkflowsGateway } from '../../core/services/workflows/workflows.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

const LIGHTHOUSE_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'lh-workflow-1',
    code: 'parallele-v1',
    versionDef: 1,
    status: 'ACTIVE',
    name: 'Circuit parallele cible',
    description: 'Circuit de traitement des demandes de rectification.',
    sourceRef: 'REF-7',
    provisional: true,
    featureFlag: { key: 'workflow.variantes', enabled: false },
    steps: [
      {
        code: 'CONFORMITE_AUTO',
        name: 'Conformite automatique',
        kind: 'AUTO',
        orderNumber: 10,
        delayParameterKey: null,
        roleCodes: [],
        prerequisiteStepCodes: [],
        groupCode: null,
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'VERIF_GUDEF',
        name: 'Verification GUDEF',
        kind: 'LINEAIRE',
        orderNumber: 20,
        delayParameterKey: 'delais.verifGudefJO',
        roleCodes: ['AGENT_GUDEF'],
        prerequisiteStepCodes: ['CONFORMITE_AUTO'],
        groupCode: null,
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'AVIS_DERAR',
        name: 'Avis DERAR',
        kind: 'BRANCHE_PARALLELE',
        orderNumber: 30,
        delayParameterKey: 'delais.avisDirectionJO',
        roleCodes: ['DECIDEUR_DERAR'],
        prerequisiteStepCodes: ['VERIF_GUDEF'],
        groupCode: 'AVIS',
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'AVIS_DVFN',
        name: 'Avis DVFN',
        kind: 'BRANCHE_PARALLELE',
        orderNumber: 31,
        delayParameterKey: 'delais.avisDirectionJO',
        roleCodes: ['DECIDEUR_DVFN'],
        prerequisiteStepCodes: ['VERIF_GUDEF'],
        groupCode: 'AVIS',
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'AVIS_RATTACHEMENT',
        name: 'Avis rattachement',
        kind: 'BRANCHE_PARALLELE',
        orderNumber: 32,
        delayParameterKey: 'delais.avisDirectionJO',
        roleCodes: ['DIRECTEUR_RATTACHEMENT'],
        prerequisiteStepCodes: ['VERIF_GUDEF'],
        groupCode: 'AVIS',
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'VALIDATION_GLOBALE_GUDEF',
        name: 'Validation globale GUDEF',
        kind: 'LINEAIRE',
        orderNumber: 50,
        delayParameterKey: 'delais.validationGlobaleJO',
        roleCodes: ['SD_GUDEF'],
        prerequisiteStepCodes: [],
        groupCode: null,
        isTerminal: false,
        isEarlyExit: false,
      },
      {
        code: 'CLOTURE',
        name: 'Cloture',
        kind: 'TERMINAL',
        orderNumber: 80,
        delayParameterKey: null,
        roleCodes: [],
        prerequisiteStepCodes: ['DEPOT_CONTRIBUABLE'],
        groupCode: null,
        isTerminal: true,
        isEarlyExit: false,
      },
    ],
    joins: [
      {
        code: 'AVIS_JOIN',
        groupCode: 'AVIS',
        branchStepCodes: ['AVIS_DERAR', 'AVIS_DVFN', 'AVIS_RATTACHEMENT'],
        nextStepCode: 'VALIDATION_GLOBALE_GUDEF',
        nonFavorableStepCode: 'NON_FAVORABLE',
        stopAtFirstParameterKey: 'workflow.arretAuPremierNonFavorable',
      },
    ],
    createdAt: '2026-11-06T00:00:00Z',
    updatedAt: null,
    version: 1,
  },
];

@Component({
  selector: 'pdref-workflows-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Workflows"
      subtitle="Definitions versionnees du circuit de traitement."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else {
      <section class="pd-card workflows-card">
        <form class="filters" (ngSubmit)="load()">
          <label class="pd-field">
            <span class="pd-label">Statut</span>
            <select class="pd-input" [(ngModel)]="status" name="status">
              <option value="">Tous</option>
              <option value="ACTIVE">Actif</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="HISTORIQUE">Historique</option>
            </select>
          </label>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
          </div>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des workflows" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun workflow"
            message="Aucune definition ne correspond au filtre."
          />
        } @else {
          <div class="workflow-layout">
            <div class="workflow-list" role="list">
              @for (item of items(); track item.id) {
                <button
                  type="button"
                  class="workflow-item"
                  [class.workflow-item--selected]="selected()?.id === item.id"
                  role="listitem"
                  (click)="select(item)"
                >
                  <span class="workflow-item__title">{{ item.name }}</span>
                  <span class="workflow-item__meta">{{ item.code }} · v{{ item.versionDef }}</span>
                  <span class="pd-badge" [class.pd-badge--success]="item.status === 'ACTIVE'">
                    {{ statusLabel(item.status) }}
                  </span>
                </button>
              }
            </div>

            @if (selected(); as workflow) {
              <article class="pd-card workflow-detail">
                <div class="workflow-detail__head">
                  <div>
                    <h2>{{ workflow.name }}</h2>
                    <p class="pd-muted">{{ workflow.description || 'Aucune description.' }}</p>
                  </div>
                  <span class="pd-badge" [class.pd-badge--success]="workflow.status === 'ACTIVE'">
                    {{ statusLabel(workflow.status) }}
                  </span>
                </div>

                <dl class="workflow-meta">
                  <dt>Code</dt>
                  <dd>{{ workflow.code }}</dd>
                  <dt>Version</dt>
                  <dd>v{{ workflow.versionDef }}</dd>
                  <dt>Source</dt>
                  <dd>
                    {{ workflow.sourceRef || '-' }}
                    {{ workflow.provisional ? '(provisional)' : '' }}
                  </dd>
                  <dt>Feature flag</dt>
                  <dd>
                    {{ workflow.featureFlag.key }} :
                    {{ workflow.featureFlag.enabled ? 'actif' : 'desactive' }}
                  </dd>
                  <dt>Creee le</dt>
                  <dd>{{ workflow.createdAt | abidjanDate }}</dd>
                </dl>

                <h3>Etapes</h3>
                <div class="table-wrap" tabindex="0" role="region" aria-label="Etapes du workflow">
                  <table class="pd-table">
                    <thead>
                      <tr>
                        <th>Ordre</th>
                        <th>Code</th>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Delai</th>
                        <th>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (step of workflow.steps; track step.code) {
                        <tr>
                          <td>{{ step.orderNumber }}</td>
                          <td>{{ step.code }}</td>
                          <td>{{ step.name }}</td>
                          <td>{{ kindLabel(step.kind) }}</td>
                          <td>{{ step.delayParameterKey || '-' }}</td>
                          <td>{{ step.roleCodes.length ? step.roleCodes.join(', ') : '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (workflow.joins.length) {
                  <h3>Jointures</h3>
                  <div class="join-list">
                    @for (join of workflow.joins; track join.code) {
                      <article class="pd-card join-card">
                        <strong>{{ join.code }}</strong>
                        <span>Groupe : {{ join.groupCode }}</span>
                        <span>Branches : {{ join.branchStepCodes.join(' + ') }}</span>
                        <span>Favorable : {{ join.nextStepCode }}</span>
                        <span>Non favorable : {{ join.nonFavorableStepCode }}</span>
                        <span>Parametre : {{ join.stopAtFirstParameterKey }}</span>
                      </article>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }
      </section>
    }
  `,
  styleUrl: './workflows-page.component.scss',
})
export class WorkflowsPageComponent {
  private readonly gateway = inject(WorkflowsGateway);
  private readonly correlation = inject(CorrelationService);
  readonly items = signal<WorkflowDefinition[]>([]);
  readonly selected = signal<WorkflowDefinition | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  status = '';

  constructor() {
    this.load();
  }

  load(): void {
    if (isLighthouseEnabled()) {
      this.items.set(LIGHTHOUSE_WORKFLOWS);
      this.selected.set(LIGHTHOUSE_WORKFLOWS[0]);
      this.loading.set(false);
      this.problem.set(null);
      return;
    }

    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list(this.status || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.selected.set(items[0] ?? null);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  select(item: WorkflowDefinition): void {
    this.selected.set(item);
  }

  statusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Actif' : status === 'BROUILLON' ? 'Brouillon' : 'Historique';
  }

  kindLabel(kind: string): string {
    return kind
      .replace('LINEAIRE', 'Lineaire')
      .replace('BRANCHE_PARALLELE', 'Branche parallele')
      .replace('SORTIE_ANTICIPEE', 'Sortie anticipee')
      .replace('TERMINAL', 'Terminal')
      .replace('AUTO', 'Automatique');
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { PilotagePage } from '../../core/models/pilotage/pilotage.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { PilotageGateway } from '../../core/services/pilotage/pilotage.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-pilotage-list-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="title()"
      subtitle="Liste des dossiers correspondant au chiffre selectionne."
    />
    <div class="actions">
      <button type="button" class="pd-btn pd-btn--ghost" (click)="retour()">
        Retour au graphique
      </button>
      <span class="pd-muted">{{ page().totalCount }} dossier(s)</span>
    </div>
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement des dossiers" />
    } @else if (page().items.length === 0) {
      <pdref-state-panel
        state="empty"
        title="Aucun dossier"
        message="Aucun dossier ne correspond."
      />
    } @else {
      <section class="pd-card table-wrap">
        <table class="pd-table">
          <thead>
            <tr>
              <th>Demande</th>
              <th>Contribuable</th>
              <th>Statut</th>
              <th>Etape</th>
              <th>Depot</th>
            </tr>
          </thead>
          <tbody>
            @for (item of page().items; track item.demandeId) {
              <tr>
                <td>
                  <a class="pd-link" [routerLink]="['/dashboard/demandes', item.demandeId]">{{
                    item.numero
                  }}</a>
                </td>
                <td>
                  {{ item.contribuable }}
                  <div class="pd-muted">{{ item.ncc }}</div>
                </td>
                <td>{{ item.statut }}</td>
                <td>
                  {{ item.etapeCourante || '-' }}
                  @if (item.enRetard) {
                    <span class="pd-chip pd-chip--danger">En retard</span>
                  }
                </td>
                <td>{{ item.dateDepot ? (item.dateDepot | date: 'dd/MM/yyyy') : '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
  styles: [
    `
      .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class PilotageListPageComponent {
  private readonly gateway = inject(PilotageGateway);
  private readonly route = inject(ActivatedRoute);
  readonly page = signal<PilotagePage>({ items: [], page: 1, pageSize: 50, totalCount: 0 });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly title = signal('Dossiers');

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const source = params.get('source') ?? 'DASHBOARD';
    const metric = params.get('metric') ?? 'TOTAL';
    this.title.set(`${metric} · ${source}`);
    this.gateway
      .drilldown({
        source,
        metric,
        periode: params.get('periode') ?? undefined,
        statut: params.get('statut') ?? undefined,
        directionId: params.get('directionId') ?? undefined,
        type: params.get('type') ?? undefined,
        etape: params.get('etape') ?? undefined,
        agentUserId: params.get('agentUserId') ?? undefined,
        dateDu: params.get('dateDu') ?? undefined,
        dateAu: params.get('dateAu') ?? undefined,
        rapportType: params.get('rapportType') ?? undefined,
        dateReference: params.get('dateReference') ?? undefined,
        pageSize: 200,
      })
      .subscribe({
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

  load(): void {
    window.location.reload();
  }
  retour(): void {
    window.history.back();
  }
}

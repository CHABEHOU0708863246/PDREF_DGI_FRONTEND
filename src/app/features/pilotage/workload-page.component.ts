import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { Workload } from '../../core/models/pilotage/pilotage.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { PilotageGateway } from '../../core/services/pilotage/pilotage.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-workload-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Charge de travail"
      subtitle="Dossiers ouverts par agent et par direction."
    />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de la charge" />
    } @else {
      <section class="pd-card">
        <h2>Par agent</h2>
        <div class="table-wrap">
          <table class="pd-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Direction</th>
                <th>En cours</th>
                <th>En retard</th>
              </tr>
            </thead>
            <tbody>
              @for (item of workload().agents; track item.userId) {
                <tr>
                  <td>
                    <a
                      class="pd-link"
                      [routerLink]="['/dashboard/pilotage/dossiers']"
                      [queryParams]="{
                        source: 'WORKLOAD',
                        metric: 'AGENT',
                        agentUserId: item.userId,
                      }"
                      >{{ item.displayName }}</a
                    >
                  </td>
                  <td>{{ item.directionCode }}</td>
                  <td>{{ item.enCours }}</td>
                  <td>{{ item.enRetard }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <section class="pd-card">
        <h2>Par direction</h2>
        <div class="table-wrap">
          <table class="pd-table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>En cours</th>
                <th>En retard</th>
              </tr>
            </thead>
            <tbody>
              @for (item of workload().directions; track item.directionId) {
                <tr>
                  <td>
                    <a
                      class="pd-link"
                      [routerLink]="['/dashboard/pilotage/dossiers']"
                      [queryParams]="{
                        source: 'WORKLOAD',
                        metric: 'DIRECTION',
                        directionId: item.directionId,
                      }"
                      >{{ item.directionId }}</a
                    >
                  </td>
                  <td>{{ item.enCours }}</td>
                  <td>{{ item.enRetard }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class WorkloadPageComponent {
  private readonly gateway = inject(PilotageGateway);
  readonly workload = signal<Workload>({ agents: [], directions: [] });
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.gateway.workload().subscribe({
      next: (workload) => {
        this.workload.set(workload);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }
}

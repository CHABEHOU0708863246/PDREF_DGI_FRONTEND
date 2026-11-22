import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CourrierASigner } from '../../core/models/courriers/courrier.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-courriers-a-signer-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Courriers à signer"
      subtitle="Courriers de refus en attente de signature et de dépôt du PDF signe."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else {
      <section class="pd-card">
        <form class="filters" (ngSubmit)="load()">
          <label class="pd-field">
            <span class="pd-label">Recherche</span>
            <input
              class="pd-input"
              [(ngModel)]="search"
              name="search"
              placeholder="Numéro, objet ou contribuable"
            />
          </label>
          <button type="submit" class="pd-btn pd-btn--primary">Filtrer</button>
        </form>

        @if (loading()) {
          <pdref-state-panel state="loading" title="Chargement des courriers a signer" />
        } @else if (items().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucun courrier à signer"
            message="Aucun courrier de refus n'attend de signature."
          />
        } @else {
          <div class="table-wrap">
            <table class="pd-table">
              <caption>
                Courriers de refus en attente de signature
              </caption>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Demande</th>
                  <th>Contribuable</th>
                  <th>Décision</th>
                  <th>Délai</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.courrierId) {
                  <tr>
                    <td>{{ item.numero }}</td>
                    <td>{{ item.numeroDemande }}</td>
                    <td>{{ item.raisonSociale || '-' }}</td>
                    <td>{{ item.decisionLe | abidjanDate }}</td>
                    <td>
                      <span class="pd-chip" [class.pd-chip--danger]="item.joursDepuisDecision >= 5">
                        {{ item.joursDepuisDecision }} jour(s)
                      </span>
                    </td>
                    <td>
                      <a
                        class="pd-btn pd-btn--primary pd-btn--sm"
                        [routerLink]="['/dashboard/courriers', item.courrierId]"
                        >Déposer le PDF signé</a
                      >
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
      .filters {
        display: flex;
        gap: 1rem;
        align-items: end;
        margin-bottom: 1rem;
      }

      .table-wrap {
        overflow-x: auto;
      }

      @media (max-width: 720px) {
        .filters {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class CourriersASignerPageComponent {
  private readonly gateway = inject(CourriersGateway);
  readonly items = signal<CourrierASigner[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  search = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.aSigner(this.search).subscribe({
      next: (items) => {
        this.items.set([...items]);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }
}

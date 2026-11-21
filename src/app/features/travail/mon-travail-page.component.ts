import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OnInit } from '@angular/core';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { SuiviDossier } from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { normalizeProblem } from '../../core/utils/problem';
import { etapeLabel } from '../../core/utils/labels';

@Component({
  selector: 'pdref-mon-travail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      title="Mon travail"
      subtitle="Dossiers qui attendent une action de votre part."
    />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de votre travail" />
    } @else {
      <section class="pd-card">
        <table class="pd-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Contribuable</th>
              <th>Étape</th>
              <th>Prochaine action</th>
              <th>Date dépôt</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.demandeId) {
              <tr>
                <td>
                  <a class="pd-link" [routerLink]="['/dashboard/suivis', item.demandeId]">{{
                    item.numero
                  }}</a>
                </td>
                <td>{{ item.contribuable.raisonSociale }}</td>
                <td>{{ etapeLabel(item.etapeCourante, item.statut) }}</td>
                <td>{{ nextAction(item) }}</td>
                <td>{{ item.dateDepot | date: 'dd/MM/yyyy' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">Aucun dossier en attente.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class MonTravailPageComponent implements OnInit {
  readonly etapeLabel = etapeLabel;
  private readonly gateway = inject(SuivisGateway);
  readonly items = signal<SuiviDossier[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list({ page: 1, pageSize: 50 }).subscribe({
      next: (page) => {
        this.items.set(page.items.filter((item) => item.statut !== 'CLOTURE'));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  nextAction(item: SuiviDossier): string {
    const step = item.etapeCourante ?? '';
    if (step.includes('VERIF_GUDEF') || step === 'CONFORMITE_AUTO') return 'Verifier la demande';
    if (step.startsWith('AVIS_')) return 'Emettre un avis';
    if (step.includes('VALIDATION')) return 'Decider la validation globale';
    if (step.includes('CTF')) return 'Autoriser la rectification';
    if (item.statut === 'VALIDATION_POSEE') return 'Signer le courrier';
    return 'Consulter le dossier';
  }
}

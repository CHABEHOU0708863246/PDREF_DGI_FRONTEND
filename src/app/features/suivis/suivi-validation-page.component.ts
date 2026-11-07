import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { MotifNonFavorable, SuiviDetail } from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-suivi-validation-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="'Validation globale - ' + (item()?.numero || '')"
      subtitle="Decision du SD GUDEF apres jointure des trois avis."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de la validation" />
    } @else if (item(); as detail) {
      <section class="pd-card">
        <h2>Jointure des avis</h2>
        <div class="table-wrap">
          <table class="pd-table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>Statut</th>
                <th>Decision</th>
                <th>Emis le</th>
              </tr>
            </thead>
            <tbody>
              @for (avis of detail.avis; track avis.id) {
                <tr>
                  <td>{{ avis.directionCode }}</td>
                  <td>{{ avis.statut }}</td>
                  <td>
                    <span
                      class="pd-chip"
                      [class.pd-chip--danger]="avis.decision === 'NON_FAVORABLE'"
                    >
                      {{ avis.decision || '-' }}
                    </span>
                  </td>
                  <td>{{ avis.emisLe | abidjanDate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="pd-card">
        <h2>Decision globale</h2>
        <form class="form" (ngSubmit)="submit()">
          <label class="pd-field">
            <span class="pd-label">Decision</span>
            <select class="pd-input" [(ngModel)]="decision" name="decision">
              <option value="FAVORABLE">Favorable</option>
              <option value="NON_FAVORABLE">Non favorable</option>
            </select>
          </label>
          @if (decision === 'NON_FAVORABLE') {
            <label class="pd-field">
              <span class="pd-label">Motif</span>
              <select class="pd-input" [(ngModel)]="motifCode" name="motifCode">
                <option value="">Selectionner</option>
                @for (motif of motifs(); track motif.code) {
                  <option [value]="motif.code">{{ motif.libelle }}</option>
                }
              </select>
            </label>
          }
          <label class="pd-field">
            <span class="pd-label">Commentaire</span>
            <textarea
              class="pd-input"
              rows="3"
              [(ngModel)]="commentaire"
              name="commentaire"
            ></textarea>
          </label>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
              Valider
            </button>
            <a class="pd-btn pd-btn--ghost" [routerLink]="['/dashboard/suivis', detail.demandeId]"
              >Annuler</a
            >
          </div>
        </form>
      </section>
    }
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 0.85rem;
        max-width: 40rem;
      }
    `,
  ],
})
export class SuiviValidationPageComponent {
  private readonly gateway = inject(SuivisGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<SuiviDetail | null>(null);
  readonly motifs = signal<MotifNonFavorable[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  decision: 'FAVORABLE' | 'NON_FAVORABLE' = 'FAVORABLE';
  motifCode = '';
  commentaire = '';

  constructor() {
    this.load();
    this.gateway
      .motifs()
      .subscribe({ next: (items) => this.motifs.set(items), error: () => this.motifs.set([]) });
  }

  load(): void {
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
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

  submit(): void {
    if (this.decision === 'NON_FAVORABLE' && !this.motifCode) {
      return;
    }
    this.saving.set(true);
    this.gateway
      .decideValidation(this.id, {
        decision: this.decision,
        motifCode: this.motifCode || null,
        commentaire: this.commentaire || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigate(['/dashboard/suivis', this.id]);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.problem.set(normalizeProblem(error, null));
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { SuiviDetail } from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { normalizeProblem } from '../../core/utils/problem';
import { etapeLabel, decisionLabel } from '../../core/utils/labels';

@Component({
  selector: 'pdref-suivi-correction-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="'Correction - ' + (item()?.numero || '')"
      subtitle="Correction append-only d'une décision emise."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement des decisions" />
    } @else if (item(); as detail) {
      <section class="pd-card">
        <form class="form" (ngSubmit)="submit()">
          <label class="pd-field">
            <span class="pd-label">Décision a corriger</span>
            <select class="pd-input" [(ngModel)]="cible" name="cible" (ngModelChange)="onCible()">
              <option value="">Selectionner</option>
              @for (avis of detail.avis; track avis.id) {
                @if (avis.statut === 'EMIS') {
                  <option [value]="'AVIS|' + avis.id + '|' + avis.decision">
                    {{ etapeLabel(avis.etapeCode) }} - {{ decisionLabel(avis.decision) }}
                  </option>
                }
              }
              @if (detail.validationGlobale?.id) {
                <option
                  [value]="
                    'VALIDATION_GLOBALE|' +
                    detail.validationGlobale?.id +
                    '|' +
                    detail.validationGlobale?.decision
                  "
                >
                  Validation globale - {{ detail.validationGlobale?.decision }}
                </option>
              }
            </select>
          </label>
          <label class="pd-field">
            <span class="pd-label">Nouvelle décision</span>
            <select class="pd-input" [(ngModel)]="nouvelleDecision" name="nouvelleDecision">
              <option value="FAVORABLE">Favorable</option>
              <option value="NON_FAVORABLE">Non favorable</option>
            </select>
          </label>
          <section class="compare" aria-label="Comparaison avant après">
            <div>
              <span class="pd-label">Avant</span>
              <strong>{{ ancienneDecision() || '-' }}</strong>
              <span class="pd-muted">{{ cibleLabel() || 'Selectionner une decision' }}</span>
            </div>
            <div>
              <span class="pd-label">Après</span>
              <strong>{{ nouvelleDecision }}</strong>
              <span class="pd-muted">{{ motif || 'Motif a saisir' }}</span>
            </div>
          </section>
          <label class="pd-field">
            <span class="pd-label">Motif (10 caractères minimum)</span>
            <textarea class="pd-input" rows="3" [(ngModel)]="motif" name="motif"></textarea>
          </label>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
              Corriger
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
      .compare {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 0.75rem;
      }
      .compare > div {
        display: grid;
        gap: 0.25rem;
        border: 1px solid var(--pd-border, #d9dee8);
        border-radius: 0.5rem;
        padding: 0.75rem;
      }
    `,
  ],
})
export class SuiviCorrectionPageComponent {
  readonly etapeLabel = etapeLabel;
  readonly decisionLabel = decisionLabel;
  private readonly gateway = inject(SuivisGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<SuiviDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly ancienneDecision = signal<string | null>(null);
  readonly cibleLabel = signal('');
  cible = '';
  nouvelleDecision: 'FAVORABLE' | 'NON_FAVORABLE' = 'FAVORABLE';
  motif = '';

  constructor() {
    this.load();
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

  onCible(): void {
    const [type, id, decision] = this.cible.split('|');
    this.ancienneDecision.set(decision || null);
    this.cibleLabel.set(
      type === 'AVIS' ? `Avis ${id}` : type === 'VALIDATION_GLOBALE' ? 'Validation globale' : '',
    );
    if (decision === 'FAVORABLE') {
      this.nouvelleDecision = 'NON_FAVORABLE';
    } else if (decision === 'NON_FAVORABLE') {
      this.nouvelleDecision = 'FAVORABLE';
    }
  }

  submit(): void {
    const [cibleType, cibleId] = this.cible.split('|');
    if (!cibleType || !cibleId || this.motif.trim().length < 10) {
      return;
    }
    this.saving.set(true);
    this.gateway
      .correct(this.id, {
        cibleType: cibleType as 'AVIS' | 'VALIDATION_GLOBALE',
        cibleId,
        nouvelleDecision: this.nouvelleDecision,
        motif: this.motif.trim(),
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

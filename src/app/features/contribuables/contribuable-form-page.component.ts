import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { ContribuableWrite } from '../../core/models/contribuables/contribuable.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-contribuable-form-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, SidePanelComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header [title]="isEdit() ? 'Modifier le contribuable' : 'Nouveau contribuable'" />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de la fiche" />
    } @else {
      <pdref-side-panel
        [open]="true"
        [title]="isEdit() ? 'Modifier le contribuable' : 'Nouveau contribuable'"
        size="lg"
        (closeRequested)="cancel()"
      >
        <section class="pd-card form-card">
          @if (!form.email) {
            <p class="pd-warning" role="status">
              Notifications automatiques impossibles : aucun email renseigne.
            </p>
          }
          @if (!form.centreImpotId) {
            <p class="pd-warning" role="status">Le centre de rattachement est obligatoire.</p>
          }
          <form (ngSubmit)="save()">
            <div class="form-grid">
              <label class="pd-field"
                ><span class="pd-label">NCC *</span
                ><input
                  class="pd-input"
                  [(ngModel)]="form.ncc"
                  name="ncc"
                  [disabled]="isEdit()"
                  required
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Raison sociale *</span
                ><input
                  class="pd-input"
                  [(ngModel)]="form.raisonSociale"
                  name="raisonSociale"
                  required
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Systeme comptable *</span
                ><input
                  class="pd-input"
                  [(ngModel)]="form.systemeComptable"
                  name="systemeComptable"
                  required
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Centre de rattachement *</span
                ><input
                  class="pd-input"
                  [(ngModel)]="form.centreImpotId"
                  name="centreImpotId"
                  required
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Secteur</span
                ><input class="pd-input" [(ngModel)]="form.secteur" name="secteur"
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Forme juridique</span
                ><input class="pd-input" [(ngModel)]="form.formeJuridique" name="formeJuridique"
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Zone</span
                ><input class="pd-input" [(ngModel)]="form.zoneId" name="zoneId"
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Adresse</span
                ><input class="pd-input" [(ngModel)]="form.adresse" name="adresse"
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Email</span
                ><input class="pd-input" type="email" [(ngModel)]="form.email" name="email"
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Telephone</span
                ><input class="pd-input" [(ngModel)]="form.telephone" name="telephone"
              /></label>
            </div>
            <div class="pd-actions">
              <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
              <button type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">Annuler</button>
            </div>
          </form>
        </section>
      </pdref-side-panel>
    }
  `,
  styleUrl: './contribuable-form-page.component.scss',
})
export class ContribuableFormPageComponent {
  private readonly gateway = inject(ContribuablesGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly correlation = inject(CorrelationService);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(this.id !== null);
  readonly loading = signal(this.id !== null);
  readonly saving = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly form: ContribuableWrite = {
    ncc: '',
    raisonSociale: '',
    systemeComptable: '',
    centreImpotId: '',
  };

  constructor() {
    if (this.id) {
      this.load();
    }
  }

  load(): void {
    if (!this.id) {
      return;
    }
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        Object.assign(this.form, {
          ncc: item.ncc,
          raisonSociale: item.raisonSociale,
          systemeComptable: item.systemeComptable,
          centreImpotId: item.centreImpotId,
          secteur: item.secteur,
          formeJuridique: item.formeJuridique,
          zoneId: item.zoneId,
          adresse: item.adresse,
          email: null,
          telephone: null,
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  save(): void {
    if (
      !this.form.ncc ||
      !this.form.raisonSociale ||
      !this.form.systemeComptable ||
      !this.form.centreImpotId
    ) {
      this.problem.set({
        type: 'urn:pdref:error:VALIDATION_FAILED',
        code: 'VALIDATION_FAILED',
        title: 'Champs obligatoires',
        status: 400,
        traceId: '',
        errors: [],
      });
      return;
    }
    this.saving.set(true);
    const request =
      this.isEdit() && this.id
        ? this.gateway.update(this.id, this.form)
        : this.gateway.create(this.form);
    request.subscribe({
      next: (item) => {
        void this.router.navigate(['/dashboard/contribuables', item.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/dashboard/contribuables']);
  }
}

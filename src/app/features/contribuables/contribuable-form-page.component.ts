import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  CentreOption,
  ContribuableWrite,
} from '../../core/models/contribuables/contribuable.model';
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
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
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
          @if (centresProblem()) {
            <p class="pd-warning" role="status">
              {{ centresProblem() }}
              <button type="button" class="pd-btn pd-btn--ghost" (click)="loadCentres()">
                Réessayer
              </button>
            </p>
          }
          @if (!centresLoading() && centres().length === 0 && !centresProblem()) {
            <p class="pd-warning" role="status">
              Aucun centre de rattachement actif n'est disponible.
            </p>
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
                ><span class="pd-label">Système comptable *</span
                ><input
                  class="pd-input"
                  [(ngModel)]="form.systemeComptable"
                  name="systemeComptable"
                  required
              /></label>
              <label class="pd-field"
                ><span class="pd-label">Centre de rattachement *</span
                ><select
                  class="pd-input"
                  [(ngModel)]="form.centreImpotId"
                  name="centreImpotId"
                  [disabled]="centresLoading() || centres().length === 0"
                  required
                >
                  <option value="">Selectionner un centre</option>
                  @for (centre of centres(); track centre.id) {
                    <option [value]="centre.id">{{ centre.code }} - {{ centre.libelle }}</option>
                  }
                </select>
              </label>
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
              <label class="pd-field">
                <span class="pd-label">Téléphone</span>
                <div class="phone-input">
                  <span class="phone-input__prefix">+225</span>
                  <input
                    class="pd-input"
                    [(ngModel)]="telephoneLocal"
                    name="telephone"
                    type="tel"
                    inputmode="numeric"
                    placeholder="01 02 03 04 05"
                  />
                </div>
                <span class="pd-help">Le numéro est enregistré avec l'indicatif +225.</span>
              </label>
            </div>
            <div class="pd-actions">
              <button
                type="submit"
                class="pd-btn pd-btn--primary"
                [disabled]="saving() || centresLoading() || centres().length === 0"
              >
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
  readonly centres = signal<CentreOption[]>([]);
  readonly centresLoading = signal(true);
  readonly centresProblem = signal<string | null>(null);
  telephoneLocal = '';
  readonly form: ContribuableWrite = {
    ncc: '',
    raisonSociale: '',
    systemeComptable: '',
    centreImpotId: '',
  };

  constructor() {
    this.loadCentres();
    if (this.id) {
      this.load();
    }
  }

  loadCentres(): void {
    this.centresLoading.set(true);
    this.centresProblem.set(null);
    this.gateway.centres().subscribe({
      next: (items) => {
        this.centres.set(items);
        this.centresLoading.set(false);
      },
      error: () => {
        this.centresLoading.set(false);
        this.centresProblem.set('Impossible de charger les centres de rattachement.');
      },
    });
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
        this.telephoneLocal = localPhone(item.telephone);
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
    this.form.telephone = toInternationalPhone(this.telephoneLocal);
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

function toInternationalPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '').replace(/^00/, '');
  const local = digits.startsWith('225') ? digits.slice(3) : digits;
  return local.length > 0 ? `+225${local}` : null;
}

function localPhone(value: string | null): string {
  if (!value) {
    return '';
  }
  return value.replace(/\D/g, '').replace(/^225/, '');
}

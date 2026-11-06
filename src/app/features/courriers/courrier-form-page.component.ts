import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CourrierDetail, CourrierWrite } from '../../core/models/courriers/courrier.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ContribuableSelectComponent } from '../../core/components/contribuable-select/contribuable-select.component';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-courrier-form-page',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, StatePanelComponent, ContribuableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header [title]="isEdit() ? 'Modifier le courrier' : 'Nouveau courrier'" />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement du courrier" />
    } @else {
      <section class="pd-card form-card">
        <form (ngSubmit)="save()">
          <div class="form-grid">
            <label class="pd-field">
              <span class="pd-label">Type *</span>
              <select
                class="pd-input"
                [(ngModel)]="form.typeCourrier"
                name="typeCourrier"
                [disabled]="isEdit()"
              >
                <option value="COURRIER">Courrier</option>
                <option value="SIGICI">SIGICI</option>
              </select>
            </label>
            <label class="pd-field">
              <span class="pd-label">Sens *</span>
              <select class="pd-input" [(ngModel)]="form.sens" name="sens" [disabled]="isEdit()">
                <option value="ENTRANT">Entrant</option>
                <option value="SORTANT">Sortant</option>
              </select>
            </label>
            <label class="pd-field">
              <span class="pd-label">Numero *</span>
              <input
                class="pd-input"
                [(ngModel)]="form.numero"
                name="numero"
                [disabled]="isEdit()"
                required
              />
            </label>
            @if (isEdit()) {
              <div class="pd-field">
                <span class="pd-label">Imputation</span>
                <div class="readonly-value">GUDEF</div>
              </div>
            }
            @if (form.sens === 'ENTRANT') {
              <label class="pd-field">
                <span class="pd-label">Date d arrivee *</span>
                <input
                  class="pd-input"
                  type="date"
                  [(ngModel)]="form.dateArrivee"
                  name="dateArrivee"
                  required
                />
              </label>
            } @else {
              <label class="pd-field">
                <span class="pd-label">Date d emission *</span>
                <input
                  class="pd-input"
                  type="date"
                  [(ngModel)]="form.dateEmission"
                  name="dateEmission"
                  required
                />
              </label>
            }
            <label class="pd-field">
              <span class="pd-label">Expediteur *</span>
              <input
                class="pd-input"
                list="expediteurs"
                [(ngModel)]="form.expediteur"
                name="expediteur"
                (input)="onExpediteurInput($event)"
                required
              />
              <datalist id="expediteurs">
                @for (item of expediteurs(); track item) {
                  <option [value]="item"></option>
                }
              </datalist>
            </label>
            <label class="pd-field full">
              <span class="pd-label">Objet *</span>
              <input class="pd-input" [(ngModel)]="form.objet" name="objet" required />
            </label>
            <label class="pd-field full">
              <span class="pd-label">References</span>
              <textarea class="pd-input" [(ngModel)]="form.references" name="references"></textarea>
            </label>
            @if (!isEdit() && canLinkContribuable()) {
              <div class="pd-field full">
                <pdref-contribuable-select
                  label="Contribuable (optionnel)"
                  [(ngModel)]="form.contribuableId"
                  name="contribuableId"
                />
              </div>
            }
            @if (isEdit() && item()?.contribuable; as contribuable) {
              <div class="pd-field full">
                <span class="pd-label">Contribuable</span>
                <div class="readonly-value">
                  {{ contribuable.raisonSociale }} -
                  {{ contribuable.ncc || contribuable.nccMasque }}
                </div>
              </div>
            }
            @if (canInternal()) {
              <label class="pd-field full">
                <span class="pd-label">Instructions du Directeur (C3)</span>
                <textarea
                  class="pd-input"
                  [(ngModel)]="form.instructionsDirecteur"
                  name="instructionsDirecteur"
                ></textarea>
              </label>
              <label class="pd-field full">
                <span class="pd-label">Annotations SD-GUDEF (C3)</span>
                <textarea
                  class="pd-input"
                  [(ngModel)]="form.annotationsSdGudef"
                  name="annotationsSdGudef"
                ></textarea>
              </label>
            }
          </div>
          <div class="pd-actions">
            <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
              {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
            <button type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">Annuler</button>
          </div>
        </form>
      </section>
    }
  `,
  styleUrl: './courrier-form-page.component.scss',
})
export class CourrierFormPageComponent {
  private readonly gateway = inject(CourriersGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly expediteurSearch$ = new Subject<string>();
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(this.id !== null);
  readonly loading = signal(this.id !== null);
  readonly saving = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly item = signal<CourrierDetail | null>(null);
  readonly expediteurs = signal<readonly string[]>([]);
  readonly form: CourrierWrite = {
    sens: 'ENTRANT',
    typeCourrier: 'COURRIER',
    numero: '',
    dateArrivee: today(),
    dateEmission: null,
    references: '',
    expediteur: '',
    objet: '',
    instructionsDirecteur: null,
    annotationsSdGudef: null,
    contribuableId: null,
  };

  constructor() {
    this.expediteurSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.gateway.expediteurs(term)),
      )
      .subscribe((items) => this.expediteurs.set(items));
    if (this.id) {
      this.load();
    }
  }

  canInternal(): boolean {
    return this.permissions.hasPermission('Courriers_ReadInternal');
  }

  canLinkContribuable(): boolean {
    return this.permissions.hasPermission('Contribuables_Read');
  }

  load(): void {
    if (!this.id) {
      return;
    }
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        Object.assign(this.form, {
          sens: item.sens,
          typeCourrier: item.typeCourrier as CourrierWrite['typeCourrier'],
          numero: item.numero,
          dateArrivee: datePart(item.dateArrivee),
          dateEmission: datePart(item.dateEmission),
          references: item.references ?? '',
          expediteur: item.expediteur,
          objet: item.objet,
          instructionsDirecteur: item.instructionsDirecteur ?? '',
          annotationsSdGudef: item.annotationsSdGudef ?? '',
          contribuableId: item.contribuable?.id ?? null,
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  onExpediteurInput(event: Event): void {
    this.expediteurSearch$.next((event.target as HTMLInputElement).value);
  }

  save(): void {
    this.problem.set(null);
    const validation = this.validate();
    if (validation) {
      this.problem.set(validation);
      return;
    }

    this.saving.set(true);
    const request =
      this.isEdit() && this.id
        ? this.gateway.update(this.id, this.updatePayload())
        : this.gateway.create(this.createPayload());
    request.subscribe({
      next: (item) => void this.router.navigate(['/dashboard/courriers', item.id]),
      error: (error: unknown) => {
        this.saving.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/dashboard/courriers']);
  }

  private validate(): ApiProblemDetails | null {
    if (!this.form.numero || !this.form.expediteur || !this.form.objet) {
      return validation('Numero, expediteur et objet sont obligatoires.');
    }
    if (this.form.sens === 'ENTRANT' && !this.form.dateArrivee) {
      return validation('La date d arrivee est obligatoire.');
    }
    if (this.form.sens === 'SORTANT' && !this.form.dateEmission) {
      return validation('La date d emission est obligatoire.');
    }
    const selected = this.form.sens === 'ENTRANT' ? this.form.dateArrivee : this.form.dateEmission;
    if (selected && selected > today()) {
      return validation('Aucune date future n est autorisee.');
    }
    return null;
  }

  private createPayload(): CourrierWrite {
    return {
      ...this.form,
      dateArrivee: this.form.sens === 'ENTRANT' ? this.form.dateArrivee : null,
      dateEmission: this.form.sens === 'SORTANT' ? this.form.dateEmission : null,
    };
  }

  private updatePayload(): CourrierWrite {
    const payload: CourrierWrite = {
      dateArrivee: this.form.sens === 'ENTRANT' ? this.form.dateArrivee : null,
      dateEmission: this.form.sens === 'SORTANT' ? this.form.dateEmission : null,
      references: this.form.references,
      expediteur: this.form.expediteur,
      objet: this.form.objet,
    };
    if (this.canInternal()) {
      payload.instructionsDirecteur = this.form.instructionsDirecteur;
      payload.annotationsSdGudef = this.form.annotationsSdGudef;
    }
    return payload;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function datePart(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

function validation(message: string): ApiProblemDetails {
  return {
    type: 'urn:pdref:error:VALIDATION_FAILED',
    code: 'VALIDATION_FAILED',
    title: 'Champs obligatoires',
    status: 400,
    traceId: '',
    detail: message,
    errors: [],
  };
}

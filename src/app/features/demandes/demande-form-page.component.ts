import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  DemandeExerciceWrite,
  DemandeFormulaire,
  DemandeVariableWrite,
  DemandeWrite,
} from '../../core/models/demandes/demande.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { ContribuableSelectComponent } from '../../core/components/contribuable-select/contribuable-select.component';
import { CourrierSelectComponent } from '../../core/components/courrier-select/courrier-select.component';
import type { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { DemandesGateway } from '../../core/services/demandes/demandes.gateway';
import { AuthService } from '../../core/services/auth/auth.service';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

interface ExerciceForm {
  annee: number;
  touteLaLiasse: boolean;
  etatsFinanciers: string[];
  motifs: string[];
  precisions: Record<string, string>;
  variables: DemandeVariableWrite[];
}

const LIGHTHOUSE_FORM: DemandeFormulaire = {
  exercices: [
    { annee: 2026, libelle: 'Exercice 2026' },
    { annee: 2025, libelle: 'Exercice 2025' },
  ],
  etatsFinanciers: [
    { code: 'BILAN', libelle: 'Bilan' },
    { code: 'COMPTE_RESULTAT', libelle: 'Compte de résultat' },
  ],
  motifs: [
    { code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' },
    { code: 'FOND_AUTRES', libelle: 'Autres' },
  ],
  champsConformite: ['ncc', 'raisonSociale', 'centreRattachement', 'telephone', 'email'],
  variablesMax: 20,
  variablesMaxParExercice: 25,
  pdfMinimum: 1,
  plausibiliteSeuilPct: null,
};

@Component({
  selector: 'pdref-demande-form-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderComponent,
    SidePanelComponent,
    StatePanelComponent,
    ContribuableSelectComponent,
    CourrierSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header title="Nouvelle demande" subtitle="Déposer une demande de rectification." />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement du formulaire" />
    } @else {
      <pdref-side-panel
        [open]="true"
        [title]="isEdit() ? 'Modifier la demande' : 'Nouvelle demande'"
        size="xl"
        [dirty]="formDirty()"
        (closeRequested)="cancel()"
      >
        <form
          class="demande-form"
          (ngSubmit)="submit()"
          (input)="markDirty()"
          (change)="markDirty()"
        >
          <section class="pd-card">
            <h2>1. Contribuable et courrier</h2>
            <div class="form-grid">
              <div class="pd-field">
                <pdref-contribuable-select
                  [(ngModel)]="form.contribuableId"
                  name="contribuableId"
                  label="Contribuable *"
                />
              </div>
              <div class="pd-field">
                <pdref-courrier-select
                  [(ngModel)]="form.courrierId"
                  name="courrierId"
                  label="Courrier de dépôt *"
                />
              </div>
              <label class="pd-field">
                <span class="pd-label">Référence de dépôt</span>
                <input class="pd-input" [(ngModel)]="form.referenceDepot" name="referenceDepot" />
              </label>
              <div class="pd-field">
                <span class="pd-label">Date du jour</span>
                <strong>{{ today | date: 'dd/MM/yyyy' }}</strong>
              </div>
              <div class="pd-field">
                <span class="pd-label">Agent connecte</span>
                <strong>{{ auth.currentUser()?.displayName || '-' }}</strong>
              </div>
              <p class="pd-help">Direction deduite du centre de rattachement du contribuable.</p>
            </div>
          </section>

          <section class="pd-card">
            <div class="section-head">
              <h2>2. Exercices et périmètre</h2>
              <button
                type="button"
                class="pd-btn pd-btn--ghost pd-btn--sm"
                (click)="addExercice()"
                [disabled]="exercises.length >= 2"
              >
                Ajouter un exercice
              </button>
            </div>
            @for (exercise of exercises; track exercise.annee; let index = $index) {
              <article class="exercise-card">
                <div class="exercise-head">
                  <label class="pd-field">
                    <span class="pd-label">Exercice {{ index + 1 }} *</span>
                    <select class="pd-input" [(ngModel)]="exercise.annee" [name]="'annee' + index">
                      @for (year of options().exercices; track year.annee) {
                        <option [ngValue]="year.annee">{{ year.libelle }}</option>
                      }
                    </select>
                  </label>
                  <label class="check">
                    <input
                      type="checkbox"
                      [(ngModel)]="exercise.touteLaLiasse"
                      [name]="'liasse' + index"
                    />
                    Toute la liasse
                  </label>
                  @if (exercises.length > 1) {
                    <button
                      type="button"
                      class="pd-btn pd-btn--ghost pd-btn--sm"
                      (click)="removeExercice(index)"
                    >
                      Retirer
                    </button>
                  }
                </div>

                <div class="choice-grid">
                  <fieldset [disabled]="exercise.touteLaLiasse">
                    <legend>États financiers</legend>
                    @for (etat of options().etatsFinanciers; track etat.code) {
                      <label class="check">
                        <input
                          type="checkbox"
                          [checked]="exercise.etatsFinanciers.includes(etat.code)"
                          [disabled]="exercise.touteLaLiasse"
                          (change)="toggleEtat(exercise, etat.code, $event)"
                        />
                        {{ etat.libelle }}
                      </label>
                    }
                  </fieldset>
                  <fieldset>
                    <legend>Motifs *</legend>
                    @for (motif of options().motifs; track motif.code) {
                      <label class="check">
                        <input
                          type="checkbox"
                          [checked]="exercise.motifs.includes(motif.code)"
                          (change)="toggleMotif(exercise, motif.code, $event)"
                        />
                        {{ motif.libelle }}
                      </label>
                      @if (exercise.motifs.includes(motif.code) && isAutre(motif.code)) {
                        <input
                          class="pd-input precision"
                          [name]="'precision-' + index + '-' + motif.code"
                          [(ngModel)]="exercise.precisions[motif.code]"
                          placeholder="Précisez le motif *"
                        />
                      }
                    }
                  </fieldset>
                </div>
              </article>
            }
          </section>

          <section class="pd-card">
            <div class="section-head">
              <h2>3. Variables complémentaires</h2>
              <span class="pd-muted">{{ totalVariables() }} / {{ options().variablesMax }}</span>
            </div>
            @for (exercise of exercises; track exercise.annee; let exerciseIndex = $index) {
              <h3>Exercice {{ exercise.annee }}</h3>
              @for (variable of exercise.variables; track $index; let variableIndex = $index) {
                <div class="variable-row">
                  <input
                    class="pd-input"
                    [(ngModel)]="variable.code"
                    [name]="'code-' + exerciseIndex + '-' + variableIndex"
                    placeholder="Code"
                  />
                  <input
                    class="pd-input"
                    [(ngModel)]="variable.libelle"
                    [name]="'libelle-' + exerciseIndex + '-' + variableIndex"
                    placeholder="Libellé"
                  />
                  <select
                    class="pd-input"
                    [(ngModel)]="variable.type"
                    [name]="'type-' + exerciseIndex + '-' + variableIndex"
                  >
                    <option value="TEXTE">Texte</option>
                    <option value="MONTANT">Montant</option>
                  </select>
                  @if (variable.type === 'MONTANT') {
                    <input
                      class="pd-input"
                      type="number"
                      step="0.01"
                      [(ngModel)]="variable.montant"
                      [name]="'montant-' + exerciseIndex + '-' + variableIndex"
                      placeholder="Montant"
                    />
                  } @else {
                    <input
                      class="pd-input"
                      [(ngModel)]="variable.texte"
                      [name]="'texte-' + exerciseIndex + '-' + variableIndex"
                      placeholder="Valeur"
                    />
                  }
                  <button
                    type="button"
                    class="pd-btn pd-btn--ghost pd-btn--sm"
                    (click)="removeVariable(exercise, variableIndex)"
                  >
                    Supprimer
                  </button>
                </div>
              }
              <button
                type="button"
                class="pd-btn pd-btn--ghost pd-btn--sm"
                (click)="addVariable(exercise)"
                [disabled]="exercise.variables.length >= options().variablesMaxParExercice"
              >
                Ajouter une variable
              </button>
            }
          </section>

          <section class="pd-card">
            <h2>4. Conformité et engagements</h2>
            <p class="pd-muted">
              La conformité est contrôlée automatiquement Ã  partir de la fiche contribuable. Un
              dossier non conforme est rejeté et notifié.
            </p>
            <ul class="conformite-list">
              @for (field of options().champsConformite; track field) {
                <li>{{ fieldLabel(field) }}</li>
              }
            </ul>
            <p class="pd-muted">
              La demande doit contenir au moins {{ options().pdfMinimum }} PDF après dépôt.
            </p>
          </section>

          <section class="pd-card">
            <h2>5. Récapitulatif et pièce PDF</h2>
            <p>Exercices : {{ exerciseYears() }}</p>
            <label class="pd-field">
              <span class="pd-label">Pièce PDF obligatoire *</span>
              <input
                class="pd-input"
                type="file"
                accept="application/pdf"
                (change)="selectFile($event)"
                name="pieceJointe"
              />
            </label>
            <p class="pd-muted">Le numéro définitif est attribué dans la transaction de dépôt.</p>
            @if (validationMessage(); as message) {
              <p class="pd-error" role="alert">{{ message }}</p>
            }
            <div class="pd-actions">
              <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
                {{ saving() ? 'Dépôt en cours...' : 'Déposer la demande' }}
              </button>
              <button type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">Annuler</button>
            </div>
          </section>
        </form>
      </pdref-side-panel>
    }
  `,
  styleUrl: './demandes-page.component.scss',
})
export class DemandeFormPageComponent implements HasUnsavedChanges {
  private readonly gateway = inject(DemandesGateway);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEdit = signal(this.id !== null);
  readonly version = signal(0);
  readonly options = signal<DemandeFormulaire>(LIGHTHOUSE_FORM);
  readonly loading = signal(!isLighthouseEnabled());
  readonly saving = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly validationMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly auth = inject(AuthService);
  readonly today = new Date();
  readonly champsAcorriger = signal<string[]>([]);
  readonly exercises: ExerciceForm[] = [];
  readonly form: DemandeWrite = {
    contribuableId: null,
    courrierId: null,
    referenceDepot: null,
    brouillon: false,
    exercices: [],
  };
  private dirty = false;

  constructor() {
    if (isLighthouseEnabled()) {
      this.exercises.push(this.emptyExercise(2026), this.emptyExercise(2025));
      this.markDirty();
      return;
    }
    if (this.id) {
      this.loadForEdit();
    } else {
      this.load();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.dirty;
  }

  readonly formDirty = signal(false);

  markDirty(): void {
    this.dirty = true;
    this.formDirty.set(true);
  }

  load(): void {
    this.loading.set(true);
    this.gateway.formulaire().subscribe({
      next: (options) => {
        this.options.set(options);
        this.exercises.splice(0, this.exercises.length);
        const first = options.exercices[0]?.annee ?? new Date().getFullYear();
        const second = options.exercices[1]?.annee ?? first - 1;
        this.exercises.push(this.emptyExercise(first));
        if (options.exercices.length > 1) {
          this.exercises.push(this.emptyExercise(second));
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.setProblem(error);
      },
    });
  }

  loadForEdit(): void {
    if (!this.id) {
      return;
    }
    this.loading.set(true);
    this.gateway.formulaire().subscribe({
      next: (options) => {
        this.options.set(options);
        this.gateway.get(this.id!).subscribe({
          next: (demande) => {
            this.version.set(demande.version);
            this.form.contribuableId = demande.contribuable.id;
            this.form.courrierId = demande.courrierId;
            this.form.referenceDepot = demande.referenceDepot;
            this.exercises.splice(0, this.exercises.length);
            for (const exercice of demande.exercices) {
              const target = this.emptyExercise(exercice.annee);
              target.touteLaLiasse = exercice.touteLaLiasse;
              target.etatsFinanciers = exercice.etatsFinanciers.map((item) => item.code);
              target.motifs = exercice.motifs.map((item) => item.code);
              target.precisions = Object.fromEntries(
                exercice.motifs
                  .filter((item) => item.precision)
                  .map((item) => [item.code, item.precision!]),
              );
              target.variables = exercice.variables.map((item) => ({
                code: item.code,
                libelle: item.libelle,
                type: item.type,
                montant: item.montant ?? null,
                texte: item.texte ?? null,
              }));
              this.exercises.push(target);
            }
            this.loading.set(false);
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.setProblem(error);
          },
        });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.setProblem(error);
      },
    });
  }

  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    if (file && file.type !== 'application/pdf') {
      this.validationMessage.set('La pièce jointe doit être un PDF.');
    }
    this.markDirty();
  }

  addExercice(): void {
    if (this.exercises.length >= 2) {
      return;
    }
    const used = new Set(this.exercises.map((exercise) => exercise.annee));
    const next = this.options().exercices.find((year) => !used.has(year.annee));
    if (next) {
      this.exercises.push(this.emptyExercise(next.annee));
    }
  }

  removeExercice(index: number): void {
    if (this.exercises.length > 1) {
      this.exercises.splice(index, 1);
      this.markDirty();
    }
  }

  toggleEtat(exercise: ExerciceForm, code: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    exercise.etatsFinanciers = checked
      ? [...exercise.etatsFinanciers, code]
      : exercise.etatsFinanciers.filter((item) => item !== code);
    this.markDirty();
  }

  toggleMotif(exercise: ExerciceForm, code: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    exercise.motifs = checked
      ? [...exercise.motifs, code]
      : exercise.motifs.filter((item) => item !== code);
    if (!checked) {
      delete exercise.precisions[code];
    }
    this.markDirty();
  }

  isAutre(code: string): boolean {
    return code === 'AUTRE' || code === 'FOND_AUTRES';
  }

  addVariable(exercise: ExerciceForm): void {
    if (exercise.variables.length >= this.options().variablesMaxParExercice) {
      return;
    }
    exercise.variables.push({ code: '', libelle: '', type: 'TEXTE', texte: null, montant: null });
    this.markDirty();
  }

  removeVariable(exercise: ExerciceForm, index: number): void {
    exercise.variables.splice(index, 1);
    this.markDirty();
  }

  totalVariables(): number {
    return this.exercises.reduce((total, exercise) => total + exercise.variables.length, 0);
  }

  exerciseYears(): string {
    return this.exercises.map((exercise) => exercise.annee).join(', ');
  }

  fieldLabel(field: string): string {
    return (
      {
        ncc: 'NCC',
        raisonSociale: 'Raison sociale',
        centreRattachement: 'Centre de rattachement',
        telephone: 'Téléphone',
        email: 'Email',
      }[field] ?? field
    );
  }

  submit(): void {
    this.validationMessage.set(null);
    this.problem.set(null);
    const error = this.validate();
    if (error) {
      this.validationMessage.set(error);
      return;
    }

    this.saving.set(true);
    const request: DemandeWrite = {
      ...this.form,
      exercices: this.exercises.map((exercise) => this.toWrite(exercise)),
    };
    if (this.isEdit() && this.id) {
      this.gateway
        .update(this.id, { ...request, brouillon: false, deposer: false }, this.version())
        .subscribe({
          next: (item) => {
            this.dirty = false;
            this.formDirty.set(false);
            void this.router.navigate(['/dashboard/demandes', item.id]);
          },
          error: (error: unknown) => {
            this.saving.set(false);
            this.setProblem(error);
          },
        });
      return;
    }

    const file = this.selectedFile();
    this.gateway.create({ ...request, brouillon: true }).subscribe({
      next: (draft) => {
        if (!file) {
          this.saving.set(false);
          this.validationMessage.set('La pièce PDF est obligatoire.');
          return;
        }
        this.gateway.uploadAttachment(draft.id, file).subscribe({
          next: (progress) => {
            if (progress >= 100) {
              this.finalizeDeposit(draft.id, draft.version, request);
            }
          },
          error: (error: unknown) => {
            this.saving.set(false);
            this.setProblem(error);
            void this.router.navigate(['/dashboard/demandes', draft.id]);
          },
        });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.setProblem(error);
      },
    });
  }

  private finalizeDeposit(id: string, version: number, request: DemandeWrite): void {
    this.gateway.update(id, { ...request, brouillon: false, deposer: true }, version).subscribe({
      next: (item) => {
        this.dirty = false;
        this.formDirty.set(false);
        void this.router.navigate(['/dashboard/demandes', item.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.setProblem(error);
      },
    });
  }

  cancel(): void {
    this.dirty = false;
    this.formDirty.set(false);
    if (this.isEdit() && this.id) {
      void this.router.navigate(['/dashboard/demandes', this.id]);
      return;
    }
    void this.router.navigate(['/dashboard/demandes']);
  }

  private setProblem(error: unknown): void {
    const issue = normalizeProblem(error, this.correlation.last);
    this.problem.set(issue);
    const errors = issue.errors as Record<string, string[]> | undefined;
    this.champsAcorriger.set(errors ? Object.keys(errors) : []);
  }

  private validate(): string | null {
    if (!this.form.contribuableId) {
      return 'Le contribuable est obligatoire.';
    }
    if (!this.form.courrierId) {
      return 'Le courrier de dépôt est obligatoire pour un agent.';
    }
    if (this.exercises.length === 0) {
      return 'Au moins un exercice est obligatoire.';
    }
    if (this.totalVariables() > this.options().variablesMax) {
      return `Le nombre de variables ne peut dépasser ${this.options().variablesMax}.`;
    }
    if (!this.selectedFile()) {
      return 'La pièce PDF est obligatoire.';
    }
    if (this.selectedFile()?.type !== 'application/pdf') {
      return 'La pièce jointe doit être un PDF.';
    }
    for (const exercise of this.exercises) {
      if (!exercise.touteLaLiasse && exercise.etatsFinanciers.length === 0) {
        return `Sélectionnez au moins un état financier pour ${exercise.annee}.`;
      }
      if (exercise.motifs.length === 0) {
        return `Sélectionnez au moins un motif pour ${exercise.annee}.`;
      }
      if (
        exercise.motifs.some((code) => this.isAutre(code) && !exercise.precisions[code]?.trim())
      ) {
        return `Précisez le motif Autres pour ${exercise.annee}.`;
      }
    }
    return null;
  }

  private toWrite(exercise: ExerciceForm): DemandeExerciceWrite {
    return {
      annee: exercise.annee,
      touteLaLiasse: exercise.touteLaLiasse,
      etatsFinanciers: exercise.touteLaLiasse ? [] : exercise.etatsFinanciers,
      motifs: exercise.motifs.map((code) => ({
        code,
        precision: exercise.precisions[code] ?? null,
      })),
      variables: exercise.variables
        .filter((variable) => variable.code.trim() && variable.libelle.trim())
        .map((variable) => ({
          ...variable,
          montant: variable.type === 'MONTANT' ? variable.montant : null,
        })),
    };
  }

  private emptyExercise(annee: number): ExerciceForm {
    return {
      annee,
      touteLaLiasse: false,
      etatsFinanciers: [],
      motifs: [],
      precisions: {},
      variables: [],
    };
  }
}

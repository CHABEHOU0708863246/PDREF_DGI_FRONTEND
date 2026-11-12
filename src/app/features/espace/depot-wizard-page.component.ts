import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  DemandeExerciceWrite,
  DemandeFormulaire,
  DemandeVariableWrite,
} from '../../core/models/demandes/demande.model';
import type {
  DepotDepositResult,
  DepotDraft,
  DepotDraftRequest,
} from '../../core/models/depots/depot.model';
import type { FileGroup } from '../../core/models/files/file.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { DepotGateway } from '../../core/services/depots/depot.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

const ETAPES = [
  'Identification et exercices',
  'Etats financiers',
  'Motifs',
  'Variables',
  'Pieces et recapitulatif',
];

@Component({
  selector: 'pdref-depot-wizard-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  templateUrl: './depot-wizard-page.component.html',
  styleUrl: './depot-wizard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepotWizardPageComponent implements OnInit {
  private readonly gateway = inject(DepotGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly correlation = inject(CorrelationService);

  readonly etapes = ETAPES;
  readonly formulaire = signal<DemandeFormulaire | null>(null);
  readonly state = signal<DepotDraftRequest>({
    etape: 1,
    version: 0,
    referenceDepot: null,
    exercices: [],
  });
  readonly step = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busy = signal(false);
  readonly lastSaved = signal<string | null>(null);
  readonly saveProblem = signal<string | null>(null);
  readonly stepProblem = signal<string | null>(null);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly pieces = signal<FileGroup[]>([]);
  readonly deposited = signal<DepotDepositResult | null>(null);
  readonly id = signal<string | null>(null);
  readonly idempotencyKey = this.newIdempotencyKey();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private savePromise: Promise<boolean> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
    }

    if (isLighthouseEnabled()) {
      this.formulaire.set(this.demoFormulaire());
      this.state.set({
        etape: 2,
        version: 1,
        referenceDepot: null,
        exercices: [this.demoExercice(2025), this.demoExercice(2024)],
      });
      this.step.set(2);
      this.lastSaved.set(new Date().toISOString());
      this.loading.set(false);
      return;
    }

    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.problem.set(null);
    try {
      const formulaire = await firstValueFrom(this.gateway.formulaire());
      this.formulaire.set(formulaire);
      if (this.id()) {
        const draft = await firstValueFrom(this.gateway.draft(this.id()!));
        this.applyDraft(draft);
        await this.loadPieces();
      }
      this.loading.set(false);
    } catch (error: unknown) {
      this.loading.set(false);
      this.problem.set(normalizeProblem(error, this.correlation.last));
    }
  }

  stepLabel(index: number): string {
    return `${index + 1}. ${this.etapes[index]}`;
  }

  selectedYear(annee: number): boolean {
    return this.state().exercices.some((exercise) => exercise.annee === annee);
  }

  toggleYear(annee: number): void {
    const current = this.state().exercices;
    const exists = current.some((exercise) => exercise.annee === annee);
    if (exists) {
      this.state.update((value) => ({
        ...value,
        exercices: value.exercices.filter((exercise) => exercise.annee !== annee),
      }));
    } else if (current.length < 2) {
      this.state.update((value) => ({
        ...value,
        exercices: [...value.exercices, this.emptyExercice(annee)],
      }));
    }
    this.afterChange();
  }

  setTouteLaLiasse(index: number, checked: boolean): void {
    this.patchExercice(index, {
      touteLaLiasse: checked,
      etatsFinanciers: checked ? [] : this.exercice(index).etatsFinanciers,
    });
  }

  hasEtat(index: number, code: string): boolean {
    return this.exercice(index).etatsFinanciers.includes(code);
  }

  toggleEtat(index: number, code: string): void {
    if (this.exercice(index).touteLaLiasse) {
      return;
    }

    const current = this.exercice(index).etatsFinanciers;
    this.patchExercice(index, {
      etatsFinanciers: current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    });
  }

  hasMotif(index: number, code: string): boolean {
    return this.exercice(index).motifs.some((motif) => motif.code === code);
  }

  toggleMotif(index: number, code: string): void {
    const current = this.exercice(index).motifs;
    const exists = current.some((motif) => motif.code === code);
    this.patchExercice(index, {
      motifs: exists
        ? current.filter((motif) => motif.code !== code)
        : [...current, { code, precision: null }],
    });
  }

  motifPrecision(index: number, code: string): string {
    return this.exercice(index).motifs.find((motif) => motif.code === code)?.precision ?? '';
  }

  setMotifPrecision(index: number, code: string, precision: string): void {
    const current = this.exercice(index).motifs;
    this.patchExercice(index, {
      motifs: current.map((motif) =>
        motif.code === code ? { ...motif, precision: precision.trim() || null } : motif,
      ),
    });
  }

  addVariable(index: number): void {
    const max = this.formulaire()?.variablesMaxParExercice ?? 25;
    if (this.exercice(index).variables.length >= max) {
      this.stepProblem.set(`Un exercice ne peut contenir plus de ${max} variables.`);
      return;
    }

    this.patchExercice(index, {
      variables: [
        ...this.exercice(index).variables,
        { code: '', libelle: '', type: 'TEXTE', montant: null, texte: null },
      ],
    });
  }

  updateVariable(index: number, variableIndex: number, patch: Partial<DemandeVariableWrite>): void {
    const variables = this.exercice(index).variables.map((variable, position) =>
      position === variableIndex ? { ...variable, ...patch } : variable,
    );
    this.patchExercice(index, { variables });
  }

  removeVariable(index: number, variableIndex: number): void {
    this.patchExercice(index, {
      variables: this.exercice(index).variables.filter((_, position) => position !== variableIndex),
    });
  }

  variableType(index: number, variableIndex: number): 'TEXTE' | 'MONTANT' {
    return this.exercice(index).variables[variableIndex]?.type ?? 'TEXTE';
  }

  onVariableType(index: number, variableIndex: number, event: Event): void {
    const type = (event.target as HTMLSelectElement).value as 'TEXTE' | 'MONTANT';
    this.updateVariable(index, variableIndex, {
      type,
      montant:
        type === 'MONTANT' ? (this.exercice(index).variables[variableIndex]?.montant ?? 0) : null,
      texte: type === 'TEXTE' ? (this.exercice(index).variables[variableIndex]?.texte ?? '') : null,
    });
  }

  toNumber(value: string): number | null {
    return value === '' ? null : Number(value);
  }

  isAutre(code: string): boolean {
    return code === 'AUTRE' || code.endsWith('_AUTRES');
  }

  localIssue(): string | null {
    const step = this.step();
    if (step === 1) {
      const exercises = this.state().exercices;
      if (exercises.length === 0) return 'Selectionnez au moins un exercice.';
      if (exercises.length > 2) return 'Deux exercices au maximum.';
      if (exercises.length === 2) {
        const years = exercises.map((exercise) => exercise.annee).sort((a, b) => a - b);
        if (years[1] - years[0] !== 1) return 'Les deux exercices doivent etre N et N-1.';
      }
    }
    if (step === 2) {
      for (const exercise of this.state().exercices) {
        if (exercise.touteLaLiasse && exercise.etatsFinanciers.length > 0) {
          return 'Toute la liasse est exclusive des etats financiers.';
        }
        if (!exercise.touteLaLiasse && exercise.etatsFinanciers.length === 0) {
          return `Selectionnez au moins un etat financier pour ${exercise.annee}.`;
        }
      }
    }
    if (step === 3) {
      for (const exercise of this.state().exercices) {
        if (exercise.motifs.length === 0)
          return `Selectionnez au moins un motif pour ${exercise.annee}.`;
        if (exercise.motifs.some((motif) => this.isAutre(motif.code) && !motif.precision)) {
          return 'Une precision est obligatoire pour le motif Autres.';
        }
      }
    }
    if (step === 4) {
      const total = this.state().exercices.reduce(
        (sum, exercise) => sum + exercise.variables.length,
        0,
      );
      if (total > (this.formulaire()?.variablesMax ?? 20)) {
        return `Une demande ne peut contenir plus de ${this.formulaire()?.variablesMax ?? 20} variables.`;
      }
      for (const exercise of this.state().exercices) {
        for (const variable of exercise.variables) {
          if (!variable.code.trim() || !variable.libelle.trim())
            return 'Le code et le libelle de chaque variable sont obligatoires.';
          if (
            variable.type === 'MONTANT' &&
            (variable.montant === null || variable.montant === undefined)
          ) {
            return 'Le montant de chaque variable de type MONTANT est obligatoire.';
          }
        }
      }
    }
    return null;
  }

  async next(): Promise<void> {
    if (this.busy()) return;
    const issue = this.localIssue();
    this.stepProblem.set(issue);
    if (issue) return;
    if (!this.id() && !(await this.saveNow())) return;
    const id = this.id();
    if (!id) return;
    this.busy.set(true);
    try {
      const draft = await firstValueFrom(
        this.gateway.validateStep(id, this.step(), this.requestSnapshot()),
      );
      this.applyDraft(draft);
      if (this.step() < 5) {
        this.step.set(this.step() + 1);
        this.state.update((value) => ({ ...value, etape: this.step() }));
        await this.saveNow();
      }
      this.busy.set(false);
    } catch (error: unknown) {
      this.busy.set(false);
      const problem = normalizeProblem(error, this.correlation.last);
      this.stepProblem.set(problem.detail ?? problem.title);
    }
  }

  previous(): void {
    if (this.step() <= 1 || this.busy()) return;
    this.step.set(this.step() - 1);
    this.state.update((value) => ({ ...value, etape: this.step() }));
    this.stepProblem.set(null);
    this.afterChange();
  }

  async deposit(): Promise<void> {
    const id = this.id();
    if (!id || this.busy() || this.deposited()) return;
    const issue = this.localIssue();
    this.stepProblem.set(issue);
    if (issue) return;
    this.busy.set(true);
    try {
      await this.saveNow();
      const result = await firstValueFrom(this.gateway.deposit(id, this.idempotencyKey));
      this.deposited.set(result);
      this.stepProblem.set(null);
      this.busy.set(false);
    } catch (error: unknown) {
      this.busy.set(false);
      const problem = normalizeProblem(error, this.correlation.last);
      this.stepProblem.set(problem.detail ?? problem.title);
    }
  }

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.id();
    if (!file || !id || this.busy()) return;
    this.busy.set(true);
    this.gateway.uploadPiece(id, file).subscribe({
      next: () => {
        input.value = '';
        this.busy.set(false);
        void this.loadPieces();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        const problem = normalizeProblem(error, this.correlation.last);
        this.stepProblem.set(problem.detail ?? problem.title);
      },
    });
  }

  downloadAccuse(): void {
    const id = this.id();
    if (!id) return;
    this.gateway.accuse(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `accuse-${this.deposited()?.demande.numero ?? id}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => {
        const problem = normalizeProblem(error, this.correlation.last);
        this.stepProblem.set(problem.detail ?? problem.title);
      },
    });
  }

  private saveNow(): Promise<boolean> {
    if (this.savePromise) {
      return this.savePromise;
    }

    this.savePromise = this.performSave().finally(() => {
      this.savePromise = null;
    });
    return this.savePromise;
  }

  private async performSave(): Promise<boolean> {
    const request = this.requestSnapshot();
    if (!this.id() && request.exercices.length === 0) return false;
    this.saving.set(true);
    this.clearTimer();
    try {
      const creating = !this.id();
      const draft = creating
        ? await firstValueFrom(this.gateway.create(request))
        : await firstValueFrom(this.gateway.save(this.id()!, request));
      this.applyDraft(draft);
      this.saveProblem.set(null);
      if (creating) {
        await this.router.navigate(['/espace/depots', draft.id], { replaceUrl: true });
      }
      this.saving.set(false);
      return true;
    } catch (error: unknown) {
      this.saving.set(false);
      const problem = normalizeProblem(error, this.correlation.last);
      this.saveProblem.set(problem.detail ?? problem.title ?? 'Enregistrement impossible.');
      this.clearRetry();
      this.retryTimer = setTimeout(() => void this.saveNow(), 3000);
      return false;
    }
  }

  private applyDraft(draft: DepotDraft): void {
    this.id.set(draft.id);
    this.state.set({
      etape: draft.etape,
      version: draft.version,
      referenceDepot: draft.referenceDepot,
      exercices: draft.exercices,
    });
    this.step.set(draft.etape);
    this.lastSaved.set(draft.derniereSauvegarde ?? draft.updatedAt);
  }

  private async loadPieces(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      this.pieces.set(await firstValueFrom(this.gateway.pieces(id)));
    } catch {
      this.pieces.set([]);
    }
  }

  private requestSnapshot(): DepotDraftRequest {
    return {
      etape: this.step(),
      version: this.state().version,
      referenceDepot: this.state().referenceDepot,
      exercices: structuredClone(this.state().exercices),
    };
  }

  private afterChange(): void {
    this.stepProblem.set(null);
    this.clearTimer();
    this.timer = setTimeout(() => void this.saveNow(), 2000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private exercice(index: number): DemandeExerciceWrite {
    return this.state().exercices[index];
  }

  private patchExercice(index: number, patch: Partial<DemandeExerciceWrite>): void {
    this.state.update((value) => ({
      ...value,
      exercices: value.exercices.map((exercise, position) =>
        position === index ? { ...exercise, ...patch } : exercise,
      ),
    }));
    this.afterChange();
  }

  private emptyExercice(annee: number): DemandeExerciceWrite {
    return {
      annee,
      touteLaLiasse: false,
      etatsFinanciers: [],
      motifs: [],
      variables: [],
    };
  }

  private newIdempotencyKey(): string {
    return (
      globalThis.crypto?.randomUUID?.() ??
      `depot-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  }

  private demoFormulaire(): DemandeFormulaire {
    return {
      exercices: [
        { annee: 2025, libelle: 'Exercice 2025' },
        { annee: 2024, libelle: 'Exercice 2024' },
      ],
      etatsFinanciers: [
        { code: 'BILAN', libelle: 'Bilan' },
        { code: 'COMPTE_RESULTAT', libelle: 'Compte de resultat' },
      ],
      motifs: [
        { code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' },
        { code: 'FORME_AUTRES', libelle: 'Autres' },
      ],
      champsConformite: [],
      variablesMax: 20,
      variablesMaxParExercice: 25,
      pdfMinimum: 1,
      plausibiliteSeuilPct: null,
    };
  }

  private demoExercice(annee: number): DemandeExerciceWrite {
    return this.emptyExercice(annee);
  }
}

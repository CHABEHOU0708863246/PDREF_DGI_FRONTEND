import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../core/components/icon/icon.component';
import { RowActionsComponent } from '../../core/components/row-actions/row-actions.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import type { Observable } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import {
  DIRECTION_FUNCTIONS,
  LIST_CODES,
  type AdminScreen,
  type Direction,
  type FiscalYear,
  type NotificationTemplate,
  type PagedResult,
  type ParameterDefinition,
  type ParameterVersion,
  type ValueListItem,
} from '../../core/models/admin/admin.model';
import { AdminGateway } from '../../core/services/admin/admin.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

type AdminItem =
  Direction | FiscalYear | ValueListItem | ParameterDefinition | NotificationTemplate;

@Component({
  selector: 'pdref-admin-page',
  standalone: true,
  imports: [
    SlicePipe,
    ReactiveFormsModule,
    IconComponent,
    PageHeaderComponent,
    RowActionsComponent,
    SidePanelComponent,
    StatePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gateway = inject(AdminGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);

  readonly screen = this.route.snapshot.data['screen'] as AdminScreen;
  readonly listCodes = LIST_CODES;
  readonly functions = DIRECTION_FUNCTIONS;
  readonly items = signal<AdminItem[]>([]);
  readonly history = signal<ParameterVersion[]>([]);
  readonly selectedParameter = signal<ParameterDefinition | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 25;

  readonly title = computed(() => {
    switch (this.screen) {
      case 'directions':
        return 'Directions';
      case 'exercices':
        return 'Exercices fiscaux';
      case 'listes-valeurs':
        return 'Listes de valeurs';
      case 'parametres':
        return 'Paramètres';
      case 'modeles-notifications':
        return 'Modèles de notification';
    }
  });

  readonly description = computed(() => {
    switch (this.screen) {
      case 'directions':
        return 'Une seule direction active par fonction GUDEF, DERAR, DVFN, CTF et DG.';
      case 'exercices':
        return 'Plusieurs exercices peuvent être actifs en même temps.';
      case 'listes-valeurs':
        return 'Les valeurs legacy restent visibles mais ne sont pas selectionnables.';
      case 'parametres':
        return 'Chaque changement cree une nouvelle version datee ; aucune valeur n’est ecrasee.';
      case 'modeles-notifications':
        return 'Donnees uniquement : aucun envoi n’est declenche depuis cet ecran.';
    }
  });

  readonly canManage = computed(() => {
    const permission =
      this.screen === 'directions'
        ? 'Directions_Manage'
        : this.screen === 'exercices'
          ? 'Exercices_Manage'
          : this.screen === 'listes-valeurs'
            ? 'Listes_Manage'
            : this.screen === 'parametres'
              ? 'Parametres_Manage'
              : 'ModelesNotifications_Manage';
    return this.permissions.hasPermission(permission);
  });

  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    listeCode: new FormControl('', { nonNullable: true }),
    active: new FormControl('', { nonNullable: true }),
    legacy: new FormControl('', { nonNullable: true }),
  });

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    libelle: new FormControl('', { nonNullable: true }),
    type: new FormControl('', { nonNullable: true }),
    fonctionCircuit: new FormControl('', { nonNullable: true }),
    parentDirectionCode: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true }),
    annee: new FormControl(2026, { nonNullable: true }),
    dateOuverture: new FormControl('', { nonNullable: true }),
    dateCloture: new FormControl('', { nonNullable: true }),
    listeCode: new FormControl(LIST_CODES[0].code, { nonNullable: true }),
    ordre: new FormControl(1, { nonNullable: true }),
    legacy: new FormControl(false, { nonNullable: true }),
    valeurJson: new FormControl('', { nonNullable: true }),
    effectiveFrom: new FormControl('', { nonNullable: true }),
    motif: new FormControl('', { nonNullable: true }),
    canal: new FormControl('EMAIL', { nonNullable: true }),
    langue: new FormControl('fr', { nonNullable: true }),
    sujet: new FormControl('', { nonNullable: true }),
    corps: new FormControl('', { nonNullable: true }),
    statut: new FormControl('BROUILLON', { nonNullable: true }),
    variables: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.problem.set(null);
    this.page.set(page);
    const query = {
      page,
      pageSize: this.pageSize,
      search: this.filters.controls.search.value || undefined,
      listeCode: this.filters.controls.listeCode.value || undefined,
      isActive: this.filters.controls.active.value
        ? this.filters.controls.active.value === 'true'
        : undefined,
      legacy: this.filters.controls.legacy.value
        ? this.filters.controls.legacy.value === 'true'
        : undefined,
    };

    const request = (
      this.screen === 'directions'
        ? this.gateway.directions(query)
        : this.screen === 'exercices'
          ? this.gateway.fiscalYears(query)
          : this.screen === 'listes-valeurs'
            ? this.gateway.values(query)
            : this.screen === 'parametres'
              ? this.gateway.parameters(query)
              : this.gateway.templates(query)
    ) as Observable<PagedResult<AdminItem>>;

    request.subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  reset(): void {
    this.filters.reset({ search: '', listeCode: '', active: '', legacy: '' });
    this.load(1);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      code: '',
      libelle: '',
      type: '',
      fonctionCircuit: '',
      parentDirectionCode: '',
      email: '',
      telephone: '',
      adresse: '',
      annee: new Date().getFullYear(),
      dateOuverture: '',
      dateCloture: '',
      listeCode: LIST_CODES[0].code,
      ordre: 1,
      legacy: false,
      valeurJson: '',
      effectiveFrom: '',
      motif: '',
      canal: 'EMAIL',
      langue: 'fr',
      sujet: '',
      corps: '',
      statut: 'BROUILLON',
      variables: '',
    });
    this.selectedParameter.set(null);
    this.history.set([]);
    this.showForm.set(true);
  }

  edit(
    item: Direction | FiscalYear | ValueListItem | ParameterDefinition | NotificationTemplate,
  ): void {
    this.editingId.set(item.id);
    this.showForm.set(true);
    const patch = this.toPatch(item);
    this.form.patchValue(patch);
    if ('cle' in item) {
      this.selectParameter(item);
    }
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.problem.set(null);
  }

  submit(): void {
    this.saving.set(true);
    this.problem.set(null);
    const value = this.form.getRawValue();
    const id = this.editingId();
    const request = this.buildRequest(value);

    const operation =
      this.screen === 'directions'
        ? id
          ? this.gateway.updateDirection(id, request)
          : this.gateway.createDirection(request)
        : this.screen === 'exercices'
          ? id
            ? this.gateway.updateFiscalYear(id, request)
            : this.gateway.createFiscalYear(request)
          : this.screen === 'listes-valeurs'
            ? id
              ? this.gateway.updateValue(id, request)
              : this.gateway.createValue(request)
            : this.screen === 'parametres'
              ? this.gateway.createParameterVersion(this.selectedParameter()?.cle ?? '', request)
              : id
                ? this.gateway.updateTemplate(id, request)
                : this.gateway.createTemplate(request);

    (operation as Observable<unknown>).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.load(this.page());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  toggle(item: AdminItem): void {
    if (!('isActive' in item) && !('statut' in item)) {
      return;
    }
    if (!this.canManage()) {
      return;
    }
    const active = 'isActive' in item ? item.isActive : item.statut === 'ACTIVE';
    const reason =
      active && (this.screen === 'directions' || this.screen === 'listes-valeurs')
        ? 'Desactivation administrative.'
        : 'Activation administrative.';
    if (this.screen === 'directions') {
      this.gateway.setDirectionActive(item.id, !active, reason).subscribe({
        next: () => this.load(this.page()),
        error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
      });
    } else if (this.screen === 'exercices') {
      this.gateway.setFiscalYearActive(item.id, !active, reason).subscribe({
        next: () => this.load(this.page()),
        error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
      });
    } else if (this.screen === 'listes-valeurs') {
      this.gateway.setValueActive(item.id, !active, reason).subscribe({
        next: () => this.load(this.page()),
        error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
      });
    }
  }

  selectParameter(item: ParameterDefinition): void {
    this.selectedParameter.set(item);
    this.gateway.parameterHistory(item.cle).subscribe({
      next: (history) => this.history.set(history),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  formatValue(item: ParameterDefinition): string {
    const value = item.currentVersion?.valeurJson;
    if (!value) {
      return 'Non fourni';
    }
    return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.load(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() * this.pageSize < this.total()) {
      this.load(this.page() + 1);
    }
  }

  private buildRequest(value: ReturnType<typeof this.form.getRawValue>): unknown {
    switch (this.screen) {
      case 'directions':
        return {
          code: value.code,
          libelle: value.libelle,
          type: value.type || null,
          fonctionCircuit: value.fonctionCircuit || null,
          parentDirectionCode: value.parentDirectionCode || null,
          email: value.email || null,
          telephone: value.telephone || null,
          adresse: value.adresse || null,
          isActive: true,
        };
      case 'exercices':
        return {
          annee: Number(value.annee),
          libelle: value.libelle,
          dateOuverture: value.dateOuverture,
          dateCloture: value.dateCloture,
          isActive: false,
        };
      case 'listes-valeurs':
        return {
          listeCode: value.listeCode,
          code: value.code,
          libelle: value.libelle,
          ordre: Number(value.ordre),
          isActive: true,
          legacy: value.legacy,
        };
      case 'parametres':
        return {
          valeurJson: value.valeurJson,
          effectiveFrom: value.effectiveFrom,
          motifChangement: value.motif,
        };
      case 'modeles-notifications':
        return {
          code: value.code,
          canal: value.canal,
          langue: value.langue,
          sujet: value.sujet,
          corps: value.corps,
          variablesAutorisees: value.variables
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          statut: value.statut,
        };
    }
  }

  private toPatch(
    item: Direction | FiscalYear | ValueListItem | ParameterDefinition | NotificationTemplate,
  ): Record<string, unknown> {
    if ('fonctionCircuit' in item) {
      return {
        code: item.code,
        libelle: item.libelle,
        type: item.type ?? '',
        fonctionCircuit: item.fonctionCircuit ?? '',
        parentDirectionCode: item.parentDirectionCode ?? '',
        email: item.email ?? '',
        telephone: item.telephone ?? '',
        adresse: item.adresse ?? '',
      };
    }
    if ('annee' in item) {
      return {
        annee: item.annee,
        libelle: item.libelle,
        dateOuverture: item.dateOuverture.slice(0, 10),
        dateCloture: item.dateCloture.slice(0, 10),
      };
    }
    if ('listeCode' in item) {
      return {
        listeCode: item.listeCode,
        code: item.code,
        libelle: item.libelle,
        ordre: item.ordre,
        legacy: item.legacy,
      };
    }
    if ('canal' in item) {
      return {
        code: item.code,
        canal: item.canal,
        langue: item.langue,
        sujet: item.sujet,
        corps: item.corps,
        variables: item.variablesAutorisees.join(', '),
        statut: item.statut,
      };
    }
    return { code: '', valeurJson: item.currentVersion?.valeurJson ?? '', motif: '' };
  }
}

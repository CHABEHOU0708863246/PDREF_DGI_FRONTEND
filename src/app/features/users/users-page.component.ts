import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, type Observable } from 'rxjs';
import { ConfirmDialogWithInputComponent } from '../../core/components/confirm-dialog-with-input/confirm-dialog-with-input.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { IconComponent } from '../../core/components/icon/icon.component';
import { RowActionsComponent } from '../../core/components/row-actions/row-actions.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { Direction } from '../../core/models/admin/admin.model';
import type { AdminRole, AdminUser } from '../../core/models/identity/identity-admin.model';
import { AdminGateway } from '../../core/services/admin/admin.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { IdentityAdminGateway } from '../../core/services/identity/identity-admin.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-users-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    IconComponent,
    RowActionsComponent,
    SidePanelComponent,
    StatePanelComponent,
    ConfirmDialogWithInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent {
  private readonly gateway = inject(IdentityAdminGateway);
  private readonly admin = inject(AdminGateway);
  private readonly correlation = inject(CorrelationService);

  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<AdminRole[]>([]);
  readonly directions = signal<Direction[]>([]);
  readonly selectedRoles = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editing = signal<AdminUser | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 25;
  readonly resetMfaOpen = signal(false);
  readonly resetMfaTarget = signal<AdminUser | null>(null);
  readonly unlockOpen = signal(false);
  readonly unlockTarget = signal<AdminUser | null>(null);

  readonly title = computed(() =>
    this.editing() ? 'Modifier un utilisateur' : 'Nouvel utilisateur',
  );

  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    role: new FormControl('', { nonNullable: true }),
    directionId: new FormControl('', { nonNullable: true }),
    active: new FormControl('', { nonNullable: true }),
  });

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    matricule: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fonction: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    directionId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.loadOptions();
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    this.gateway
      .users({
        search: this.filters.controls.search.value || undefined,
        role: this.filters.controls.role.value || undefined,
        directionId: this.filters.controls.directionId.value || undefined,
        isActive: this.filters.controls.active.value
          ? this.filters.controls.active.value === 'true'
          : undefined,
        page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.users.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.error.set(normalizeProblem(error, this.correlation.last));
        },
      });
  }

  reset(): void {
    this.filters.reset({ search: '', role: '', directionId: '', active: '' });
    this.load(1);
  }

  openCreate(): void {
    this.editing.set(null);
    this.selectedRoles.set([]);
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      matricule: '',
      fonction: '',
      directionId: '',
    });
    this.showForm.set(true);
    this.notice.set(null);
    this.error.set(null);
  }

  edit(user: AdminUser): void {
    this.editing.set(user);
    this.selectedRoles.set([...user.roles]);
    this.form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: '',
      matricule: user.matricule ?? '',
      fonction: user.fonction ?? '',
      directionId: user.directionId ?? '',
    });
    this.showForm.set(true);
    this.notice.set(null);
    this.error.set(null);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
    this.error.set(null);
  }

  toggleRole(key: string): void {
    const current = this.selectedRoles();
    this.selectedRoles.set(
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  submit(): void {
    if (this.form.invalid || this.selectedRoles().length === 0) {
      this.form.markAllAsTouched();
      this.error.set({
        type: 'about:blank',
        title: 'Formulaire incomplet',
        status: 400,
        detail: 'Renseignez les champs obligatoires et au moins un role.',
      } as ApiProblemDetails);
      return;
    }

    const value = this.form.getRawValue();
    const direction = this.directions().find((item) => item.id === value.directionId);
    if (!direction) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const editing = this.editing();
    if (!editing) {
      this.gateway
        .create({
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          matricule: value.matricule,
          fonction: value.fonction,
          directionId: direction.id,
          directionCode: direction.code,
          roleKeys: this.selectedRoles(),
        })
        .subscribe({
          next: () => this.complete('Compte créé. Invitation envoyée.'),
          error: (error: unknown) => this.fail(error),
        });
      return;
    }

    const operations: Observable<unknown>[] = [
      this.gateway.update(editing.id, {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        matricule: value.matricule,
        fonction: value.fonction,
      }),
    ];
    if (value.directionId !== editing.directionId) {
      operations.push(this.gateway.updateDirection(editing.id, direction.id, direction.code));
    }
    if (this.selectedRoles().join(',') !== editing.roles.join(',')) {
      operations.push(this.gateway.updateRoles(editing.id, this.selectedRoles()));
    }
    forkJoin(operations).subscribe({
      next: () => this.complete('Compte modifie.'),
      error: (error: unknown) => this.fail(error),
    });
  }

  toggleActive(user: AdminUser): void {
    if (user.isActive) {
      const warning =
        user.assignedDossiersCount > 0
          ? `\n${user.assignedDossiersCount} dossier(s) attribue(s) devront etre reattribues.`
          : '';
      if (!globalThis.confirm(`Desactiver ${user.displayName} ?${warning}`)) {
        return;
      }
      this.gateway.deactivate(user.id).subscribe({
        next: (result) => {
          this.notice.set(
            result.reattributionTaskCreated
              ? 'Compte desactive. Tache REATTRIBUTION creee pour le SD GUDEF.'
              : 'Compte desactive.',
          );
          this.load(this.page());
        },
        error: (error: unknown) => this.fail(error),
      });
      return;
    }

    this.gateway.activate(user.id).subscribe({
      next: () => {
        this.notice.set('Compte reactive.');
        this.load(this.page());
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  resend(user: AdminUser): void {
    this.gateway.resendInvitation(user.id).subscribe({
      next: () => this.notice.set('Invitation renvoyee. L ancien lien est invalide.'),
      error: (error: unknown) => this.fail(error),
    });
  }

  resetMfa(user: AdminUser): void {
    this.resetMfaTarget.set(user);
    this.resetMfaOpen.set(true);
  }

  confirmResetMfa(reason: string): void {
    const target = this.resetMfaTarget();
    this.resetMfaOpen.set(false);
    this.resetMfaTarget.set(null);
    if (!target || !reason.trim()) {
      return;
    }

    this.gateway.resetMfa(target.id, reason.trim()).subscribe({
      next: () => {
        this.notice.set('Double authentification reinitialisee. Nouvel enrolement impose.');
        this.load(this.page());
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  cancelResetMfa(): void {
    this.resetMfaOpen.set(false);
    this.resetMfaTarget.set(null);
  }

  unlock(user: AdminUser): void {
    this.unlockTarget.set(user);
    this.unlockOpen.set(true);
  }

  confirmUnlock(reason: string): void {
    const target = this.unlockTarget();
    this.unlockOpen.set(false);
    this.unlockTarget.set(null);
    if (!target || !reason.trim()) {
      return;
    }

    this.gateway.unlock(target.id, reason.trim()).subscribe({
      next: () => {
        this.notice.set('Compte debloque.');
        this.load(this.page());
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  cancelUnlock(): void {
    this.unlockOpen.set(false);
    this.unlockTarget.set(null);
  }

  directionLabel(user: AdminUser): string {
    return (
      this.directions().find((item) => item.id === user.directionId)?.libelle ??
      user.directionCode ??
      '-'
    );
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

  private loadOptions(): void {
    forkJoin({
      roles: this.gateway.roles(),
      directions: this.admin.directions({ page: 1, pageSize: 100 }),
    }).subscribe({
      next: ({ roles, directions }) => {
        this.roles.set(roles);
        this.directions.set(directions.items);
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private complete(message: string): void {
    this.saving.set(false);
    this.showForm.set(false);
    this.editing.set(null);
    this.notice.set(message);
    this.load(this.page());
  }

  private fail(error: unknown): void {
    this.saving.set(false);
    this.error.set(normalizeProblem(error, this.correlation.last));
  }
}

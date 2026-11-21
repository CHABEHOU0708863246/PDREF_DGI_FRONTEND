import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../../core/utils/problem';
import { ErrorFooterComponent } from '../../../core/components/error-footer/error-footer.component';
import { PasswordInputComponent } from '../../../core/components/password-input/password-input.component';
import { AuthLayoutComponent } from '../components/auth-layout.component';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value as string | undefined;
  const confirmation = control.get('confirmation')?.value as string | undefined;
  return password === confirmation ? null : { mismatch: true };
}

@Component({
  selector: 'pdref-my-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    PasswordInputComponent,
    ErrorFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-auth-layout
      eyebrow="Mon compte"
      title="Profil et sécurité"
      subtitle="Consultez votre identite, vos roles et vos permissions. Le changement de mot de passe est journalise."
    >
      @if (user(); as current) {
        <section class="pd-card auth-card" aria-labelledby="identity-title">
          <h2 id="identity-title">Identite</h2>
          @if (mustChange()) {
            <p class="auth-message auth-message--info" role="status">
              Votre mot de passe initial doit être change avant de continuer.
            </p>
          }
          <dl class="auth-meta">
            <div>
              <dt>Identifiant</dt>
              <dd>{{ current.login }}</dd>
            </div>
            <div>
              <dt>Nom affiche</dt>
              <dd>{{ current.displayName }}</dd>
            </div>
            @if (current.email) {
              <div>
                <dt>Email</dt>
                <dd>{{ current.email }}</dd>
              </div>
            }
            @if (current.directionCode || current.directionId) {
              <div>
                <dt>Direction</dt>
                <dd>{{ current.directionCode || current.directionId }}</dd>
              </div>
            }
          </dl>

          <h3>Roles</h3>
          <div class="auth-chip-list">
            @for (role of current.roles; track role) {
              <span class="pd-chip">{{ role }}</span>
            } @empty {
              <span class="pd-muted">Aucun role attribue.</span>
            }
          </div>

          <h3>Permissions</h3>
          <div class="auth-chip-list">
            @for (permission of current.permissions; track permission) {
              <span class="pd-chip">{{ permission }}</span>
            } @empty {
              <span class="pd-muted">Aucune permission attribuee.</span>
            }
          </div>
        </section>

        <section class="pd-card auth-card" aria-labelledby="password-title">
          <h2 id="password-title">Changer le mot de passe</h2>

          @if (success()) {
            <p class="auth-message auth-message--success" role="status">
              Mot de passe modifie. Les autres sessions ont ete revoquees.
            </p>
          }

          @if (problem(); as issue) {
            <div class="auth-message auth-message--error" role="alert">
              <strong>{{ issue.title }}</strong>
              @if (issue.detail) {
                <p>{{ issue.detail }}</p>
              }
              <pdref-error-footer [problem]="issue" />
            </div>
          }

          <form class="auth-form-grid" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <pdref-password-input
              inputId="profile-current-password"
              label="Mot de passe actuel"
              autocomplete="current-password"
              formControlName="currentPassword"
              [error]="invalid('currentPassword') ? 'Mot de passe actuel obligatoire.' : undefined"
            />

            <pdref-password-input
              inputId="profile-new-password"
              label="Nouveau mot de passe"
              autocomplete="new-password"
              formControlName="newPassword"
              hint="12 caracteres minimum, verifie contre les mots de passe compromis."
              [error]="invalid('newPassword') ? '12 caracteres minimum.' : undefined"
            />

            <pdref-password-input
              inputId="profile-confirmation"
              label="Confirmer le nouveau mot de passe"
              autocomplete="new-password"
              formControlName="confirmation"
              [error]="
                form.hasError('mismatch') && form.controls.confirmation.touched
                  ? 'Les mots de passe ne correspondent pas.'
                  : undefined
              "
            />

            <div class="auth-actions">
              <button type="submit" class="pd-btn pd-btn--primary" [disabled]="loading()">
                @if (loading()) {
                  Enregistrement...
                } @else {
                  Changer le mot de passe
                }
              </button>
              <a class="pd-btn pd-btn--ghost" routerLink="/dashboard">Retour</a>
              <button type="button" class="pd-btn pd-btn--ghost" (click)="logout()">
                Se deconnecter
              </button>
            </div>
          </form>
        </section>
      } @else {
        <p class="pd-card auth-card">Aucune session active.</p>
      }
    </pdref-auth-layout>
  `,
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);

  readonly user = computed(() => this.auth.currentUser());
  readonly mustChange = computed(() => this.permissions.mustChangePassword());
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)],
      }),
      confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  invalid(control: 'currentPassword' | 'newPassword' | 'confirmation'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.success.set(false);
    this.problem.set(null);

    this.auth
      .changePassword(
        this.form.controls.currentPassword.value,
        this.form.controls.newPassword.value,
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.success.set(true);
          this.auth.markPasswordChanged();
          this.form.reset();
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.problem.set(normalizeProblem(error, this.correlation.last));
        },
      });
  }

  logout(): void {
    this.auth.logoutAndRedirect();
  }
}

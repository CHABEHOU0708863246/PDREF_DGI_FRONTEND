import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
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
  selector: 'pdref-reset-password',
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
      eyebrow="Nouveau mot de passe"
      title="Réinitialiser l'accès"
      subtitle="Le lien est a usage unique et expire rapidement. Choisissez un mot de passe d'au moins 12 caracteres."
    >
      <form class="pd-card auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (!token) {
          <p class="auth-message auth-message--error" role="alert">
            Ce lien de reinitialisation est incomplet ou invalide.
          </p>
        }

        @if (done()) {
          <p class="auth-message auth-message--success" role="status">
            Mot de passe reinitialise. Vous pouvez vous connecter.
          </p>
          <a class="pd-btn pd-btn--primary" routerLink="/auth/login">Se connecter</a>
        } @else if (problem(); as issue) {
          <div class="auth-message auth-message--error" role="alert">
            <strong>{{ issue.title }}</strong>
            @if (issue.detail) {
              <p>{{ issue.detail }}</p>
            }
            <pdref-error-footer [problem]="issue" />
          </div>
        }

        @if (token && !done()) {
          <pdref-password-input
            inputId="reset-password"
            label="Nouveau mot de passe"
            autocomplete="new-password"
            formControlName="newPassword"
            hint="12 caracteres minimum."
            [error]="invalid('newPassword') ? '12 caracteres minimum.' : undefined"
          />

          <pdref-password-input
            inputId="reset-confirmation"
            label="Confirmer le mot de passe"
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
                Reinitialiser
              }
            </button>
            <a class="pd-btn pd-btn--ghost" routerLink="/auth/login">Annuler</a>
          </div>
        }
      </form>
    </pdref-auth-layout>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  readonly form = new FormGroup(
    {
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

  invalid(control: 'newPassword' | 'confirmation'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.token || this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.problem.set(null);

    this.auth.resetPassword(this.token, this.form.controls.newPassword.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        void this.router.navigate(['/auth/login'], { queryParams: { reset: '1' } });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }
}

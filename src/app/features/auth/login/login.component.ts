import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MfaFlowService } from '../../../core/services/auth/mfa-flow.service';
import { isMfaChallenge } from '../../../core/models/auth/auth.model';
import { sanitizeReturnUrl } from '../../../core/utils/url';
import { normalizeProblem } from '../../../core/utils/problem';
import { ErrorFooterComponent } from '../../../core/components/error-footer/error-footer.component';
import { PasswordInputComponent } from '../../../core/components/password-input/password-input.component';
import { AuthLayoutComponent } from '../components/auth-layout.component';

@Component({
  selector: 'pdref-login',
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
      eyebrow="République de Côte d'Ivoire — DGI"
      title="Accédez à votre espace PDREF"
      subtitle="Plateforme de Demande de Rectification des États Financiers de la Direction Générale des Impôts. Connectez-vous avec vos identifiants agents DGI."
    >
      <form class="pd-card auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (expired()) {
          <p class="auth-message auth-message--info" role="status">
            Votre session a expire. Reconnectez-vous pour continuer.
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

        <div class="pd-field">
          <label class="pd-label" for="login-identifiant">Identifiant</label>
          <input
            id="login-identifiant"
            class="pd-input"
            type="text"
            formControlName="login"
            autocomplete="username"
            [attr.aria-invalid]="invalid('login') ? 'true' : null"
            aria-describedby="login-identifiant-error"
          />
          @if (invalid('login')) {
            <p class="pd-field__error" id="login-identifiant-error" role="alert">
              L'identifiant est obligatoire.
            </p>
          }
        </div>

        <pdref-password-input
          inputId="login-password"
          label="Mot de passe"
          autocomplete="current-password"
          formControlName="password"
          [error]="invalid('password') ? 'Le mot de passe est obligatoire.' : undefined"
        />

        <div class="auth-links">
          <a routerLink="/auth/forgot-password">Mot de passe oublié ?</a>
          <a routerLink="/adhesion">Entreprise : demander un compte / adhesion</a>
        </div>

        <div class="auth-actions">
          <button type="submit" class="pd-btn pd-btn--primary" [disabled]="loading()">
            @if (loading()) {
              Connexion en cours...
            } @else {
              Se connecter
            }
          </button>
          <a class="pd-btn pd-btn--ghost" routerLink="/suivi">Suivi public d'une demande</a>
        </div>
      </form>
    </pdref-auth-layout>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);
  private readonly mfaFlow = inject(MfaFlowService);

  readonly loading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly expired = signal(this.route.snapshot.queryParamMap.get('expired') === '1');

  readonly form = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
  });

  invalid(control: 'login' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.problem.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (isMfaChallenge(result)) {
          this.mfaFlow.setChallenge({
            challengeToken: result.challengeToken,
            enrollmentRequired: result.enrollmentRequired,
          });
          void this.router.navigate([
            result.enrollmentRequired ? '/auth/mfa/enrollment' : '/auth/mfa',
          ]);
          return;
        }

        const session = result;
        if (session.user.mustChangePassword) {
          void this.router.navigate(['/auth/my-profile'], { queryParams: { mustChange: '1' } });
          return;
        }

        if (session.user.roles.includes('CONTRIBUABLE')) {
          void this.router.navigateByUrl('/espace');
          return;
        }

        const returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }
}

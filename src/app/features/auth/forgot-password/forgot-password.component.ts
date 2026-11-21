import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../../core/utils/problem';
import { ErrorFooterComponent } from '../../../core/components/error-footer/error-footer.component';
import { AuthLayoutComponent } from '../components/auth-layout.component';

@Component({
  selector: 'pdref-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, ErrorFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-auth-layout
      eyebrow="Recuperation"
      title="Mot de passe oublie"
      subtitle="Saisissez votre identifiant. Pour des raisons de sécurité, la réponse est identique que le compte existe ou non."
    >
      <form class="pd-card auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (sent()) {
          <p class="auth-message auth-message--success" role="status">
            Si un compte correspond, un email de reinitialisation a ete envoye. Vérifiez votre boite
            de reception.
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
          <label class="pd-label" for="forgot-login">Identifiant</label>
          <input
            id="forgot-login"
            class="pd-input"
            type="text"
            formControlName="login"
            autocomplete="username"
            [attr.aria-invalid]="invalid() ? 'true' : null"
          />
          @if (invalid()) {
            <p class="pd-field__error" role="alert">L'identifiant est obligatoire.</p>
          }
        </div>

        <div class="auth-actions">
          <button type="submit" class="pd-btn pd-btn--primary" [disabled]="loading()">
            @if (loading()) {
              Envoi en cours...
            } @else {
              Envoyer le lien
            }
          </button>
          <a class="pd-btn pd-btn--ghost" routerLink="/auth/login">Retour a la connexion</a>
        </div>
      </form>
    </pdref-auth-layout>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly correlation = inject(CorrelationService);

  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  readonly form = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
  });

  invalid(): boolean {
    const field = this.form.controls.login;
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.problem.set(null);

    this.auth.forgotPassword(this.form.controls.login.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }
}

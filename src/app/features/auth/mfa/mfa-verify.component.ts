import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MfaFlowService } from '../../../core/services/auth/mfa-flow.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../../core/utils/problem';
import { AuthLayoutComponent } from '../components/auth-layout.component';

@Component({
  selector: 'pdref-mfa-verify',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-auth-layout
      eyebrow="Double authentification"
      title="Code de verification"
      subtitle="Saisissez le code genere par votre application d'authentification ou un code de secours."
    >
      <form class="pd-card auth-card mfa-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error(); as problem) {
          <div class="auth-message auth-message--error" role="alert">
            <strong>{{ problem.title }}</strong>
            @if (problem.detail) {
              <p>{{ problem.detail }}</p>
            }
          </div>
        }

        <div class="pd-field">
          <label class="pd-label" for="mfa-code">
            {{ recoveryMode() ? 'Code de secours' : 'Code de verification' }}
          </label>
          <input
            id="mfa-code"
            class="pd-input mfa-card__code"
            type="text"
            formControlName="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="32"
            [attr.aria-invalid]="invalid() ? 'true' : null"
          />
          @if (invalid()) {
            <p class="pd-field__error" role="alert">Le code est obligatoire.</p>
          }
        </div>

        <button class="pd-btn pd-btn--ghost mfa-card__switch" type="button" (click)="toggleMode()">
          {{ recoveryMode() ? 'Utiliser un code TOTP' : 'Utiliser un code de secours' }}
        </button>

        <div class="auth-actions">
          <button type="submit" class="pd-btn pd-btn--primary" [disabled]="loading()">
            {{ loading() ? 'Verification...' : 'Verifier' }}
          </button>
          <a class="pd-btn pd-btn--ghost" routerLink="/auth/login" (click)="cancel()">
            Revenir a la connexion
          </a>
        </div>
      </form>
    </pdref-auth-layout>
  `,
  styleUrl: './mfa.scss',
})
export class MfaVerifyComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly flow = inject(MfaFlowService);
  private readonly correlation = inject(CorrelationService);

  readonly loading = signal(false);
  readonly error = signal<ApiProblemDetails | null>(null);
  readonly recoveryMode = signal(false);
  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    if (!this.flow.challenge()) {
      void this.router.navigate(['/auth/login']);
    }
  }

  invalid(): boolean {
    const control = this.form.controls.code;
    return control.invalid && (control.touched || control.dirty);
  }

  toggleMode(): void {
    this.recoveryMode.update((value) => !value);
    this.form.reset({ code: '' });
    this.error.set(null);
  }

  cancel(): void {
    this.flow.clear();
  }

  submit(): void {
    this.form.markAllAsTouched();
    const challenge = this.flow.challenge();
    if (!challenge || this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyMfa(challenge.challengeToken, this.form.controls.code.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.flow.clear();
        void this.router.navigate(['/dashboard']);
      },
      error: (problem: unknown) => {
        this.loading.set(false);
        this.error.set(normalizeProblem(problem, this.correlation.last));
      },
    });
  }
}

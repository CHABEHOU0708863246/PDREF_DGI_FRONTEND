import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import type { MfaEnrollmentMaterial } from '../../../core/models/auth/auth.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MfaFlowService } from '../../../core/services/auth/mfa-flow.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../../core/utils/problem';
import { AuthLayoutComponent } from '../components/auth-layout.component';

@Component({
  selector: 'pdref-mfa-enroll',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-auth-layout
      eyebrow="Premiere connexion"
      title="Activer la double authentification"
      subtitle="Scannez le code QR avec votre application d'authentification, puis saisissez le premier code généré."
    >
      <section class="pd-card auth-card mfa-card" aria-live="polite">
        @if (error(); as problem) {
          <div class="auth-message auth-message--error" role="alert">
            <strong>{{ problem.title }}</strong>
            @if (problem.detail) {
              <p>{{ problem.detail }}</p>
            }
          </div>
        }

        @if (loading()) {
          <p class="mfa-card__state" role="status">Preparation de l'enrolement...</p>
        } @else if (material(); as data) {
          <div class="mfa-card__qr">
            <img
              [src]="data.qrCodeDataUri"
              alt="Code QR d'enrolement TOTP"
              width="220"
              height="220"
            />
          </div>
          <p class="mfa-card__hint">Saisie manuelle si le scan est impossible :</p>
          <div class="mfa-card__secret">
            <code>{{ data.secret }}</code>
            <button class="pd-btn pd-btn--ghost" type="button" (click)="copySecret(data.secret)">
              Copier
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="pd-field">
              <label class="pd-label" for="mfa-enroll-code">Premier code</label>
              <input
                id="mfa-enroll-code"
                class="pd-input mfa-card__code"
                type="text"
                formControlName="code"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                [attr.aria-invalid]="invalid() ? 'true' : null"
              />
              @if (invalid()) {
                <p class="pd-field__error" role="alert">Le code a 6 chiffres est obligatoire.</p>
              }
            </div>
            <button type="submit" class="pd-btn pd-btn--primary" [disabled]="saving()">
              {{ saving() ? 'Validation...' : "J'active la double authentification" }}
            </button>
          </form>
        }

        <a class="pd-btn pd-btn--ghost" routerLink="/auth/login" (click)="cancel()">
          Revenir a la connexion
        </a>
      </section>
    </pdref-auth-layout>
  `,
  styleUrl: './mfa.scss',
})
export class MfaEnrollComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly flow = inject(MfaFlowService);
  private readonly correlation = inject(CorrelationService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<ApiProblemDetails | null>(null);
  readonly material = signal<MfaEnrollmentMaterial | null>(null);
  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  constructor() {
    const challenge = this.flow.challenge();
    if (!challenge) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    this.loading.set(true);
    this.auth.startMfaEnrollment(challenge.challengeToken).subscribe({
      next: (material) => {
        this.material.set(material);
        this.loading.set(false);
      },
      error: (problem: unknown) => {
        this.loading.set(false);
        this.error.set(normalizeProblem(problem, this.correlation.last));
      },
    });
  }

  invalid(): boolean {
    const control = this.form.controls.code;
    return control.invalid && (control.touched || control.dirty);
  }

  copySecret(secret: string): void {
    void navigator.clipboard?.writeText(secret);
  }

  cancel(): void {
    this.flow.clear();
  }

  submit(): void {
    this.form.markAllAsTouched();
    const challenge = this.flow.challenge();
    if (!challenge || this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.auth
      .confirmMfaEnrollment(challenge.challengeToken, this.form.controls.code.value)
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.flow.setRecoveryCodes(result.recoveryCodes);
          void this.router.navigate(['/auth/mfa/recovery-codes']);
        },
        error: (problem: unknown) => {
          this.saving.set(false);
          this.error.set(normalizeProblem(problem, this.correlation.last));
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { ApiProblemDetails } from '../../../core/models/common/api-problem.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MfaFlowService } from '../../../core/services/auth/mfa-flow.service';
import { CorrelationService } from '../../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../../core/utils/problem';
import { AuthLayoutComponent } from '../components/auth-layout.component';

@Component({
  selector: 'pdref-mfa-recovery-codes',
  standalone: true,
  imports: [AuthLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-auth-layout
      eyebrow="Codes de secours"
      title="Conservez ces codes"
      subtitle="Ils ne seront plus affiches. Chaque code est utilisable une seule fois."
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
        @if (notice(); as message) {
          <p class="auth-message auth-message--info" role="status">{{ message }}</p>
        }

        <ul class="mfa-card__codes" aria-label="Codes de secours">
          @for (code of codes(); track code) {
            <li>
              <code>{{ code }}</code>
            </li>
          }
        </ul>

        <div class="mfa-card__actions">
          <button type="button" class="pd-btn pd-btn--ghost" (click)="copyAll()">Copier</button>
          <button type="button" class="pd-btn pd-btn--ghost" (click)="download()">
            Telecharger
          </button>
          <button type="button" class="pd-btn pd-btn--ghost" (click)="regenerate()">
            Regenerer
          </button>
        </div>

        <button type="button" class="pd-btn pd-btn--primary" (click)="finish()">
          J'ai note mes codes
        </button>
      </section>
    </pdref-auth-layout>
  `,
  styleUrl: './mfa.scss',
})
export class MfaRecoveryCodesComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly flow = inject(MfaFlowService);
  private readonly correlation = inject(CorrelationService);

  readonly codes = this.flow.recoveryCodes;
  readonly error = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly regenerating = signal(false);

  constructor() {
    if (!this.flow.recoveryCodes()) {
      void this.router.navigate(['/auth/login']);
    }
  }

  copyAll(): void {
    const codes = this.codes();
    if (!codes) {
      return;
    }
    void navigator.clipboard?.writeText(codes.join('\n'));
    this.notice.set('Codes copies.');
  }

  download(): void {
    const codes = this.codes();
    if (!codes) {
      return;
    }
    const content = [
      'PDREF - codes de secours de double authentification',
      'Chaque code est utilisable une seule fois.',
      '',
      ...codes,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pdref-codes-secours.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  regenerate(): void {
    if (this.regenerating()) {
      return;
    }
    this.regenerating.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.auth.regenerateRecoveryCodes().subscribe({
      next: (codes) => {
        this.regenerating.set(false);
        this.flow.setRecoveryCodes(codes);
        this.notice.set('Nouveaux codes generes. Les anciens sont invalides.');
      },
      error: (problem: unknown) => {
        this.regenerating.set(false);
        this.error.set(normalizeProblem(problem, this.correlation.last));
      },
    });
  }

  finish(): void {
    this.flow.clear();
    void this.router.navigate(['/dashboard']);
  }
}

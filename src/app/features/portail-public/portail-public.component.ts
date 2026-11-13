import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { PublicSuiviResponse } from '../../core/models/public-suivi/public-suivi.model';
import { IconComponent } from '../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { PublicSuiviGateway } from '../../core/services/public-suivi/public-suivi.gateway';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

const LIGHTHOUSE_RESULT: PublicSuiviResponse = {
  trouve: true,
  message: 'Dossiers trouves.',
  dossiers: [
    {
      numero: 'DOS-1',
      statut: 'EN_CIRCUIT',
      etapes: [
        { code: 'VERIF_GUDEF', date: '2026-11-06T00:00:00Z' },
        { code: 'AVIS_DERAR', date: '2026-11-07T00:00:00Z' },
        { code: 'AVIS_DVFN', date: '2026-11-08T00:00:00Z' },
      ],
      decisionFinale: null,
      motifRejet: null,
    },
  ],
};

@Component({
  selector: 'pdref-portail-public',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    StatePanelComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="public-shell">
      <header class="public-shell__head">
        <a class="brand" routerLink="/suivi">
          <img
            class="brand__republic"
            src="/assets/brand/Pepublique.jpg"
            alt="République de Côte d'Ivoire"
          />
          <img
            class="brand__logo"
            src="/assets/brand/logo-dgi.png"
            alt="Direction Générale des Impôts de Côte d'Ivoire"
          />
          <span>PDREF</span>
        </a>
        <span class="pd-chip">
          <pdref-icon name="user" size="sm" />
          Espace public
        </span>
        <pdref-theme-toggle />
      </header>

      <div class="public-shell__body">
        <pdref-page-header
          title="Suivi public d'une demande"
          subtitle="Consultez l'avancement de vos dossiers avec votre NCC et votre e-mail."
        />

        <form class="pd-card search" (submit)="$event.preventDefault(); submit()">
          <label class="pd-field">
            <span class="pd-label">NCC</span>
            <input
              class="pd-input"
              name="ncc"
              autocomplete="off"
              [value]="ncc()"
              (input)="onNcc($event)"
              required
            />
          </label>
          <label class="pd-field">
            <span class="pd-label">E-mail</span>
            <input
              class="pd-input"
              name="email"
              type="email"
              autocomplete="email"
              [value]="email()"
              (input)="onEmail($event)"
              required
            />
          </label>
          <button type="submit" class="pd-btn pd-btn--primary" [disabled]="mode() === 'loading'">
            Rechercher
          </button>
        </form>

        <section aria-live="polite" aria-label="Resultat du suivi">
          @if (mode() === 'loading') {
            <pdref-state-panel state="loading" title="Recherche du dossier" />
          } @else if (blocked()) {
            <pdref-state-panel
              state="error"
              title="Trop de tentatives"
              message="Trop de tentatives. Reessayez dans quinze minutes."
            />
          } @else if (problem(); as issue) {
            <pdref-state-panel
              state="error"
              [problem]="issue"
              actionLabel="Reessayer"
              (retry)="submit()"
            />
          } @else if (mode() === 'done' && result(); as data) {
            @if (!data.trouve) {
              <pdref-state-panel state="empty" title="Aucun dossier" [message]="data.message" />
            } @else {
              <h2>Dossiers trouves</h2>
              @for (dossier of data.dossiers; track dossier.numero) {
                <article class="pd-card dossier">
                  <div class="dossier__head">
                    <h3>{{ dossier.numero }}</h3>
                    <span class="pd-chip">{{ dossier.statut }}</span>
                  </div>
                  @if (dossier.decisionFinale) {
                    <p><strong>Decision finale :</strong> {{ dossier.decisionFinale }}</p>
                  }
                  @if (dossier.motifRejet) {
                    <p><strong>Motif de rejet :</strong> {{ dossier.motifRejet }}</p>
                  }
                  @if (dossier.etapes.length > 0) {
                    <ol class="timeline" aria-label="Chronologie des etapes">
                      @for (etape of dossier.etapes; track etape.code + etape.date) {
                        <li>
                          <span class="timeline__dot" aria-hidden="true"></span>
                          <span class="timeline__code">{{ etape.code }}</span>
                          <span class="pd-muted">{{ formatDate(etape.date) }}</span>
                        </li>
                      }
                    </ol>
                  } @else {
                    <p class="pd-muted">Aucune etape franchie pour le moment.</p>
                  }
                </article>
              }
            }
          } @else {
            <pdref-state-panel
              state="empty"
              title="Suivi de vos dossiers"
              message="Renseignez votre NCC et l'e-mail associe a votre dossier."
            />
          }
        </section>
      </div>
    </main>
  `,
  styleUrl: './portail-public.component.scss',
})
export class PortailPublicComponent {
  private readonly gateway = inject(PublicSuiviGateway);
  readonly ncc = signal('');
  readonly email = signal('');
  readonly result = signal<PublicSuiviResponse | null>(null);
  readonly mode = signal<'idle' | 'loading' | 'done' | 'error'>('idle');
  readonly blocked = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  constructor() {
    if (isLighthouseEnabled()) {
      this.result.set(LIGHTHOUSE_RESULT);
      this.mode.set('done');
    }
  }

  submit(): void {
    if (this.mode() === 'loading') {
      return;
    }
    this.mode.set('loading');
    this.blocked.set(false);
    this.problem.set(null);
    this.result.set(null);
    this.gateway.search({ ncc: this.ncc(), email: this.email() }).subscribe({
      next: (response) => {
        this.result.set(response);
        this.mode.set('done');
      },
      error: (error: { status?: number }) => {
        if (error.status === 429) {
          this.blocked.set(true);
          this.mode.set('error');
          return;
        }
        this.problem.set(normalizeProblem(error, null));
        this.mode.set('error');
      },
    });
  }

  onNcc(event: Event): void {
    this.ncc.set((event.target as HTMLInputElement).value);
  }

  onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('fr-CI', {
          timeZone: 'Africa/Abidjan',
          dateStyle: 'medium',
        }).format(date);
  }
}

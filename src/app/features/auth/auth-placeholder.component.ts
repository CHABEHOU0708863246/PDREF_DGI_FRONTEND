import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'pdref-auth-placeholder',
  standalone: true,
  imports: [RouterLink, IconComponent, PageHeaderComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-shell">
      <header class="auth-shell__head">
        <a class="brand" routerLink="/design-system-demo" aria-label="PDREF">
          <span class="brand__mark" aria-hidden="true">P</span>
          <span>PDREF</span>
        </a>
        <pdref-theme-toggle />
      </header>

      <section class="auth-shell__body">
        <pdref-page-header
          [title]="mode()"
          subtitle="L'authentification reelle (cookie HttpOnly, refresh, MFA) est livree au lot L3."
        />

        <div class="pd-card auth-card">
          <pdref-icon name="user" size="lg" />
          <h2>Contrat deja pret</h2>
          <p class="pd-muted">
            L'access token reste en memoire, le refresh token est un cookie HttpOnly et aucun
            endpoint metier n'est appele avant le chargement des permissions.
          </p>
          <a class="pd-btn pd-btn--primary" routerLink="/design-system-demo">
            Voir le design system
          </a>
        </div>
      </section>
    </main>
  `,
  styleUrl: './auth-placeholder.component.scss',
})
export class AuthPlaceholderComponent {
  readonly mode = input('Connexion');
}

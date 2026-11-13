import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'pdref-auth-layout',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-shell">
      <header class="auth-shell__head">
        <a class="brand" routerLink="/">
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
        <pdref-theme-toggle />
      </header>

      <div class="auth-shell__grid">
        <section class="auth-shell__content" aria-labelledby="auth-title">
          <p class="pd-chip">{{ eyebrow() }}</p>
          <h1 id="auth-title">{{ title() }}</h1>
          <p class="pd-muted">{{ subtitle() }}</p>
          <ng-content />
        </section>

        <aside class="auth-art" aria-hidden="true">
          <span class="auth-art__layer auth-art__layer--back"></span>
          <span class="auth-art__layer auth-art__layer--middle"></span>
          <span class="auth-art__layer auth-art__layer--front">
            <span class="auth-art__monogram">P</span>
          </span>
        </aside>
      </div>

      <footer class="auth-shell__foot">
        <span>Direction Generale des Impots de Cote d'Ivoire</span>
        <a routerLink="/design-system-demo">Design system</a>
      </footer>
    </main>
  `,
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly eyebrow = input('Identite et acces');
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}

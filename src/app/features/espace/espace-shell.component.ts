import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalClockComponent } from '../../core/components/local-clock/local-clock.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'pdref-espace-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LocalClockComponent, ThemeToggleComponent],
  template: `
    <div class="espace-shell">
      <header class="espace-shell__head">
        <a class="espace-brand" routerLink="/espace">
          <img
            class="espace-brand__logo"
            src="/assets/brand/logo-dgi.png"
            alt="Direction Générale des Impôts de Côte d'Ivoire"
          />
          <span>PDREF Contribuable</span>
        </a>
        <nav class="espace-nav" aria-label="Navigation contribuable">
          <a
            routerLink="/espace"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            Mes dossiers
          </a>
          <a routerLink="/espace/depots/nouveau" routerLinkActive="is-active"> Nouveau dépôt </a>
        </nav>
        <pdref-local-clock />
        <span class="espace-user">{{ auth.currentUser()?.displayName }}</span>
        <pdref-theme-toggle />
        <button class="pd-btn pd-btn--ghost" type="button" (click)="logout()">
          Se deconnecter
        </button>
      </header>
      <main class="espace-shell__body">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './espace-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
      error: () => void this.router.navigateByUrl('/auth/login'),
    });
  }
}

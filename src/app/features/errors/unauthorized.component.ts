import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';

@Component({
  selector: 'pdref-unauthorized',
  standalone: true,
  imports: [RouterLink, IconComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pd-container pd-page">
      <pdref-page-header
        title="Accès refuse"
        subtitle="Votre role ou votre perimetre ne permet pas cette action."
      />
      <div class="pd-card unauthorized">
        <pdref-icon name="alert-triangle" size="lg" />
        <p>Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.</p>
        <a class="pd-btn pd-btn--primary" routerLink="/dashboard">Retour au tableau de bord</a>
      </div>
    </main>
  `,
  styles: [
    `
      .unauthorized {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }
    `,
  ],
})
export class UnauthorizedComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

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
        <a class="brand" routerLink="/portail-public/suivi" aria-label="PDREF">
          <span class="brand__mark" aria-hidden="true">P</span>
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
          subtitle="Route isolee du back-office. Aucun montant ni contenu d'avis ne sera expose."
        />

        <pdref-state-panel
          state="empty"
          title="Disponible au lot L18"
          message="Le formulaire de suivi par NCC et e-mail sera livre avec la limitation de debit et la reponse generique."
        />

        <a class="pd-btn pd-btn--ghost" routerLink="/design-system-demo">Design system</a>
      </div>
    </main>
  `,
  styleUrl: './portail-public.component.scss',
})
export class PortailPublicComponent {}

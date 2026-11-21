import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';

@Component({
  selector: 'pdref-portail-placeholder',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pd-container pd-page">
      <pdref-page-header
        title="Espace contribuable"
        subtitle="Le parcours de dépôt electronique sera disponible prochainement."
      />
      <pdref-state-panel
        state="empty"
        title="Squelette uniquement"
        message="Aucun formulaire metier, aucune donnee financiere et aucun appel API."
      />
      <a class="pd-btn pd-btn--ghost" routerLink="/design-system-demo">Design system</a>
    </main>
  `,
})
export class PortailPlaceholderComponent {}

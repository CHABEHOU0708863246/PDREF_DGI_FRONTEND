import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';

@Component({
  selector: 'pdref-not-found',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pd-container pd-page">
      <pdref-page-header
        title="Page introuvable"
        subtitle="La page demandee n'existe pas ou a ete deplacee."
      />
      <pdref-state-panel
        state="empty"
        title="Rien a afficher ici"
        message="Verifiez l'adresse ou revenez au tableau de bord."
      />
      <a class="pd-btn pd-btn--primary" routerLink="/dashboard">Retour au tableau de bord</a>
    </main>
  `,
})
export class NotFoundComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'pdref-dashboard-home',
  standalone: true,
  imports: [RouterLink, IconComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pd-page">
      <pdref-page-header
        title="PDREF v2 — Fondations"
        subtitle="Lot L2 : design system, contrat API et securite front. Aucun ecran metier n'est livre a ce stade."
      />

      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__copy">
          <span class="pd-chip">L2 — fondations</span>
          <h2 id="hero-title">Une base commune, prete pour les lots metier</h2>
          <p>
            Composants accessibles, contrat problem+json, interception securisee et theming
            clair/sombre sont maintenant disponibles pour construire les modules.
          </p>
          <div class="pd-cluster">
            <a class="pd-btn pd-btn--primary" routerLink="/design-system-demo">
              Voir le design system
            </a>
            <a class="pd-btn pd-btn--ghost" routerLink="/portail-public/suivi">
              Portail public (squelette)
            </a>
          </div>
        </div>

        <div class="hero__art" aria-hidden="true">
          <span class="hero__layer hero__layer--back"></span>
          <span class="hero__layer hero__layer--middle"></span>
          <span class="hero__layer hero__layer--front">
            <pdref-icon name="layout" size="lg" />
          </span>
        </div>
      </section>

      <section class="home-grid" aria-label="Points d'entree">
        <a class="home-card pd-lift" routerLink="/design-system-demo">
          <pdref-icon name="layout" size="lg" />
          <h3>Design system</h3>
          <p>Tokens, composants, etats et accessibilite.</p>
        </a>
        <a class="home-card pd-lift" routerLink="/portail-public/suivi">
          <pdref-icon name="external-link" size="lg" />
          <h3>Portail public</h3>
          <p>Route isolee, sans authentification ni donnee financiere.</p>
        </a>
        <div class="home-card">
          <pdref-icon name="clipboard" size="lg" />
          <h3>Contrat API</h3>
          <p>ApiResponse, PagedResponse, problem+json et correlation.</p>
        </div>
      </section>
    </div>
  `,
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {}

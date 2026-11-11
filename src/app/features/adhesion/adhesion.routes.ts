import type { Routes } from '@angular/router';
import { adhesionFeatureGuard } from '../../core/guards/adhesion-feature.guard';

export const ADHESION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./adhesion-public-page.component').then(
        (module) => module.AdhesionPublicPageComponent,
      ),
    canActivate: [adhesionFeatureGuard],
    title: "Demande d'adhesion - PDREF",
  },
];

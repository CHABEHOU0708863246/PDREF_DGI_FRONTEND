import type { Routes } from '@angular/router';
import { accessGuard } from '../../core/guards/access.guard';
import { adhesionFeatureGuard } from '../../core/guards/adhesion-feature.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { DashboardShellComponent } from './shell/dashboard-shell.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/dashboard-home.component').then((module) => module.DashboardHomeComponent),
        title: 'Tableau de bord - PDREF',
      },
      {
        path: 'mon-travail',
        loadComponent: () =>
          import('../travail/mon-travail-page.component').then(
            (module) => module.MonTravailPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Suivis_Read'], breadcrumb: 'Mon travail' },
        title: 'Mon travail - PDREF',
      },
      {
        path: 'aide/circuit',
        loadComponent: () =>
          import('../aide/aide-circuit-page.component').then(
            (module) => module.AideCircuitPageComponent,
          ),
        data: { breadcrumb: 'Circuit du dossier' },
        title: 'Circuit du dossier - PDREF',
      },
      {
        path: 'pilotage/dossiers',
        loadComponent: () =>
          import('../pilotage/pilotage-list-page.component').then(
            (module) => module.PilotageListPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Dashboard_Read'], breadcrumb: 'Dossiers' },
        title: 'Dossiers - PDREF',
      },
      {
        path: 'pilotage/charge',
        loadComponent: () =>
          import('../pilotage/workload-page.component').then(
            (module) => module.WorkloadPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Dashboard_Read'], breadcrumb: 'Charge de travail' },
        title: 'Charge de travail - PDREF',
      },
      {
        path: 'rapports',
        loadComponent: () =>
          import('./rapports/rapports-page.component').then(
            (module) => module.RapportsPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Rapports_Read'], breadcrumb: 'Rapports' },
        title: 'Rapports - PDREF',
      },
      {
        path: 'admin/utilisateurs',
        loadComponent: () =>
          import('../users/users-page.component').then((module) => module.UsersPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['CAN_MANAGE_USERS'], breadcrumb: 'Utilisateurs' },
        title: 'Utilisateurs - Administration PDREF',
      },
      {
        path: 'admin/workflows',
        loadComponent: () =>
          import('../workflows/workflows-page.component').then(
            (module) => module.WorkflowsPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Workflows_Read'], breadcrumb: 'Workflows' },
        title: 'Workflows - Administration PDREF',
      },
      {
        path: 'admin/directions',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Directions_Read'], screen: 'directions', breadcrumb: 'Directions' },
        title: 'Directions - Administration PDREF',
      },
      {
        path: 'admin/exercices',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Exercices_Read'], screen: 'exercices', breadcrumb: 'Exercices' },
        title: 'Exercices fiscaux - Administration PDREF',
      },
      {
        path: 'admin/listes-valeurs',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: {
          permissions: ['Listes_Read'],
          screen: 'listes-valeurs',
          breadcrumb: 'Listes de valeurs',
        },
        title: 'Listes de valeurs - Administration PDREF',
      },
      {
        path: 'admin/parametres',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Parametres_Read'], screen: 'parametres', breadcrumb: 'Parametres' },
        title: 'Parametres - Administration PDREF',
      },
      {
        path: 'admin/emails',
        loadComponent: () =>
          import('../admin/email-admin-page.component').then(
            (module) => module.EmailAdminPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Parametres_Read'],
          breadcrumb: 'E-mails transactionnels',
        },
        title: 'E-mails transactionnels - Administration PDREF',
      },
      {
        path: 'admin/modeles-notifications',
        loadComponent: () =>
          import('../admin/admin-page.component').then((module) => module.AdminPageComponent),
        canActivate: [accessGuard],
        data: {
          permissions: ['ModelesNotifications_Read'],
          screen: 'modeles-notifications',
          breadcrumb: 'Modeles de notification',
        },
        title: 'Modeles de notification - Administration PDREF',
      },
      {
        path: 'files',
        loadComponent: () =>
          import('../files/files-page.component').then((module) => module.FilesPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Files_Read'], breadcrumb: 'Fichiers' },
        title: 'Fichiers - PDREF',
      },
      {
        path: 'courriers',
        loadComponent: () =>
          import('../courriers/courriers-page.component').then(
            (module) => module.CourriersPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Courriers_Read'], breadcrumb: 'Courriers' },
        title: 'Courriers - PDREF',
      },
      {
        path: 'courriers/nouveau',
        loadComponent: () =>
          import('../courriers/courrier-form-page.component').then(
            (module) => module.CourrierFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Courriers_Create'], breadcrumb: 'Nouveau courrier' },
        title: 'Nouveau courrier - PDREF',
      },
      {
        path: 'courriers/a-signer',
        loadComponent: () =>
          import('../courriers/courriers-a-signer-page.component').then(
            (module) => module.CourriersASignerPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Courriers_DeposerSigne'],
          breadcrumb: 'Courriers a signer',
        },
        title: 'Courriers a signer - PDREF',
      },
      {
        path: 'courriers/:id/modifier',
        loadComponent: () =>
          import('../courriers/courrier-form-page.component').then(
            (module) => module.CourrierFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Courriers_Update'],
          breadcrumb: 'Modifier le courrier',
          renderMode: 'client',
        },
        title: 'Modifier le courrier - PDREF',
      },
      {
        path: 'courriers/:id',
        loadComponent: () =>
          import('../courriers/courrier-detail-page.component').then(
            (module) => module.CourrierDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Courriers_Read'],
          breadcrumb: 'Fiche courrier',
          renderMode: 'client',
        },
        title: 'Fiche courrier - PDREF',
      },
      {
        path: 'ctf/a-activer',
        loadComponent: () =>
          import('../ctf/ctf-a-activer-page.component').then(
            (module) => module.CtfAActiverPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Ctf_Read'], breadcrumb: 'Autorisations a activer' },
        title: 'Autorisations a activer - PDREF',
      },
      {
        path: 'ctf/suivi',
        loadComponent: () =>
          import('../ctf/ctf-suivi-page.component').then((module) => module.CtfSuiviPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Ctf_Read'], breadcrumb: 'Suivi des autorisations' },
        title: 'Suivi des autorisations - PDREF',
      },
      {
        path: 'ctf/:id',
        loadComponent: () =>
          import('../ctf/ctf-detail-page.component').then(
            (module) => module.CtfDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Ctf_Read'],
          breadcrumb: 'Detail autorisation',
          renderMode: 'client',
        },
        title: 'Detail autorisation - PDREF',
      },
      {
        path: 'rejets',
        loadComponent: () =>
          import('../rejets/rejets-list-page.component').then(
            (module) => module.RejetsListPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Rejets_Read'], breadcrumb: 'Rejets' },
        title: 'Rejets - PDREF',
      },
      {
        path: 'rejets/:id',
        loadComponent: () =>
          import('../rejets/rejet-detail-page.component').then(
            (module) => module.RejetDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Rejets_Read'],
          breadcrumb: 'Detail rejet',
          renderMode: 'client',
        },
        title: 'Detail rejet - PDREF',
      },
      {
        path: 'alertes',
        loadComponent: () =>
          import('../alertes/alertes-page.component').then((module) => module.AlertesPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Alertes_Read'], breadcrumb: 'Alertes' },
        title: 'Alertes - PDREF',
      },
      {
        path: 'imports',
        loadComponent: () =>
          import('../imports/imports-list-page.component').then(
            (module) => module.ImportsListPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Imports_Read'], breadcrumb: 'Imports' },
        title: 'Imports - PDREF',
      },
      {
        path: 'imports/:id',
        loadComponent: () =>
          import('../imports/import-detail-page.component').then(
            (module) => module.ImportDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Imports_Read'],
          breadcrumb: 'Detail import',
          renderMode: 'client',
        },
        title: 'Detail import - PDREF',
      },
      {
        path: 'demandes',
        loadComponent: () =>
          import('../demandes/demandes-page.component').then(
            (module) => module.DemandesPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Demandes_Read'], breadcrumb: 'Demandes' },
        title: 'Demandes - PDREF',
      },
      {
        path: 'demandes/nouvelle',
        loadComponent: () =>
          import('../demandes/demande-form-page.component').then(
            (module) => module.DemandeFormPageComponent,
          ),
        canActivate: [accessGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['Demandes_Create'], breadcrumb: 'Nouvelle demande' },
        title: 'Nouvelle demande - PDREF',
      },
      {
        path: 'demandes/:id/modifier',
        loadComponent: () =>
          import('../demandes/demande-form-page.component').then(
            (module) => module.DemandeFormPageComponent,
          ),
        canActivate: [accessGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['Demandes_Update'], breadcrumb: 'Modifier la demande' },
        title: 'Modifier la demande - PDREF',
      },
      {
        path: 'demandes/:id',
        loadComponent: () =>
          import('../demandes/demande-detail-page.component').then(
            (module) => module.DemandeDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Demandes_Read'],
          breadcrumb: 'Fiche demande',
          renderMode: 'client',
        },
        title: 'Fiche demande - PDREF',
      },
      {
        path: 'imputations',
        loadComponent: () =>
          import('../suivis/imputation-page.component').then(
            (module) => module.ImputationPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Etapes_Imputer'], breadcrumb: 'Imputation GUDEF' },
        title: 'Imputation GUDEF - PDREF',
      },
      {
        path: 'suivis',
        loadComponent: () =>
          import('../suivis/suivis-page.component').then((module) => module.SuivisPageComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Suivis_Read'], breadcrumb: 'Suivis' },
        title: 'Suivis - PDREF',
      },
      {
        path: 'suivis/:id/validation',
        loadComponent: () =>
          import('../suivis/suivi-validation-page.component').then(
            (module) => module.SuiviValidationPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Suivis_Decide'],
          breadcrumb: 'Validation globale',
          renderMode: 'client',
        },
        title: 'Validation globale - PDREF',
      },
      {
        path: 'suivis/:id/corriger',
        loadComponent: () =>
          import('../suivis/suivi-correction-page.component').then(
            (module) => module.SuiviCorrectionPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Suivis_Corriger'],
          breadcrumb: 'Correction',
          renderMode: 'client',
        },
        title: 'Correction - PDREF',
      },
      {
        path: 'suivis/:id',
        loadComponent: () =>
          import('../suivis/suivi-detail-page.component').then(
            (module) => module.SuiviDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Suivis_Read'],
          breadcrumb: 'Suivi',
          renderMode: 'client',
        },
        title: 'Suivi - PDREF',
      },
      {
        path: 'contribuables',
        loadComponent: () =>
          import('../contribuables/contribuables-page.component').then(
            (module) => module.ContribuablesPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Contribuables_Read'], breadcrumb: 'Contribuables' },
        title: 'Contribuables - PDREF',
      },
      {
        path: 'contribuables/nouveau',
        loadComponent: () =>
          import('../contribuables/contribuable-form-page.component').then(
            (module) => module.ContribuableFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: { permissions: ['Contribuables_Create'], breadcrumb: 'Nouveau contribuable' },
        title: 'Nouveau contribuable - PDREF',
      },
      {
        path: 'contribuables/:id/modifier',
        loadComponent: () =>
          import('../contribuables/contribuable-form-page.component').then(
            (module) => module.ContribuableFormPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Contribuables_Update'],
          breadcrumb: 'Modifier le contribuable',
          renderMode: 'client',
        },
        title: 'Modifier le contribuable - PDREF',
      },
      {
        path: 'contribuables/:id',
        loadComponent: () =>
          import('../contribuables/contribuable-detail-page.component').then(
            (module) => module.ContribuableDetailPageComponent,
          ),
        canActivate: [accessGuard],
        data: {
          permissions: ['Contribuables_Read'],
          breadcrumb: 'Fiche contribuable',
          renderMode: 'client',
        },
        title: 'Fiche contribuable - PDREF',
      },
      {
        path: 'my-notifications',
        loadComponent: () =>
          import('../notifications/my-notifications-page.component').then(
            (module) => module.MyNotificationsPageComponent,
          ),
        title: 'Mes notifications - PDREF',
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('../audit/audit-list.component').then((module) => module.AuditListComponent),
        canActivate: [accessGuard],
        data: { permissions: ['Audit_Read'], breadcrumb: 'Audit' },
        title: "Journal d'audit - PDREF",
      },
      {
        path: 'adhesions',
        loadComponent: () =>
          import('../adhesions/adhesions-agent-page.component').then(
            (module) => module.AdhesionsAgentPageComponent,
          ),
        canActivate: [accessGuard, adhesionFeatureGuard],
        data: {
          permissions: ['ComptesContribuables_Valider'],
          breadcrumb: 'Adhesions',
        },
        title: 'Adhesions contribuables - PDREF',
      },
    ],
  },
];

import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreadcrumbComponent } from '../../../core/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../core/components/icon/icon.component';
import { LocalClockComponent } from '../../../core/components/local-clock/local-clock.component';
import { NotificationCenterComponent } from '../../../core/components/notification-center/notification-center.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import type { IconName } from '../../../core/models/common/icon.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb/breadcrumb.service';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';

interface NavigationItem {
  label: string;
  route: string;
  icon: IconName;
  exact?: boolean;
  permission?: string;
  /** Un de ces roles suffit a afficher l'entree (en plus ou a la place de la permission). */
  roles?: readonly string[];
  /** Si renseigne, l'entree n'est visible que pour ces roles. */
  onlyRoles?: readonly string[];
}

interface NavigationGroup {
  id: string;
  label: string;
  items: readonly NavigationItem[];
}

const CTF_ROLES = ['CHEF_CTF', 'COLLABORATEUR_CTF'] as const;
const PILOTAGE_ROLES = ['ADMINISTRATEUR_DSI', 'DG', 'SUPERVISEUR_DSESF'] as const;

/**
 * Menu organise par grandes familles d'activite, dans l'ordre du circuit :
 * on recoit le courrier, on traite la demande, on autorise la rectification,
 * puis on pilote. L'administration et l'aide sont regroupees a la fin.
 */
const NAVIGATION: readonly NavigationGroup[] = [
  {
    id: 'espace',
    label: 'Mon espace',
    items: [
      { label: 'Accueil', route: '/dashboard', icon: 'home', exact: true },
      {
        label: 'Mon travail',
        route: '/dashboard/mon-travail',
        icon: 'briefcase',
        permission: 'Suivis_Read',
      },
      { label: 'Mes notifications', route: '/dashboard/my-notifications', icon: 'bell' },
    ],
  },
  {
    id: 'courrier',
    label: 'Courrier',
    items: [
      {
        label: 'Registre des courriers',
        route: '/dashboard/courriers',
        icon: 'inbox',
        exact: true,
        permission: 'Courriers_Read',
      },
      {
        label: 'Courriers à signer',
        route: '/dashboard/courriers/a-signer',
        icon: 'pen-tool',
        permission: 'Courriers_DeposerSigne',
      },
    ],
  },
  {
    id: 'traitement',
    label: 'Traitement des dossiers',
    items: [
      {
        label: 'Demandes',
        route: '/dashboard/demandes',
        icon: 'file-text',
        permission: 'Demandes_Read',
      },
      {
        label: 'Attribution des dossiers',
        route: '/dashboard/imputations',
        icon: 'send',
        permission: 'Etapes_Imputer',
      },
      {
        label: 'Suivi des dossiers',
        route: '/dashboard/suivis',
        icon: 'activity',
        permission: 'Suivis_Read',
      },
      { label: 'Rejets', route: '/dashboard/rejets', icon: 'x-circle', permission: 'Rejets_Read' },
      {
        label: 'Import Excel',
        route: '/dashboard/imports',
        icon: 'upload',
        permission: 'Imports_Read',
      },
    ],
  },
  {
    id: 'autorisations',
    label: 'Autorisations de rectification',
    items: [
      {
        label: 'À activer',
        route: '/dashboard/ctf/a-activer',
        icon: 'key',
        permission: 'Ctf_Read',
        roles: CTF_ROLES,
      },
      {
        label: 'Suivi des autorisations',
        route: '/dashboard/ctf/suivi',
        icon: 'check-circle',
        permission: 'Ctf_Read',
        roles: CTF_ROLES,
      },
    ],
  },
  {
    id: 'contribuables',
    label: 'Contribuables',
    items: [
      {
        label: 'Fiches contribuables',
        route: '/dashboard/contribuables',
        icon: 'building',
        permission: 'Contribuables_Read',
      },
      {
        label: 'Demandes de compte',
        route: '/dashboard/adhesions',
        icon: 'user-plus',
        permission: 'ComptesContribuables_Valider',
      },
    ],
  },
  {
    id: 'pilotage',
    label: 'Pilotage',
    items: [
      {
        label: 'Alertes de délai',
        route: '/dashboard/alertes',
        icon: 'alert-triangle',
        permission: 'Alertes_Read',
      },
      {
        label: 'Dossiers en cours',
        route: '/dashboard/pilotage/dossiers',
        icon: 'layout',
        permission: 'Dashboard_Read',
        onlyRoles: PILOTAGE_ROLES,
      },
      {
        label: 'Charge des agents',
        route: '/dashboard/pilotage/charge',
        icon: 'users',
        permission: 'Dashboard_Read',
        onlyRoles: PILOTAGE_ROLES,
      },
      {
        label: 'Rapports et statistiques',
        route: '/dashboard/rapports',
        icon: 'bar-chart',
        permission: 'Rapports_Read',
      },
      {
        label: "Journal d'audit",
        route: '/dashboard/audit',
        icon: 'shield-check',
        permission: 'Audit_Read',
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      {
        label: 'Utilisateurs',
        route: '/dashboard/admin/utilisateurs',
        icon: 'users',
        permission: 'CAN_MANAGE_USERS',
      },
      {
        label: 'Directions',
        route: '/dashboard/admin/directions',
        icon: 'building',
        permission: 'Directions_Read',
      },
      {
        label: 'Exercices fiscaux',
        route: '/dashboard/admin/exercices',
        icon: 'calendar',
        permission: 'Exercices_Read',
      },
      {
        label: 'Listes de valeurs',
        route: '/dashboard/admin/listes-valeurs',
        icon: 'list',
        permission: 'Listes_Read',
      },
      {
        label: 'Paramètres',
        route: '/dashboard/admin/parametres',
        icon: 'sliders',
        permission: 'Parametres_Read',
      },
      {
        label: 'Modèles de notification',
        route: '/dashboard/admin/modeles-notifications',
        icon: 'bell',
        permission: 'ModelesNotifications_Read',
      },
      {
        label: 'E-mails envoyés',
        route: '/dashboard/admin/emails',
        icon: 'mail',
        permission: 'Parametres_Read',
      },
      {
        label: 'Circuits (workflows)',
        route: '/dashboard/admin/workflows',
        icon: 'git-branch',
        permission: 'Workflows_Read',
      },
      { label: 'Fichiers', route: '/dashboard/files', icon: 'folder', permission: 'Files_Read' },
    ],
  },
  {
    id: 'aide',
    label: 'Aide',
    items: [
      { label: 'Comprendre le circuit', route: '/dashboard/aide/circuit', icon: 'help-circle' },
      { label: 'Portail public', route: '/portail-public/suivi', icon: 'globe' },
      ...(environment.showDesignSystemDemo
        ? [{ label: 'Design system', route: '/design-system-demo', icon: 'palette' as const }]
        : []),
    ],
  },
];

const DECIDEUR_NAVIGATION: readonly NavigationGroup[] = [
  {
    id: 'avis',
    label: 'Mes avis',
    items: [
      {
        label: 'Avis à rendre',
        route: '/dashboard/suivis',
        icon: 'stamp',
        permission: 'Avis_Lire',
      },
    ],
  },
];

@Component({
  selector: 'pdref-dashboard-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    BreadcrumbComponent,
    IconComponent,
    LocalClockComponent,
    NotificationCenterComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionsService);
  readonly breadcrumbs = inject(BreadcrumbService);
  readonly user = computed(() => this.auth.currentUser());
  /** Groupes du menu visibles pour l'utilisateur ; un groupe vide est masque. */
  readonly navigation = computed(() => {
    const roles = this.auth.currentUser()?.roles ?? [];
    const decideur = roles.some((role) =>
      ['DECIDEUR_DERAR', 'DECIDEUR_DVFN', 'DIRECTEUR_RATTACHEMENT'].includes(role),
    );
    const groups = decideur ? DECIDEUR_NAVIGATION : NAVIGATION;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => this.canSee(item)) }))
      .filter((group) => group.items.length > 0);
  });

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  /** Identifiants des groupes replies par l'utilisateur (tous deplies par defaut). */
  readonly closedGroups = signal<ReadonlySet<string>>(new Set());

  isGroupOpen(id: string): boolean {
    return !this.closedGroups().has(id);
  }

  toggleGroup(id: string): void {
    this.closedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  private canSee(item: NavigationItem): boolean {
    if (item.onlyRoles && !item.onlyRoles.some((role) => this.permissions.hasRole(role))) {
      return false;
    }
    const byRole = item.roles?.some((role) => this.permissions.hasRole(role)) ?? false;
    return byRole || !item.permission || this.permissions.hasPermission(item.permission);
  }

  toggleSidebar(): void {
    if (this.isMobileViewport()) {
      this.mobileOpen.update((value) => !value);
      return;
    }
    this.collapsed.update((value) => !value);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  sidebarExpanded(): boolean {
    return this.isMobileViewport() ? this.mobileOpen() : !this.collapsed();
  }

  logout(): void {
    this.auth.logoutAndRedirect();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobileViewport()) {
      this.closeMobile();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobile();
  }

  private isMobileViewport(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(max-width: 37.4375rem)').matches;
  }
}

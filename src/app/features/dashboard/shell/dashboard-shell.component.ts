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
import { AuthService } from '../../../core/services/auth/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb/breadcrumb.service';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';

interface NavigationItem {
  label: string;
  route: string;
  icon: IconName;
  exact: boolean;
  permission?: string;
  roles?: readonly string[];
}

const NAVIGATION: readonly NavigationItem[] = [
  { label: 'Accueil', route: '/dashboard', icon: 'home', exact: true },
  {
    label: 'Mon travail',
    route: '/dashboard/mon-travail',
    icon: 'layout',
    exact: false,
    permission: 'Suivis_Read',
  },
  { label: 'Circuit du dossier', route: '/dashboard/aide/circuit', icon: 'layout', exact: false },
  { label: 'Design system', route: '/design-system-demo', icon: 'layout', exact: false },
  { label: 'Portail public', route: '/portail-public/suivi', icon: 'external-link', exact: false },
  {
    label: 'Workflows',
    route: '/dashboard/admin/workflows',
    icon: 'layout',
    exact: false,
    permission: 'Workflows_Read',
  },
  {
    label: 'Utilisateurs',
    route: '/dashboard/admin/utilisateurs',
    icon: 'user',
    exact: false,
    permission: 'CAN_MANAGE_USERS',
  },
  {
    label: 'Directions',
    route: '/dashboard/admin/directions',
    icon: 'layout',
    exact: false,
    permission: 'Directions_Read',
  },
  {
    label: 'Exercices',
    route: '/dashboard/admin/exercices',
    icon: 'calendar',
    exact: false,
    permission: 'Exercices_Read',
  },
  {
    label: 'Listes de valeurs',
    route: '/dashboard/admin/listes-valeurs',
    icon: 'clipboard',
    exact: false,
    permission: 'Listes_Read',
  },
  {
    label: 'Parametres',
    route: '/dashboard/admin/parametres',
    icon: 'filter',
    exact: false,
    permission: 'Parametres_Read',
  },
  {
    label: 'E-mails transactionnels',
    route: '/dashboard/admin/emails',
    icon: 'mail',
    exact: false,
    permission: 'Parametres_Read',
  },
  {
    label: 'Modeles de notification',
    route: '/dashboard/admin/modeles-notifications',
    icon: 'bell',
    exact: false,
    permission: 'ModelesNotifications_Read',
  },
  {
    label: 'Fichiers',
    route: '/dashboard/files',
    icon: 'file',
    exact: false,
    permission: 'Files_Read',
  },
  {
    label: 'Courriers',
    route: '/dashboard/courriers',
    icon: 'file',
    exact: false,
    permission: 'Courriers_Read',
  },
  {
    label: 'Courriers a signer',
    route: '/dashboard/courriers/a-signer',
    icon: 'file',
    exact: false,
    permission: 'Courriers_DeposerSigne',
  },
  {
    label: 'Demandes',
    route: '/dashboard/demandes',
    icon: 'clipboard',
    exact: false,
    permission: 'Demandes_Read',
  },
  {
    label: 'Suivis',
    route: '/dashboard/suivis',
    icon: 'clipboard',
    exact: false,
    permission: 'Suivis_Read',
  },
  {
    label: 'Autorisations à activer',
    route: '/dashboard/ctf/a-activer',
    icon: 'file',
    exact: false,
    permission: 'Ctf_Read',
    roles: ['CHEF_CTF', 'COLLABORATEUR_CTF'],
  },
  {
    label: 'Rapports',
    route: '/dashboard/rapports',
    icon: 'clipboard',
    exact: false,
    permission: 'Rapports_Read',
  },
  {
    label: 'Alertes',
    route: '/dashboard/alertes',
    icon: 'alert-triangle',
    exact: false,
    permission: 'Alertes_Read',
  },
  {
    label: 'Imports',
    route: '/dashboard/imports',
    icon: 'upload',
    exact: false,
    permission: 'Imports_Read',
  },
  {
    label: 'Rejets',
    route: '/dashboard/rejets',
    icon: 'alert-triangle',
    exact: false,
    permission: 'Rejets_Read',
  },
  {
    label: 'Contribuables',
    route: '/dashboard/contribuables',
    icon: 'user',
    exact: false,
    permission: 'Contribuables_Read',
  },
  {
    label: 'Adhesions',
    route: '/dashboard/adhesions',
    icon: 'clipboard',
    exact: false,
    permission: 'ComptesContribuables_Valider',
  },
  {
    label: 'Mes notifications',
    route: '/dashboard/my-notifications',
    icon: 'bell',
    exact: false,
  },
  {
    label: 'Audit',
    route: '/dashboard/audit',
    icon: 'clipboard',
    exact: false,
    permission: 'Audit_Read',
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
  readonly navigation = computed(() => {
    const roles = this.auth.currentUser()?.roles ?? [];
    const decideur = roles.some((role) =>
      ['DECIDEUR_DERAR', 'DECIDEUR_DVFN', 'DIRECTEUR_RATTACHEMENT'].includes(role),
    );
    if (decideur) {
      return [
        {
          label: 'Avis à rendre',
          route: '/dashboard/suivis',
          icon: 'clipboard' as const,
          exact: false,
          permission: 'Avis_Lire',
        },
      ].filter((item) => !item.permission || this.permissions.hasPermission(item.permission));
    }

    return NAVIGATION.filter((item) => {
      const byRole = item.roles?.some((role) => this.permissions.hasRole(role)) ?? false;
      return byRole || !item.permission || this.permissions.hasPermission(item.permission);
    });
  });

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

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

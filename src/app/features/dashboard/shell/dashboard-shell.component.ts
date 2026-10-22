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
import { NotificationCenterComponent } from '../../../core/components/notification-center/notification-center.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import type { IconName } from '../../../core/models/common/icon.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb/breadcrumb.service';

interface NavigationItem {
  label: string;
  route: string;
  icon: IconName;
  exact: boolean;
}

const NAVIGATION: readonly NavigationItem[] = [
  { label: 'Accueil', route: '/dashboard', icon: 'home', exact: true },
  { label: 'Design system', route: '/design-system-demo', icon: 'layout', exact: false },
  { label: 'Portail public', route: '/portail-public/suivi', icon: 'external-link', exact: false },
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
    NotificationCenterComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  private readonly auth = inject(AuthService);
  readonly breadcrumbs = inject(BreadcrumbService);
  readonly user = computed(() => this.auth.currentUser());
  readonly navigation = NAVIGATION;

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

import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app';
import { AuthService } from '../core/services/auth/auth.service';
import { CONTRIBUABLE_LOOKUP } from '../core/services/lookup/contribuable-lookup';
import { NotificationCenterService } from '../core/services/notifications/notification-center.service';
import { NotificationService } from '../core/services/notifications/notification.service';
import { ProblemStore } from '../core/services/errors/problem.store';
import { StorageService } from '../core/services/storage/storage.service';
import { ThemeService } from '../core/services/theme/theme.service';
import { UploadProgressService } from '../core/services/upload/upload-progress.service';
import { DashboardHomeComponent } from './dashboard/home/dashboard-home.component';
import { DashboardShellComponent } from './dashboard/shell/dashboard-shell.component';
import { DesignSystemDemoComponent } from './design-system/design-system-demo.component';
import { ErrorPageComponent } from './errors/error-page.component';
import { NotFoundComponent } from './errors/not-found.component';
import { UnauthorizedComponent } from './errors/unauthorized.component';
import { PortailPlaceholderComponent } from './portail/portail-placeholder.component';
import { PortailPublicComponent } from './portail-public/portail-public.component';

const user = { id: 'u', displayName: 'Demo', roles: [], permissions: [] };

function baseProviders() {
  return [
    provideRouter([]),
    { provide: PLATFORM_ID, useValue: 'browser' },
    StorageService,
    ThemeService,
    NotificationService,
    NotificationCenterService,
    UploadProgressService,
    { provide: CONTRIBUABLE_LOOKUP, useValue: { search: vi.fn(() => []) } },
  ];
}

describe('features Ã¢â‚¬â€ smoke', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('App', () => {
    TestBed.configureTestingModule({ imports: [App], providers: baseProviders() });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('DashboardHome', () => {
    TestBed.configureTestingModule({
      imports: [DashboardHomeComponent],
      providers: baseProviders(),
    });
    const fixture = TestBed.createComponent(DashboardHomeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tableau de bord');
  });

  it('DashboardShell', () => {
    TestBed.configureTestingModule({
      imports: [DashboardShellComponent],
      providers: [
        ...baseProviders(),
        {
          provide: AuthService,
          useValue: { currentUser: () => user, logoutAndRedirect: vi.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(DashboardShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#main-content')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Demo');
  });

  it('DashboardShell actions', () => {
    const logoutAndRedirect = vi.fn();
    TestBed.configureTestingModule({
      imports: [DashboardShellComponent],
      providers: [
        ...baseProviders(),
        {
          provide: AuthService,
          useValue: { currentUser: () => user, logoutAndRedirect },
        },
      ],
    });
    const fixture = TestBed.createComponent(DashboardShellComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleSidebar();
    expect(component.collapsed()).toBe(true);
    component.closeMobile();
    expect(component.mobileOpen()).toBe(false);
    component.onEscape();
    component.onResize();
    component.logout();
    expect(logoutAndRedirect).toHaveBeenCalledOnce();
  });

  it('PortailPublic', () => {
    TestBed.configureTestingModule({
      imports: [PortailPublicComponent],
      providers: baseProviders(),
    });
    const fixture = TestBed.createComponent(PortailPublicComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bientot disponible');
  });

  it('PortailPlaceholder', () => {
    TestBed.configureTestingModule({
      imports: [PortailPlaceholderComponent],
      providers: baseProviders(),
    });
    const fixture = TestBed.createComponent(PortailPlaceholderComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Squelette');
  });

  it('Pages d erreur', () => {
    TestBed.configureTestingModule({
      imports: [NotFoundComponent, UnauthorizedComponent, ErrorPageComponent],
      providers: [...baseProviders(), ProblemStore],
    });
    expect(TestBed.createComponent(NotFoundComponent)).toBeTruthy();
    expect(TestBed.createComponent(UnauthorizedComponent)).toBeTruthy();
    const error = TestBed.createComponent(ErrorPageComponent);
    error.detectChanges();
    expect(error.nativeElement.textContent).toContain('Une erreur');
  });

  it('DesignSystemDemo rend les sections et reagit aux commandes', async () => {
    TestBed.configureTestingModule({
      imports: [DesignSystemDemoComponent],
      providers: baseProviders(),
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(DesignSystemDemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Design system PDREF');
    expect(fixture.nativeElement.textContent).toContain('Tokens');

    component.setTableVariant('empty');
    expect(component.tableRows()).toHaveLength(0);
    component.setTableVariant('error');
    expect(component.tableProblem()?.code).toBe('DEMO_ERROR');
    component.setTableVariant('loading');
    expect(component.tableLoading()).toBe(true);
    component.resetTable();
    expect(component.tableVariant()).toBe('success');

    component.onSearch({ target: { value: 'DEMO-001' } } as unknown as Event);
    expect(component.tableState().filters['q']).toBe('DEMO-001');

    component.showErrorToast();
    component.showSuccessToast();
    component.onConfirmed();
    component.onInputConfirmed('motif de demonstration');
    expect(component.confirmOpen()).toBe(false);
    expect(component.confirmInputOpen()).toBe(false);

    component.simulateUpload();
    component.ngOnDestroy();
  });
});

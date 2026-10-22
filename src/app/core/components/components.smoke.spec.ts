import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { AmountFcfaComponent } from './amount-fcfa/amount-fcfa.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ConfirmDialogWithInputComponent } from './confirm-dialog-with-input/confirm-dialog-with-input.component';
import { ContribuableSelectComponent } from './contribuable-select/contribuable-select.component';
import { DataTableComponent } from './data-table/data-table.component';
import { EmptyIllustrationComponent } from './empty-illustration/empty-illustration.component';
import { ErrorFooterComponent } from './error-footer/error-footer.component';
import { FormGuideComponent } from './form-guide/form-guide.component';
import { IconComponent } from './icon/icon.component';
import { KpiCardComponent } from './kpi-card/kpi-card.component';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PhoneInputComponent } from './phone-input/phone-input.component';
import { SkeletonComponent } from './skeleton/skeleton.component';
import { StatePanelComponent } from './state-panel/state-panel.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { ToastHostComponent } from './toast-host/toast-host.component';
import { UploadFieldComponent } from './upload-field/upload-field.component';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import type { DataTableColumn, TableState } from '../models/table/table.model';
import { PLATFORM_ID } from '@angular/core';
import { CONTRIBUABLE_LOOKUP } from '../services/lookup/contribuable-lookup';
import { NotificationCenterService } from '../services/notifications/notification-center.service';
import { NotificationService } from '../services/notifications/notification.service';
import { StorageService } from '../services/storage/storage.service';
import { ThemeService } from '../services/theme/theme.service';
import { UploadProgressService } from '../services/upload/upload-progress.service';

interface Row {
  id: string;
  label: string;
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <pdref-data-table
      [columns]="columns"
      [rows]="rows"
      [state]="state"
      [totalCount]="total"
      [rowKey]="rowKey"
    />
  `,
})
class DataTableHost {
  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'label', header: 'Libelle', sortable: true },
  ];
  rows: readonly Row[] = [{ id: '1', label: 'Demo' }];
  readonly state: TableState = {
    page: 1,
    pageSize: 10,
    sort: null,
    direction: 'asc',
    filters: {},
  };
  readonly total = 1;
  readonly rowKey = (row: Row) => row.id;
}

function commonProviders() {
  return [
    { provide: PLATFORM_ID, useValue: 'browser' },
    StorageService,
    ThemeService,
    NotificationService,
    NotificationCenterService,
    UploadProgressService,
    { provide: CONTRIBUABLE_LOOKUP, useValue: { search: vi.fn(() => of([])) } },
  ];
}

describe('composants core — smoke', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('IconComponent', () => {
    TestBed.configureTestingModule({ imports: [IconComponent] });
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });

  it('StatusBadgeComponent', () => {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'DEMO_SUCCESS');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Termine');
  });

  it('EmptyIllustration, Skeleton et ErrorFooter', () => {
    TestBed.configureTestingModule({
      imports: [EmptyIllustrationComponent, SkeletonComponent, ErrorFooterComponent],
    });
    expect(TestBed.createComponent(EmptyIllustrationComponent)).toBeTruthy();
    const skeleton = TestBed.createComponent(SkeletonComponent);
    skeleton.componentRef.setInput('lines', 2);
    skeleton.detectChanges();
    expect(skeleton.nativeElement.querySelectorAll('.skeleton__line').length).toBe(2);

    const footer = TestBed.createComponent(ErrorFooterComponent);
    footer.componentRef.setInput('problem', {
      type: 'urn:pdref:error:X',
      title: 'X',
      status: 400,
      code: 'X',
      traceId: 'trace-x',
    });
    footer.detectChanges();
    expect(footer.nativeElement.textContent).toContain('trace-x');
  });

  it('StatePanelComponent', () => {
    TestBed.configureTestingModule({ imports: [StatePanelComponent] });
    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('state', 'empty');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun element');

    fixture.componentRef.setInput('state', 'error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Une erreur');
  });

  it('PageHeader et Breadcrumb', () => {
    TestBed.configureTestingModule({ imports: [PageHeaderComponent, BreadcrumbComponent] });
    const header = TestBed.createComponent(PageHeaderComponent);
    header.componentRef.setInput('title', 'Titre');
    header.detectChanges();
    expect(header.nativeElement.querySelector('h1')?.textContent).toContain('Titre');

    const breadcrumb = TestBed.createComponent(BreadcrumbComponent);
    breadcrumb.componentRef.setInput('items', [
      { label: 'Accueil', url: '/dashboard' },
      { label: 'Design' },
    ]);
    breadcrumb.detectChanges();
    expect(breadcrumb.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      "Fil d'Ariane",
    );
  });

  it('ThemeToggle', () => {
    TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: commonProviders(),
    });
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('AmountFcfaComponent', () => {
    TestBed.configureTestingModule({ imports: [AmountFcfaComponent] });
    const fixture = TestBed.createComponent(AmountFcfaComponent);
    fixture.componentRef.setInput('value', '1234567.5');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FCFA');
  });

  it('KpiCardComponent', () => {
    TestBed.configureTestingModule({ imports: [KpiCardComponent] });
    const fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('label', 'Indicateur');
    fixture.componentRef.setInput('value', '1000');
    fixture.componentRef.setInput('format', 'fcfa');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1\u202F000');
  });

  it('FormGuideComponent', () => {
    TestBed.configureTestingModule({ imports: [FormGuideComponent] });
    const fixture = TestBed.createComponent(FormGuideComponent);
    fixture.componentRef.setInput('steps', [{ label: 'Etape', status: 'current' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it('DataTableComponent', () => {
    TestBed.configureTestingModule({ imports: [DataTableHost] });
    const fixture = TestBed.createComponent(DataTableHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Demo');
  });

  it('PhoneInputComponent', () => {
    TestBed.configureTestingModule({ imports: [PhoneInputComponent] });
    const fixture = TestBed.createComponent(PhoneInputComponent);
    fixture.componentRef.setInput('label', 'Telephone');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="tel"]')).toBeTruthy();
  });

  it('ContribuableSelectComponent', () => {
    TestBed.configureTestingModule({
      imports: [ContribuableSelectComponent],
      providers: commonProviders(),
    });
    const fixture = TestBed.createComponent(ContribuableSelectComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[role="combobox"]')).toBeTruthy();
  });

  it('UploadFieldComponent', () => {
    TestBed.configureTestingModule({ imports: [UploadFieldComponent] });
    const fixture = TestBed.createComponent(UploadFieldComponent);
    fixture.componentRef.setInput('label', 'Documents');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('UploadProgressComponent', () => {
    TestBed.configureTestingModule({
      imports: [UploadProgressComponent],
      providers: commonProviders(),
    });
    const service = TestBed.inject(UploadProgressService);
    service.start();
    const fixture = TestBed.createComponent(UploadProgressComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it('NotificationCenterComponent', () => {
    TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: commonProviders(),
    });
    const fixture = TestBed.createComponent(NotificationCenterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('ToastHostComponent', () => {
    TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: commonProviders(),
    });
    const notifications = TestBed.inject(NotificationService);
    notifications.showProblem({
      type: 'urn:pdref:error:X',
      title: 'X',
      status: 400,
      detail: 'Detail',
      code: 'X',
      traceId: 'trace-x',
    });
    const fixture = TestBed.createComponent(ToastHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('trace-x');
  });

  it('ConfirmDialogComponent', () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeTruthy();
  });

  it('ConfirmDialogWithInputComponent', () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogWithInputComponent] });
    const fixture = TestBed.createComponent(ConfirmDialogWithInputComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeTruthy();
  });

  it('DataTable tombe en etat vide', () => {
    TestBed.configureTestingModule({ imports: [DataTableHost] });
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance as DataTableHost & { rows: readonly Row[] };
    host.rows = [];
    fixture.detectChanges();
    const table = fixture.debugElement.query(By.directive(DataTableComponent))
      .componentInstance as DataTableComponent<Row>;
    expect(table.rows()).toHaveLength(0);
  });
});

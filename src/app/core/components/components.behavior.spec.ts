import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { AmountFcfaComponent } from './amount-fcfa/amount-fcfa.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ConfirmDialogWithInputComponent } from './confirm-dialog-with-input/confirm-dialog-with-input.component';
import { ContribuableSelectComponent } from './contribuable-select/contribuable-select.component';
import { DataTableComponent } from './data-table/data-table.component';
import { FormGuideComponent } from './form-guide/form-guide.component';
import { KpiCardComponent } from './kpi-card/kpi-card.component';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { PhoneInputComponent } from './phone-input/phone-input.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ToastHostComponent } from './toast-host/toast-host.component';
import { UploadFieldComponent } from './upload-field/upload-field.component';
import type { DataTableColumn, TableState } from '../models/table/table.model';
import type { ApiProblemDetails } from '../models/common/api-problem.model';
import { CONTRIBUABLE_LOOKUP } from '../services/lookup/contribuable-lookup';
import { NotificationCenterService } from '../services/notifications/notification-center.service';
import { NotificationsGateway } from '../services/notifications/notifications.gateway';
import { NotificationService } from '../services/notifications/notification.service';

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
      [loading]="loading"
      [problem]="problem"
      [rowKey]="rowKey"
      (stateChange)="onState($event)"
      (retry)="retried = true"
    />
  `,
})
class Host {
  readonly columns: readonly DataTableColumn<Row>[] = [
    { key: 'label', header: 'Libelle', sortable: true },
  ];
  rows: readonly Row[] = [{ id: '1', label: 'Demo' }];
  state: TableState = {
    page: 1,
    pageSize: 10,
    sort: null,
    direction: 'asc',
    filters: {},
  };
  total = 30;
  loading = false;
  problem: ApiProblemDetails | null = null;
  retried = false;
  readonly rowKey = (row: Row) => row.id;

  onState(state: TableState): void {
    this.state = state;
  }
}

const problem: ApiProblemDetails = {
  type: 'urn:pdref:error:X',
  title: 'Erreur demo',
  status: 422,
  detail: 'Detail demo',
  code: 'X',
  traceId: 'trace-demo',
};

describe('composants core — comportement', () => {
  it('DataTable trie, pagine et change la taille de page', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const sortButton = fixture.nativeElement.querySelector('.sort-button') as HTMLButtonElement;
    sortButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.state.sort).toBe('label');
    expect(fixture.componentInstance.state.direction).toBe('asc');

    const next = fixture.nativeElement.querySelectorAll(
      '.pagination__controls button',
    )[1] as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.state.page).toBe(2);

    const select = fixture.nativeElement.querySelector(
      '.pagination__size select',
    ) as HTMLSelectElement;
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.state.pageSize).toBe(25);
  });

  it('DataTable affiche les etats chargement, erreur, vide', () => {
    TestBed.configureTestingModule({ imports: [Host] });

    const loadingFixture = TestBed.createComponent(Host);
    loadingFixture.componentInstance.loading = true;
    loadingFixture.detectChanges();
    expect(loadingFixture.nativeElement.textContent).toContain('Preparation des lignes');

    const errorFixture = TestBed.createComponent(Host);
    errorFixture.componentInstance.problem = problem;
    errorFixture.detectChanges();
    expect(errorFixture.nativeElement.textContent).toContain('Impossible de charger');

    const emptyFixture = TestBed.createComponent(Host);
    emptyFixture.componentInstance.rows = [];
    emptyFixture.detectChanges();
    expect(emptyFixture.nativeElement.textContent).toContain('Aucune donnee');
  });

  it('FormGuide calcule la progression des champs requis', () => {
    TestBed.configureTestingModule({ imports: [FormGuideComponent] });
    const fixture = TestBed.createComponent(FormGuideComponent);
    const form = new FormGroup({
      a: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      b: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('steps', [{ label: 'Etape', status: 'current' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.progress()).toBe(0);

    form.controls.a.setValue('x');
    fixture.detectChanges();
    expect(fixture.componentInstance.progress()).toBe(50);

    form.controls.b.setValue('y');
    fixture.detectChanges();
    expect(fixture.componentInstance.progress()).toBe(100);
  });

  it('ConfirmDialog confirme et annule', () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Titre');
    fixture.detectChanges();

    let confirmed = false;
    let cancelled = false;
    component.confirmed.subscribe(() => (confirmed = true));
    component.cancelled.subscribe(() => (cancelled = true));

    component.confirm();
    expect(confirmed).toBe(true);

    component.cancel();
    expect(cancelled).toBe(true);
  });

  it('ConfirmDialogWithInput valide la longueur du motif', () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogWithInputComponent] });
    const fixture = TestBed.createComponent(ConfirmDialogWithInputComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('minLength', 5);
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    let value: string | null = null;
    component.confirmed.subscribe((result) => (value = result));

    component.onInput({ target: { value: 'abcd' } } as unknown as Event);
    component.confirm();
    expect(component.invalid()).toBe(true);
    expect(value).toBeNull();

    component.onInput({ target: { value: 'abcde' } } as unknown as Event);
    component.confirm();
    expect(value).toBe('abcde');
  });

  it('UploadField valide type et taille puis retire un fichier', () => {
    TestBed.configureTestingModule({ imports: [UploadFieldComponent] });
    const fixture = TestBed.createComponent(UploadFieldComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('accept', 'application/pdf');
    fixture.componentRef.setInput('maxSizeBytes', 4);
    fixture.detectChanges();

    let selected = 0;
    component.filesSelected.subscribe((files) => (selected = files.length));

    const invalidType = new File(['x'], 'a.txt', { type: 'text/plain' });
    component.onFileInput({ target: { files: [invalidType], value: '' } } as unknown as Event);
    expect(component.error()).toContain('format');

    const tooBig = new File(['12345'], 'a.pdf', { type: 'application/pdf' });
    component.onFileInput({ target: { files: [tooBig], value: '' } } as unknown as Event);
    expect(component.error()).toContain('taille');

    const valid = new File(['123'], 'a.pdf', { type: 'application/pdf' });
    component.onFileInput({ target: { files: [valid], value: '' } } as unknown as Event);
    expect(component.files()).toHaveLength(1);
    expect(selected).toBe(1);

    component.remove(0);
    expect(component.files()).toHaveLength(0);
  });

  it('PhoneInput convertit en E.164 et signale une erreur', () => {
    TestBed.configureTestingModule({ imports: [PhoneInputComponent] });
    const fixture = TestBed.createComponent(PhoneInputComponent);
    const component = fixture.componentInstance;

    component.writeValue('+2250700000000');
    expect(component.iso()).toBe('CI');
    expect(component.national()).toBe('0700000000');

    component.onNationalInput({ target: { value: '0700000000' } } as unknown as Event);
    expect(component.e164()).toBe('+2250700000000');
    expect(component.error()).toBeNull();

    component.onNationalInput({ target: { value: '123' } } as unknown as Event);
    expect(component.error()).toBeTruthy();
  });

  it('ContribuableSelect recherche et selectionne', async () => {
    const lookup = { search: vi.fn(() => of([{ id: '1', label: 'Demo' }])) };
    TestBed.configureTestingModule({
      imports: [ContribuableSelectComponent],
      providers: [{ provide: CONTRIBUABLE_LOOKUP, useValue: lookup }],
    });
    const fixture = TestBed.createComponent(ContribuableSelectComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onInput({ target: { value: 'de' } } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 300));
    fixture.detectChanges();

    expect(lookup.search).toHaveBeenCalled();
    expect(component.results()).toHaveLength(1);

    component.choose(component.results()[0]!);
    expect(component.selected()?.label).toBe('Demo');
    expect(component.open()).toBe(false);
  });

  it('KpiCard gere succes, vide, erreur et chargement', () => {
    TestBed.configureTestingModule({ imports: [KpiCardComponent] });
    const fixture = TestBed.createComponent(KpiCardComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Indicateur');
    fixture.componentRef.setInput('value', '1234');
    fixture.componentRef.setInput('format', 'fcfa');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FCFA');

    fixture.componentRef.setInput('state', 'empty');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucune donnee');

    fixture.componentRef.setInput('state', 'error');
    fixture.componentRef.setInput('problem', problem);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Indicateur');

    fixture.componentRef.setInput('state', 'loading');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.skeleton')).toBeTruthy();
    expect(component.state()).toBe('loading');
  });

  it('NotificationCenter ouvre, marque et ferme', () => {
    TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        NotificationCenterService,
        {
          provide: NotificationsGateway,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 10, totalCount: 0 }),
            unreadCount: () => of(0),
            markRead: () => of({}),
            markAllRead: () => of({ count: 1 }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(NotificationCenterComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.open()).toBe(false);

    component.toggle();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('#notification-panel')).toBeTruthy();

    component.markAllRead();
    expect(component.service.unreadCount()).toBe(0);

    component.close();
    expect(component.open()).toBe(false);
  });

  it('ToastHost affiche et ferme un problem+json', () => {
    TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: [NotificationService],
    });
    const notifications = TestBed.inject(NotificationService);
    notifications.showProblem(problem);
    const fixture = TestBed.createComponent(ToastHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('trace-demo');
    const close = fixture.nativeElement.querySelector('.toast__close') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(notifications.toasts()).toHaveLength(0);
  });

  it('StatusBadge expose le libelle et le ton', () => {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'DEMO_DANGER');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Erreur');
    expect(fixture.nativeElement.querySelector('.status-badge--danger')).toBeTruthy();
  });

  it('AmountFcfa gere chargement et erreur', () => {
    TestBed.configureTestingModule({ imports: [AmountFcfaComponent] });
    const fixture = TestBed.createComponent(AmountFcfaComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.amount-skeleton')).toBeTruthy();

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('—');
  });

  it('DataTable emet retry en erreur', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.problem = problem;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.state-panel button') as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.retried).toBe(true);

    const table = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(table).toBeTruthy();
  });
});

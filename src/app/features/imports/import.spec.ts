import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ImportErrorPage,
  ImportJob,
  ImportJobDetail,
  ImportPage,
} from '../../core/models/imports/import.model';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { ImportGateway } from '../../core/services/imports/import.gateway';
import { ImportDetailPageComponent } from './import-detail-page.component';
import { ImportsListPageComponent } from './imports-list-page.component';

const job: ImportJob = {
  id: 'i1',
  fileName: 'fichier.xlsx',
  templateVersion: 1,
  statut: 'TERMINE',
  totalLignes: 20,
  importees: 19,
  rejetees: 1,
  dejaImportees: 0,
  erreurs: 1,
  nextLigne: 21,
  dateCreation: '2026-11-05T00:00:00Z',
  startedAt: '2026-11-05T00:00:05Z',
  completedAt: '2026-11-05T00:00:20Z',
  lastErrorCode: null,
};

const detail: ImportJobDetail = { ...job, fileSha256: 'sha' };
const page: ImportPage = { items: [job], page: 1, pageSize: 20, totalCount: 1 };
const errors: ImportErrorPage = {
  items: [
    {
      id: 'e1',
      ligne: 11,
      colonne: 'dateDepot',
      motif: 'DATE_INVALIDE',
      valeurBrute: '11/25/2026',
    },
  ],
  page: 1,
  pageSize: 50,
  totalCount: 1,
};

function providers(permissions: string[]) {
  const permissionService = new PermissionsService();
  permissionService.load({
    id: 'u1',
    login: 'u',
    displayName: 'User',
    roles: ['AGENT_GUDEF'],
    permissions,
    mustChangePassword: false,
  });
  return [
    provideRouter([]),
    { provide: PermissionsService, useValue: permissionService },
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { paramMap: convertToParamMap({ id: 'i1' }) } },
    },
  ];
}

describe('Pages Imports', () => {
  const gateway = {
    list: vi.fn(() => of(page)),
    get: vi.fn(() => of(detail)),
    errors: vi.fn(() => of(errors)),
    upload: vi.fn(() => of(detail)),
    downloadTemplate: vi.fn(() => of({ blob: new Blob(['x']), fileName: 'template.xlsx' })),
    downloadReport: vi.fn(() => of({ blob: new Blob(['x']), fileName: 'rapport.xlsx' })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    gateway.list.mockReturnValue(of(page));
    gateway.get.mockReturnValue(of(detail));
    gateway.errors.mockReturnValue(of(errors));
    gateway.upload.mockReturnValue(of(detail));
    gateway.downloadTemplate.mockReturnValue(
      of({ blob: new Blob(['x']), fileName: 'template.xlsx' }),
    );
    gateway.downloadReport.mockReturnValue(of({ blob: new Blob(['x']), fileName: 'rapport.xlsx' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('liste, filtre, upload et telechargements', () => {
    TestBed.configureTestingModule({
      imports: [ImportsListPageComponent],
      providers: [
        ...providers(['Imports_Read', 'Imports_Execute']),
        { provide: ImportGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(ImportsListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.page().items).toHaveLength(1);
    expect(component.canExecute()).toBe(true);
    expect(component.statutLabel('TERMINE')).toBe('Terminé');
    const search = document.createElement('input');
    search.value = 'fichier';
    component.onSearch({ target: search } as unknown as Event);
    const statut = document.createElement('select');
    statut.value = 'TERMINE';
    component.onStatut({ target: statut } as unknown as Event);
    component.onFiles([new File(['x'], 'fichier.xlsx')]);
    expect(gateway.upload).toHaveBeenCalled();
    component.downloadTemplate();
    component.downloadReport(job);
    expect(gateway.downloadTemplate).toHaveBeenCalled();
    expect(gateway.downloadReport).toHaveBeenCalledWith('i1');
  });

  it('masque l upload sans permission', () => {
    TestBed.configureTestingModule({
      imports: [ImportsListPageComponent],
      providers: [...providers(['Imports_Read']), { provide: ImportGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(ImportsListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.canExecute()).toBe(false);
    component.onFiles([new File(['x'], 'fichier.xlsx')]);
    expect(gateway.upload).not.toHaveBeenCalled();
  });

  it('couvre les chemins d erreur', () => {
    gateway.list.mockReturnValue(throwError(() => new Error('liste')));
    gateway.upload.mockReturnValue(throwError(() => new Error('upload')));
    gateway.downloadTemplate.mockReturnValue(throwError(() => new Error('template')));
    gateway.downloadReport.mockReturnValue(throwError(() => new Error('rapport')));
    TestBed.configureTestingModule({
      imports: [ImportsListPageComponent],
      providers: [
        ...providers(['Imports_Read', 'Imports_Execute']),
        { provide: ImportGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(ImportsListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.problem()).not.toBeNull();
    component.onFiles([new File(['x'], 'fichier.xlsx')]);
    component.onFiles([]);
    component.downloadTemplate();
    component.downloadReport(job);
    expect(component.problem()).not.toBeNull();
  });

  it('couvre les erreurs du detail', () => {
    gateway.get.mockReturnValue(throwError(() => new Error('detail')));
    TestBed.configureTestingModule({
      imports: [ImportDetailPageComponent],
      providers: [...providers(['Imports_Read']), { provide: ImportGateway, useValue: gateway }],
    });
    const detailFixture = TestBed.createComponent(ImportDetailPageComponent);
    detailFixture.detectChanges();
    const detailComponent = detailFixture.componentInstance;
    expect(detailComponent.problem()).not.toBeNull();
    detailComponent.downloadReport();
    expect(detailComponent.problem()).not.toBeNull();
  });
  it('charge le detail et les erreurs', () => {
    TestBed.configureTestingModule({
      imports: [ImportDetailPageComponent],
      providers: [...providers(['Imports_Read']), { provide: ImportGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(ImportDetailPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.item()).not.toBeNull();
    expect(component.errors().items).toHaveLength(1);
    const colonne = document.createElement('input');
    colonne.value = 'dateDepot';
    component.onColonne({ target: colonne } as unknown as Event);
    const motif = document.createElement('input');
    motif.value = 'DATE_INVALIDE';
    component.onMotif({ target: motif } as unknown as Event);
    component.downloadReport();
    expect(gateway.downloadReport).toHaveBeenCalledWith('i1');
    expect(component.statutLabel('TERMINE')).toBe('Terminé');
  });
});

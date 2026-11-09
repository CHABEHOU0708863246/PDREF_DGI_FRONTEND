import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { RapportExport, RapportResponse } from '../../../core/models/rapports/rapport.model';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { RapportGateway } from '../../../core/services/rapports/rapport.gateway';
import { RapportsPageComponent } from './rapports-page.component';

const report: RapportResponse = {
  type: 'MENSUEL',
  libelle: 'Mois de 11/2026',
  dateDu: '2026-11-01',
  dateAu: '2026-11-30',
  lignes: [
    {
      directionId: 'GUDEF',
      directionLibelle: 'GUDEF',
      formulees: 4,
      traitees: 3,
      tauxTraitement: 75,
      favorables: 2,
      tauxReponseFavorable: 66.666,
      stockGlobal: 1,
    },
  ],
  legende: ['Taux de traitement = traitees / formulees.'],
};

const exportItem: RapportExport = {
  id: 'e1',
  format: 'PDF',
  type: 'MENSUEL',
  dateDu: '2026-11-01',
  dateAu: '2026-11-30',
  directionId: null,
  statut: 'PRET',
  fileName: 'rapport.pdf',
  createdAt: '2026-11-09T10:00:00Z',
  completedAt: '2026-11-09T10:01:00Z',
  expiresAt: '2026-12-09T10:01:00Z',
  errorMessage: null,
};

describe('RapportsPageComponent', () => {
  it('affiche les taux, la legende et les exports', () => {
    const gateway = {
      get: vi.fn(() => of(report)),
      exports: vi.fn(() => of([exportItem])),
      createExport: vi.fn(() => of(exportItem)),
      download: vi.fn(() => of(new Blob(['pdf']))),
    };
    const permissions = new PermissionsService();
    permissions.load({
      id: 'u1',
      login: 'u',
      displayName: 'User',
      roles: ['DG'],
      permissions: ['Rapports_Read', 'Rapports_Generate', 'Rapports_Export'],
      mustChangePassword: false,
    });
    TestBed.configureTestingModule({
      imports: [RapportsPageComponent],
      providers: [
        provideRouter([]),
        { provide: RapportGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions },
      ],
    });
    const fixture = TestBed.createComponent(RapportsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.report()?.lignes[0].tauxTraitement).toBe(75);
    expect(component.formatRate(75)).toBe('75,0 %');
    expect(component.formatRate(null)).toBe('—');
    expect(component.exports()).toHaveLength(1);
    expect(component.canExport()).toBe(true);
    component.createExport();
    expect(gateway.createExport).toHaveBeenCalled();
    component.onType({ target: { value: 'ANNUEL' } } as unknown as Event);
    expect(component.type()).toBe('ANNUEL');
    component.onFormat({ target: { value: 'WORD' } } as unknown as Event);
    expect(component.format()).toBe('WORD');
    component.onDateReference({ target: { value: '2026-11-10' } } as unknown as Event);
    component.onDateDu({ target: { value: '2026-11-01' } } as unknown as Event);
    component.onDateAu({ target: { value: '2026-11-30' } } as unknown as Event);
    component.onDirection({ target: { value: 'GUDEF' } } as unknown as Event);
    component.loadExports();
    expect(component.statutLabel('PRET')).toBe('Pret');
    expect(component.formatDate('2026-11-09')).toContain('2026');
    expect(gateway.exports).toHaveBeenCalled();
  });

  it('gere les erreurs et le telechargement', () => {
    const gateway = {
      get: vi.fn(() => throwError(() => new Error('load'))),
      exports: vi.fn(() => throwError(() => new Error('exports'))),
      createExport: vi.fn(() => throwError(() => new Error('export'))),
      download: vi.fn(() => of(new Blob(['pdf']))),
    };
    const permissions = new PermissionsService();
    permissions.load({
      id: 'u1',
      login: 'u',
      displayName: 'User',
      roles: ['DG'],
      permissions: ['Rapports_Read', 'Rapports_Generate', 'Rapports_Export'],
      mustChangePassword: false,
    });
    TestBed.configureTestingModule({
      imports: [RapportsPageComponent],
      providers: [
        provideRouter([]),
        { provide: RapportGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions },
      ],
    });
    const fixture = TestBed.createComponent(RapportsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.problem()).not.toBeNull();
    component.createExport();
    expect(gateway.createExport).toHaveBeenCalled();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    component.download(exportItem);
    expect(gateway.download).toHaveBeenCalledWith('e1');
  });
});

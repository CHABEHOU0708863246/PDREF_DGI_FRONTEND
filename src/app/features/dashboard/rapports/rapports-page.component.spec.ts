import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type {
  RapportExport,
  RapportStatistiques,
} from '../../../core/models/rapports/rapport.model';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { RapportGateway } from '../../../core/services/rapports/rapport.gateway';
import { RapportsPageComponent } from './rapports-page.component';

const stats: RapportStatistiques = {
  type: 'ANNUEL',
  libelle: 'Annee 2026',
  dateDu: '2026-01-01',
  dateAu: '2026-12-31',
  dateDuPrecedent: '2025-01-01',
  dateAuPrecedent: '2025-12-31',
  kpis: {
    formulees: 16,
    traitees: 6,
    tauxTraitement: 37.5,
    favorables: 3,
    tauxReponseFavorable: 50,
    stockGlobal: 10,
    formuleesPrecedent: 8,
    traiteesPrecedent: 4,
    favorablesPrecedent: 2,
    stockGlobalPrecedent: 4,
  },
  evolution: [{ label: 'Janv.', courant: 2, precedent: 1 }],
  sections: [
    {
      code: 'SYSTEME_COMPTABLE',
      titre: 'Repartition par systeme comptable',
      lignes: [
        { code: 'NORMAL', libelle: 'Normal/OHADA', courant: 8, precedent: 3, ecart: 5 },
        { code: 'TOTAL', libelle: 'Total', courant: 8, precedent: 3, ecart: 5, estTotal: true },
      ],
    },
  ],
  avis: [
    {
      code: 'DERAR',
      libelle: 'DERAR',
      favorables: 7,
      nonFavorables: 2,
      total: 9,
      precedent: 5,
      ecart: 4,
    },
  ],
  directions: [
    {
      directionId: 'DME',
      directionLibelle: 'DME',
      formulees: 1,
      traitees: 0,
      tauxTraitement: 0,
      favorables: 0,
      tauxReponseFavorable: null,
      stockGlobal: 1,
    },
  ],
  legende: ['Formulee = demande deposee pendant la periode.'],
};

const exportItem: RapportExport = {
  id: 'e1',
  format: 'PDF',
  type: 'ANNUEL',
  dateDu: '2026-01-01',
  dateAu: '2026-12-31',
  directionId: null,
  statut: 'PRET',
  fileName: 'rapport.pdf',
  createdAt: '2026-11-09T10:00:00Z',
  completedAt: '2026-11-09T10:01:00Z',
  expiresAt: '2026-12-09T10:01:00Z',
  errorMessage: null,
};

function permissions(): PermissionsService {
  const service = new PermissionsService();
  service.load({
    id: 'u1',
    login: 'u',
    displayName: 'User',
    roles: ['DG'],
    permissions: ['Rapports_Read', 'Rapports_Generate', 'Rapports_Export'],
    mustChangePassword: false,
  });
  return service;
}

describe('RapportsPageComponent', () => {
  it('affiche les statistiques, les taux, la legende et les exports', () => {
    const gateway = {
      statistiques: vi.fn(() => of(stats)),
      exports: vi.fn(() => of([exportItem])),
      createExport: vi.fn(() => of(exportItem)),
      download: vi.fn(() => of(new Blob(['pdf']))),
    };
    TestBed.configureTestingModule({
      imports: [RapportsPageComponent],
      providers: [
        provideRouter([]),
        { provide: RapportGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions() },
      ],
    });
    const fixture = TestBed.createComponent(RapportsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.stats()?.kpis.formulees).toBe(16);
    expect(component.kpiCards()).toHaveLength(6);
    expect(component.evolutionSeries()).toHaveLength(1);
    expect(component.donutFor(stats.sections[0])).toHaveLength(1);
    expect(component.formatRate(75)).toBe('75,0 %');
    expect(component.formatRate(null)).toBe('—');
    expect(component.formatEcart(5)).toBe('+5');
    expect(component.formatEcart(-2)).toBe('-2');
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
    component.onDirection({ target: { value: 'DME' } } as unknown as Event);
    component.loadExports();
    expect(component.statutLabel('PRET')).toBe('Pret');
    expect(component.formatDate('2026-11-09')).toContain('2026');
    expect(gateway.exports).toHaveBeenCalled();
  });

  it('gere les erreurs et le telechargement', () => {
    const gateway = {
      statistiques: vi.fn(() => throwError(() => new Error('load'))),
      exports: vi.fn(() => throwError(() => new Error('exports'))),
      createExport: vi.fn(() => throwError(() => new Error('export'))),
      download: vi.fn(() => of(new Blob(['pdf']))),
    };
    TestBed.configureTestingModule({
      imports: [RapportsPageComponent],
      providers: [
        provideRouter([]),
        { provide: RapportGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions() },
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

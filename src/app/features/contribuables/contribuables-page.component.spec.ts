import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ContribuablesPageComponent } from './contribuables-page.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';

const item = {
  id: 'c1',
  ncc: '1234567A',
  raisonSociale: 'Client Alpha',
  systemeComptable: 'SYSCOHADA',
  centreImpotId: 'c1',
  centreImpotLibelle: 'GUDEF',
  directionRattachementId: 'd1',
  directionRattachementLibelle: 'GUDEF',
  secteur: null,
  formeJuridique: null,
  zoneId: null,
  adresse: null,
  emailMasque: 'j***@example.ci',
  telephoneMasque: null,
  email: null,
  telephone: null,
  emailManquant: false,
  telephoneManquant: true,
  nccHorsFormat: false,
  centreRattachementManquant: false,
  evalueLe: '2026-11-01T00:00:00Z',
  isArchived: false,
  archivedAt: null,
};

function setup() {
  const gateway = {
    list: vi.fn(() => of({ items: [item], page: 1, pageSize: 20, totalCount: 1 })),
    quality: vi.fn(() =>
      of({
        total: 1,
        sansEmail: 0,
        sansTelephone: 1,
        sansCentre: 0,
        nccHorsFormat: 0,
        pourcentageSansEmail: 0,
        pourcentageSansTelephone: 100,
        pourcentageSansCentre: 0,
        pourcentageNccHorsFormat: 0,
      }),
    ),
    export: vi.fn(() => of({ blob: new Blob(['x']), fileName: 'contribuables.xlsx' })),
  };
  TestBed.configureTestingModule({
    imports: [ContribuablesPageComponent],
    providers: [{ provide: ContribuablesGateway, useValue: gateway }],
  });
  return { fixture: TestBed.createComponent(ContribuablesPageComponent), gateway };
}

describe('ContribuablesPageComponent', () => {
  it('charge la liste et la qualite', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    expect(gateway.list).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Client Alpha');
  });

  it('recharge avec les filtres et exporte', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.filters.sansEmail = true;
    fixture.componentInstance.load(1);
    expect(gateway.list).toHaveBeenCalledTimes(2);
    fixture.componentInstance.export();
    expect(gateway.export).toHaveBeenCalledWith({ ...fixture.componentInstance.filters }, 'xlsx');
  });
});

describe('ContribuablesPageComponent helpers', () => {
  it('calcule les pages et gere les erreurs', () => {
    const gateway = {
      list: vi.fn(() => of({ items: [], page: 1, pageSize: 20, totalCount: 41 })),
      quality: vi.fn(() => of(null)),
      export: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ContribuablesPageComponent],
      providers: [{ provide: ContribuablesGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(ContribuablesPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.pageCount()).toBe(3);
  });
});

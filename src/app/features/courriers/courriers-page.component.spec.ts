import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CourriersPageComponent } from './courriers-page.component';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';

const item = {
  id: 'cr1',
  sens: 'ENTRANT' as const,
  typeCourrier: 'COURRIER' as const,
  numero: 'C-001',
  dateArrivee: '2026-11-05T00:00:00Z',
  dateEmission: null,
  references: null,
  expediteur: 'DGI',
  objet: 'Objet Alpha',
  imputation: 'GUDEF',
  estLie: true,
  contribuable: { id: 'c1', ncc: null, nccMasque: '123****7A', raisonSociale: 'Client Alpha' },
  createdAt: '2026-11-05T00:00:00Z',
};

function setup(canCreate = true) {
  const gateway = {
    list: vi.fn(() => of({ items: [item], page: 1, pageSize: 20, totalCount: 21 })),
  };
  const permissions = { hasPermission: vi.fn(() => canCreate) };
  TestBed.configureTestingModule({
    imports: [CourriersPageComponent],
    providers: [
      { provide: CourriersGateway, useValue: gateway },
      { provide: PermissionsService, useValue: permissions },
    ],
  });
  return { fixture: TestBed.createComponent(CourriersPageComponent), gateway, permissions };
}

describe('CourriersPageComponent', () => {
  it('charge la liste et la pagination', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.componentInstance.pages()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Objet Alpha');
    expect(fixture.nativeElement.textContent).toContain('Lie');
  });

  it('applique les filtres, la page et le droit de creation', () => {
    const { fixture, gateway } = setup(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.canCreate()).toBe(false);
    fixture.componentInstance.filters.typeCourrier = 'PORTAIL';
    fixture.componentInstance.filters.lie = 'false';
    fixture.componentInstance.load(2);
    expect(gateway.list).toHaveBeenCalledTimes(2);
    const calls = gateway.list.mock.calls as unknown as Array<
      [{ page: number; lie: boolean | null; typeCourrier: string }]
    >;
    const query = calls[1][0];
    expect(query.page).toBe(2);
    expect(query.lie).toBe(false);
    expect(query.typeCourrier).toBe('PORTAIL');
    fixture.componentInstance.reset();
    expect(fixture.componentInstance.filters.typeCourrier).toBe('');
  });
});

describe('CourriersPageComponent helpers', () => {
  it('expose les libelles, le droit et la reinitialisation', () => {
    const { fixture } = setup(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.canCreate()).toBe(true);
    expect(fixture.componentInstance.typeLabel('COURRIER')).toBe('Courrier');
    expect(fixture.componentInstance.typeLabel('REPONSE_DGI')).toBe('Reponse DGI');
    expect(fixture.componentInstance.sensLabel('ENTRANT')).toBe('Entrant');
    expect(fixture.componentInstance.sensLabel('SORTANT')).toBe('Sortant');
    fixture.componentInstance.filters.search = 'abc';
    fixture.componentInstance.reset();
    expect(fixture.componentInstance.filters.search).toBe('');
  });
});

describe('CourriersPageComponent errors', () => {
  it('affiche une erreur de chargement', () => {
    const gateway = { list: vi.fn(() => throwError(() => new Error('boom'))) };
    const permissions = { hasPermission: vi.fn(() => true) };
    TestBed.configureTestingModule({
      imports: [CourriersPageComponent],
      providers: [
        { provide: CourriersGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions },
      ],
    });
    const fixture = TestBed.createComponent(CourriersPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.problem()).not.toBeNull();
  });
});

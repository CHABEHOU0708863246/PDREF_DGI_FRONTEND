import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ContribuableFormPageComponent } from './contribuable-form-page.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';

function setup() {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const gateway = {
    create: vi.fn(() => of({ id: 'c1' })),
    update: vi.fn(),
    get: vi.fn(),
    centres: vi.fn(() => of([{ id: 'd1', code: 'GUDEF', libelle: 'GUDEF' }])),
  };
  TestBed.configureTestingModule({
    imports: [ContribuableFormPageComponent],
    providers: [
      { provide: ContribuablesGateway, useValue: gateway },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
    ],
  });
  return { fixture: TestBed.createComponent(ContribuableFormPageComponent), gateway, router };
}

describe('ContribuableFormPageComponent', () => {
  it('signale les champs obligatoires absents', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.save();
    expect(fixture.componentInstance.problem()?.code).toBe('VALIDATION_FAILED');
  });

  it('annule et revient a la liste', () => {
    const { fixture, router } = setup();
    fixture.detectChanges();
    fixture.componentInstance.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/contribuables']);
  });

  it('cree une fiche valide et navigue vers le detail', () => {
    const { fixture, gateway, router } = setup();
    fixture.detectChanges();
    Object.assign(fixture.componentInstance.form, {
      ncc: '1234567A',
      raisonSociale: 'Client',
      systemeComptable: 'SYSCOHADA',
      centreImpotId: 'GUDEF',
    });
    fixture.componentInstance.save();
    expect(gateway.create).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/contribuables', 'c1']);
  });
});

describe('ContribuableFormPageComponent load/edit', () => {
  it('charge et sauvegarde une fiche existante', () => {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const gateway = {
      get: vi.fn(() =>
        of({
          id: 'c1',
          ncc: '1234567A',
          raisonSociale: 'Client',
          systemeComptable: 'SYSCOHADA',
          centreImpotId: 'GUDEF',
          centreImpotLibelle: 'GUDEF',
          directionRattachementId: 'd1',
          directionRattachementLibelle: 'GUDEF',
          secteur: null,
          formeJuridique: null,
          zoneId: null,
          adresse: null,
          emailMasque: null,
          telephoneMasque: null,
          email: null,
          telephone: null,
          emailManquant: true,
          telephoneManquant: true,
          nccHorsFormat: false,
          centreRattachementManquant: false,
          evalueLe: '2026-11-01T00:00:00Z',
          isArchived: false,
          archivedAt: null,
        }),
      ),
      create: vi.fn(),
      update: vi.fn(() => of({ id: 'c1' })),
      centres: vi.fn(() => of([{ id: 'd1', code: 'GUDEF', libelle: 'GUDEF' }])),
    };
    TestBed.configureTestingModule({
      imports: [ContribuableFormPageComponent],
      providers: [
        { provide: ContribuablesGateway, useValue: gateway },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'c1' } } } },
      ],
    });
    const fixture = TestBed.createComponent(ContribuableFormPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.form.ncc).toBe('1234567A');
    fixture.componentInstance.save();
    expect(gateway.update).toHaveBeenCalledWith('c1', expect.objectContaining({ ncc: '1234567A' }));
  });
});

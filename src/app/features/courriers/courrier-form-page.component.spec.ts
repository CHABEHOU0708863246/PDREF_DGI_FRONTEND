import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CourrierFormPageComponent } from './courrier-form-page.component';
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
  objet: 'Objet',
  imputation: 'GUDEF',
  estLie: false,
  contribuable: null,
  createdAt: '2026-11-05T00:00:00Z',
  instructionsDirecteur: 'Instruction C3',
  annotationsSdGudef: 'Annotation C3',
  demandeId: null,
  signatureStatut: null,
  signatureReference: null,
  signatureLe: null,
  depotEImpotsStatut: null,
  depotEImpotsLe: null,
  referenceDepot: null,
  updatedAt: null,
  version: 1,
};

function setup(id: string | null = null, internal = true) {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const gateway = {
    create: vi.fn(() => of(item)),
    update: vi.fn(() => of(item)),
    get: vi.fn(() => of(item)),
    expediteurs: vi.fn(() => of(['DGI'])),
  };
  const permissions = {
    hasPermission: vi.fn((permission: string) =>
      internal ? permission === 'Courriers_ReadInternal' : permission !== 'Courriers_ReadInternal',
    ),
  };
  TestBed.configureTestingModule({
    imports: [CourrierFormPageComponent],
    providers: [
      { provide: CourriersGateway, useValue: gateway },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      { provide: PermissionsService, useValue: permissions },
    ],
  });
  return {
    fixture: TestBed.createComponent(CourrierFormPageComponent),
    gateway,
    router,
    permissions,
  };
}

describe('CourrierFormPageComponent', () => {
  it('valide les champs et les dates', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.form.numero = 'C-001';
    fixture.componentInstance.form.expediteur = 'DGI';
    fixture.componentInstance.form.objet = 'Objet';
    fixture.componentInstance.form.dateArrivee = '2099-01-01';
    fixture.componentInstance.save();
    expect(fixture.componentInstance.problem()?.code).toBe('VALIDATION_FAILED');
    fixture.componentInstance.form.dateArrivee = '2026-11-05';
    fixture.componentInstance.form.instructionsDirecteur = 'C3';
    fixture.componentInstance.save();
    expect(fixture.componentInstance.problem()?.code).not.toBe('VALIDATION_FAILED');
    expect(fixture.componentInstance.form.instructionsDirecteur).toBe('C3');
  });

  it('cree un courrier et navigue vers la fiche', () => {
    const { fixture, gateway, router } = setup();
    fixture.detectChanges();
    fixture.componentInstance.form.numero = 'C-002';
    fixture.componentInstance.form.expediteur = 'DGI';
    fixture.componentInstance.form.objet = 'Objet';
    fixture.componentInstance.save();
    expect(gateway.create).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/courriers', 'cr1']);
  });

  it('charge une fiche et met a jour les champs', () => {
    const { fixture, gateway } = setup('cr1', true);
    fixture.detectChanges();
    expect(gateway.get).toHaveBeenCalledWith('cr1');
    expect(fixture.componentInstance.item()?.numero).toBe('C-001');
    expect(fixture.componentInstance.form.instructionsDirecteur).toBe('Instruction C3');
    fixture.componentInstance.form.objet = 'Objet modifie';
    fixture.componentInstance.save();
    expect(gateway.update).toHaveBeenCalledWith(
      'cr1',
      expect.objectContaining({ objet: 'Objet modifie' }),
    );
  });

  it('masque les champs C3 sans permission', () => {
    const { fixture } = setup('cr1', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.canInternal()).toBe(false);
    expect(fixture.componentInstance.form.instructionsDirecteur).toBe('Instruction C3');
    fixture.componentInstance.form.instructionsDirecteur = '';
    fixture.componentInstance.form.objet = 'Objet modifie';
    fixture.componentInstance.save();
    const payload = (
      fixture.componentInstance as unknown as { updatePayload: () => object }
    ).updatePayload();
    expect(payload).not.toHaveProperty('instructionsDirecteur');
  });
});

describe('CourrierFormPageComponent helpers', () => {
  it('annule, gere l expediteur et valide le sens sortant', () => {
    const { fixture, router } = setup();
    fixture.detectChanges();
    fixture.componentInstance.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/courriers']);
    const input = document.createElement('input');
    input.value = 'DG';
    fixture.componentInstance.onExpediteurInput({ target: input } as unknown as Event);

    fixture.componentInstance.form.sens = 'SORTANT';
    fixture.componentInstance.form.dateArrivee = null;
    fixture.componentInstance.form.dateEmission = null;
    fixture.componentInstance.form.numero = 'C-003';
    fixture.componentInstance.form.expediteur = 'DGI';
    fixture.componentInstance.form.objet = 'Objet';
    fixture.componentInstance.save();
    expect(fixture.componentInstance.problem()?.code).toBe('VALIDATION_FAILED');
  });

  it('ne propose pas le lien contribuable sans droit', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.canLinkContribuable()).toBe(false);
  });
});

describe('CourrierFormPageComponent errors', () => {
  it('affiche les erreurs de chargement et d enregistrement', () => {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const gateway = {
      create: vi.fn(() => throwError(() => new Error('boom'))),
      update: vi.fn(() => throwError(() => new Error('boom'))),
      get: vi.fn(() => throwError(() => new Error('boom'))),
      expediteurs: vi.fn(() => of(['DGI'])),
    };
    TestBed.configureTestingModule({
      imports: [CourrierFormPageComponent],
      providers: [
        { provide: CourriersGateway, useValue: gateway },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cr1' } } } },
        { provide: PermissionsService, useValue: { hasPermission: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(CourrierFormPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.problem()).not.toBeNull();
    fixture.componentInstance.form.numero = 'C-001';
    fixture.componentInstance.form.expediteur = 'DGI';
    fixture.componentInstance.form.objet = 'Objet';
    fixture.componentInstance.save();
    expect(fixture.componentInstance.problem()).not.toBeNull();
  });
});

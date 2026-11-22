import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { DemandeFormulaire } from '../../core/models/demandes/demande.model';
import type { DepotDraft } from '../../core/models/depots/depot.model';
import { DepotGateway } from '../../core/services/depots/depot.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { DepotWizardPageComponent } from './depot-wizard-page.component';

const formulaire: DemandeFormulaire = {
  exercices: [
    { annee: 2026, libelle: 'Exercice 2026' },
    { annee: 2025, libelle: 'Exercice 2025' },
  ],
  etatsFinanciers: [
    { code: 'BILAN', libelle: 'Bilan' },
    { code: 'COMPTE_RESULTAT', libelle: 'Compte de résultat' },
  ],
  motifs: [
    { code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' },
    { code: 'FORME_AUTRES', libelle: 'Autres' },
  ],
  champsConformite: [],
  variablesMax: 2,
  variablesMaxParExercice: 2,
  pdfMinimum: 1,
  plausibiliteSeuilPct: null,
};

function draft(overrides: Partial<DepotDraft> = {}): DepotDraft {
  return {
    id: 'd1',
    numero: null,
    statut: 'BROUILLON',
    etape: 1,
    version: 1,
    updatedAt: '2026-11-12T10:00:00Z',
    derniereSauvegarde: '2026-11-12T10:00:00Z',
    abandonneLe: null,
    referenceDepot: null,
    contribuable: {
      id: 'c1',
      ncc: '1234567A',
      raisonSociale: 'X',
      centreImpotId: 'GUDEF',
      centreImpotLibelle: null,
      directionRattachementId: 'DGE',
    },
    exercices: [
      {
        annee: 2026,
        touteLaLiasse: false,
        etatsFinanciers: [],
        motifs: [],
        variables: [],
      },
    ],
    conformite: {
      statut: 'EN_ATTENTE',
      champsManquants: [],
      motifRejetCode: null,
      verifieLe: null,
    },
    ...overrides,
  };
}

function setup(id: string | null = null) {
  const gateway = {
    formulaire: vi.fn(() => of(formulaire)),
    draft: vi.fn(() => of(draft({ etape: 2, version: 2 }))),
    create: vi.fn(() => of(draft())),
    save: vi.fn(() => of(draft({ etape: 2, version: 2 }))),
    validateStep: vi.fn((_: string, step: number) => of(draft({ etape: step, version: 2 }))),
    pieces: vi.fn(() => of([])),
    uploadPiece: vi.fn(() => of({})),
    deposit: vi.fn(() => of({ demande: {}, accuseUrl: '/accuse' })),
    accuse: vi.fn(() => of(new Blob(['pdf']))),
  };
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };
  const route = {
    snapshot: { paramMap: convertToParamMap(id ? { id } : {}) as ParamMap },
  };
  TestBed.configureTestingModule({
    imports: [DepotWizardPageComponent],
    providers: [
      { provide: DepotGateway, useValue: gateway },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: route },
      { provide: CorrelationService, useValue: { last: null } },
    ],
  });
  return { fixture: TestBed.createComponent(DepotWizardPageComponent), gateway, router };
}

describe('DepotWizardPageComponent', () => {
  it('charge le formulaire et le brouillon existant', async () => {
    const { fixture, gateway } = setup('d1');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    await component.load();

    expect(gateway.formulaire).toHaveBeenCalled();
    expect(gateway.draft).toHaveBeenCalledWith('d1');
    expect(component.step()).toBe(2);
    expect(component.id()).toBe('d1');
  });

  it('cree un brouillon et valide les etapes', async () => {
    const { fixture, gateway, router } = setup();
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.toggleYear(2026);
    expect(component.localIssue()).toBeNull();
    component.step.set(2);
    component.setTouteLaLiasse(0, true);
    expect(component.localIssue()).toBeNull();
    component.step.set(3);
    component.toggleMotif(0, 'FOND_ERREUR_SAISIE');
    expect(component.hasMotif(0, 'FOND_ERREUR_SAISIE')).toBe(true);
    component.step.set(4);
    component.addVariable(0);
    component.updateVariable(0, 0, { code: 'X', libelle: 'X', type: 'TEXTE' });
    expect(component.localIssue()).toBeNull();
    component.step.set(1);
    await component.next();
    expect(gateway.create).toHaveBeenCalled();
    expect(gateway.validateStep).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('detecte les erreurs de regle et gere les variables', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.step.set(2);
    component.state.set({
      etape: 2,
      version: 1,
      referenceDepot: null,
      exercices: [
        { annee: 2026, touteLaLiasse: true, etatsFinanciers: ['BILAN'], motifs: [], variables: [] },
      ],
    });
    expect(component.localIssue()).toContain('exclusive');
    component.setTouteLaLiasse(0, false);
    component.toggleEtat(0, 'COMPTE_RESULTAT');
    expect(component.hasEtat(0, 'COMPTE_RESULTAT')).toBe(true);
    component.step.set(3);
    component.toggleMotif(0, 'FORME_AUTRES');
    component.setMotifPrecision(0, 'FORME_AUTRES', 'Precision');
    expect(component.motifPrecision(0, 'FORME_AUTRES')).toBe('Precision');
    component.step.set(4);
    component.addVariable(0);
    component.onVariableType(0, 0, { target: { value: 'MONTANT' } } as unknown as Event);
    expect(component.variableType(0, 0)).toBe('MONTANT');
    component.updateVariable(0, 0, { montant: 12 });
    component.removeVariable(0, 0);
    expect(component.state().exercices[0].variables).toHaveLength(0);
    expect(component.toNumber('12')).toBe(12);
    expect(component.toNumber('')).toBeNull();
    expect(component.isAutre('FORME_AUTRES')).toBe(true);
  });

  it('depose et telecharge l accuse', async () => {
    const { fixture, gateway } = setup('d1');
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.step.set(5);
    await component.deposit();
    expect(gateway.deposit).toHaveBeenCalled();
    expect(component.deposited()).not.toBeNull();
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:url'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    component.downloadAccuse();
    expect(gateway.accuse).toHaveBeenCalled();
  });
});

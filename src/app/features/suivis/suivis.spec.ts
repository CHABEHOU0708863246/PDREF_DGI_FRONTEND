import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SuiviDetail, SuiviPage } from '../../core/models/suivis/suivi.model';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { SuiviCorrectionPageComponent } from './suivi-correction-page.component';
import { SuiviDetailPageComponent } from './suivi-detail-page.component';
import { SuiviValidationPageComponent } from './suivi-validation-page.component';
import { SuivisPageComponent } from './suivis-page.component';

const page: SuiviPage = {
  items: [
    {
      id: 's1',
      demandeId: 'd1',
      numero: '2026-0001',
      cycle: 1,
      contribuable: { ncc: '1234567A', raisonSociale: 'Client' },
      statut: 'AVIS_EN_COURS',
      avisRecus: 1,
      avisTotal: 3,
      avisFavorables: 1,
      avisNonFavorables: 0,
      transmissionsCount: 0,
      etapeCourante: 'AVIS_DERAR',
      demandeStatut: 'EN_CIRCUIT',
      dateDepot: '2026-11-05T00:00:00Z',
      dateOuverture: '2026-11-05T00:00:00Z',
      dateCloture: null,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

const detail: SuiviDetail = {
  ...page.items[0],
  avis: [
    {
      id: 'a1',
      etapeCode: 'AVIS_DERAR',
      directionId: 'dir1',
      directionCode: 'DERAR',
      statut: 'EN_ATTENTE',
      decision: null,
      motifCode: null,
      commentaire: null,
      article24: {
        insuffisanceMemeNature3Ans: null,
        engagementRedressementEnCours: null,
        avisVerificationComptabilite: null,
        verificationApprofondieEnCours: null,
      },
      emisLe: null,
      emisPar: null,
      echeance: null,
    },
  ],
  validationGlobale: {
    id: 'v1',
    statut: 'EN_ATTENTE',
    decision: null,
    motifCode: null,
    commentaire: null,
    decidePar: null,
    decideLe: null,
    courrierReponseId: null,
    courrierNumero: null,
    signatureStatut: 'EN_ATTENTE',
    depotEImpotsStatut: 'EN_ATTENTE',
    referenceDepotEImpots: null,
    clotureLe: null,
  },
  corrections: [],
  transmissions: [],
  directionIds: ['GUDEF'],
  etapes: [],
};

const gateway = {
  list: vi.fn(() => of(page)),
  get: vi.fn(() => of(detail)),
  motifs: vi.fn(() => of([{ code: 'AUTRE', libelle: 'Autre' }])),
  decideAvis: vi.fn(() => of(detail)),
  decideValidation: vi.fn(() => of(detail)),
  correct: vi.fn(() => of({ id: 'c1' })),
  transmit: vi.fn(() => of({ id: 't1', destinatairesCount: 1, emisLe: '' })),
  signature: vi.fn(() => of({ jobId: 'j1', courrierId: 'c1', statut: 'EN_ATTENTE' })),
  verifierGudef: vi.fn(() => of(detail)),
  depot: vi.fn(() =>
    of({ courrierId: 'c1', statut: 'DEPOSE', referenceDepot: 'R1', demandeCloturee: true }),
  ),
  exportBase: vi.fn(() => of({ blob: new Blob(), fileName: 'base.xlsx' })),
};

const route = { snapshot: { paramMap: convertToParamMap({ id: 'd1' }) } };
const router = { navigate: vi.fn(() => Promise.resolve(true)) };

function providers(
  permissionList: string[],
  roleList: string[],
  gatewayOverride: unknown = gateway,
) {
  const permissions = new PermissionsService();
  permissions.load({
    id: 'u1',
    login: 'u',
    displayName: 'User',
    roles: roleList,
    permissions: permissionList,
    mustChangePassword: false,
  });
  return [
    provideRouter([]),
    { provide: SuivisGateway, useValue: gatewayOverride },
    {
      provide: RejetGateway,
      useValue: {
        motifs: () =>
          of([
            {
              code: 'PIECE_JUSTIFICATIVE_MANQUANTE',
              libelle: 'Piece',
              legacy: false,
              selectionnable: true,
            },
          ]),
        create: () => of({ id: 'r1' }),
      },
    },
    { provide: ActivatedRoute, useValue: route },
    { provide: Router, useValue: router },
    { provide: PermissionsService, useValue: permissions },
  ];
}

describe('Pages suivis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:x'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });

  it('liste, filtre et exporte', () => {
    TestBed.configureTestingModule({
      imports: [SuivisPageComponent],
      providers: providers(['Suivis_Read'], ['SD_GUDEF']),
    });
    const fixture = TestBed.createComponent(SuivisPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.page().totalCount).toBe(1);
    expect(component.statutLabel('CLOTURE')).toBe('Cloture');
    component.filters.search = 'x';
    component.load(2);
    component.reset();
    component.exportBase();
    expect(gateway.exportBase).toHaveBeenCalled();
  });

  it('detail emet un avis et transmet le suivi', () => {
    TestBed.configureTestingModule({
      imports: [SuiviDetailPageComponent],
      providers: providers(
        [
          'Suivis_Read',
          'Avis_Emettre',
          'Suivis_Transmettre',
          'Courriers_Signer',
          'Courriers_Deposer_EImpots',
          'Suivis_Decide',
          'Suivis_Corriger',
          'Rejets_Create',
        ],
        ['DECIDEUR_DERAR', 'SD_GUDEF'],
      ),
    });
    const fixture = TestBed.createComponent(SuiviDetailPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const avis = detail.avis[0];
    expect(component.canAvis(avis)).toBe(true);
    expect(component.canDecide()).toBe(true);
    expect(component.canCorrect()).toBe(true);
    expect(component.canTransmettre()).toBe(true);
    expect(component.canSign()).toBe(true);
    expect(component.canDepot()).toBe(true);
    expect(component.motifLabel('AUTRE')).toBe('Autre');
    expect(component.article24Value(true)).toBe('Oui');
    component.item.set({
      ...detail,
      etapeCourante: 'VERIF_GUDEF',
      assigneeUserId: 'u1',
    });
    expect(component.canReject()).toBe(true);
    component.openRejet();
    expect(component.rejetOpen()).toBe(true);
    component.confirmerRejet({
      motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
      commentaire: 'Commentaire de rejet suffisant.',
      pieceComplementaireRequise: false,
    });
    component.draft[avis.etapeCode] = {
      decision: 'FAVORABLE',
      motifCode: '',
      commentaire: '',
      article24: {
        insuffisanceMemeNature3Ans: null,
        engagementRedressementEnCours: null,
        avisVerificationComptabilite: null,
        verificationApprofondieEnCours: null,
      },
    };
    component.decide(avis);
    component.transmission.destinataires = '507f1f77bcf86cd799439011';
    component.transmit();
    component.sign();
    component.depot();
    component.verify();
    expect(component.stepLabel('AVIS_DVFN')).toBe('DVFN');
    expect(component.stepLabel('CONFORMITE_AUTO')).toBe('Conformité automatique');
    expect(component.instructionLabel('ACCEPTE_POUR_TRAITEMENT')).toBe('Accepté pour traitement');
    expect(component.statutLabel('CLOTURE')).toBe('Clôturé');
    expect(gateway.decideAvis).toHaveBeenCalled();
    expect(gateway.transmit).toHaveBeenCalled();
    expect(gateway.signature).toHaveBeenCalled();
    expect(gateway.depot).toHaveBeenCalled();
  });

  it('couvre les erreurs des ecrans de suivi', () => {
    const failing = {
      list: vi.fn(() => throwError(() => new Error('list'))),
      get: vi.fn(() => throwError(() => new Error('get'))),
      motifs: vi.fn(() => throwError(() => new Error('motifs'))),
      decideAvis: vi.fn(() => throwError(() => new Error('avis'))),
      decideValidation: vi.fn(() => throwError(() => new Error('validation'))),
      correct: vi.fn(() => throwError(() => new Error('correction'))),
      transmit: vi.fn(() => throwError(() => new Error('transmission'))),
      signature: vi.fn(() => throwError(() => new Error('signature'))),
      verifierGudef: vi.fn(() => of(detail)),
      depot: vi.fn(() => throwError(() => new Error('depot'))),
      exportBase: vi.fn(() => throwError(() => new Error('export'))),
    };
    TestBed.configureTestingModule({
      imports: [SuivisPageComponent],
      providers: providers(['Suivis_Read'], ['SD_GUDEF'], failing),
    });
    const fixture = TestBed.createComponent(SuivisPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.exportBase();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SuiviDetailPageComponent],
      providers: providers(
        [
          'Suivis_Read',
          'Avis_Emettre',
          'Suivis_Transmettre',
          'Courriers_Signer',
          'Courriers_Deposer_EImpots',
        ],
        ['DECIDEUR_DERAR'],
        failing,
      ),
    });
    const detailFixture = TestBed.createComponent(SuiviDetailPageComponent);
    detailFixture.detectChanges();
    const detailComponent = detailFixture.componentInstance;
    detailComponent.draft[detail.avis[0].etapeCode] = {
      decision: 'NON_FAVORABLE',
      motifCode: '',
      commentaire: '',
      article24: {
        insuffisanceMemeNature3Ans: null,
        engagementRedressementEnCours: null,
        avisVerificationComptabilite: null,
        verificationApprofondieEnCours: null,
      },
    };
    detailComponent.decide(detail.avis[0]);
    detailComponent.transmit();
    detailComponent.sign();
    detailComponent.depot();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SuiviValidationPageComponent],
      providers: providers(['Suivis_Decide'], ['SD_GUDEF'], failing),
    });
    const validation = TestBed.createComponent(SuiviValidationPageComponent);
    validation.detectChanges();
    validation.componentInstance.submit();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SuiviCorrectionPageComponent],
      providers: providers(['Suivis_Corriger'], ['SD_GUDEF'], failing),
    });
    const correction = TestBed.createComponent(SuiviCorrectionPageComponent);
    correction.detectChanges();
    correction.componentInstance.cible = 'AVIS|a1|FAVORABLE';
    correction.componentInstance.motif = 'motif suffisamment long';
    correction.componentInstance.submit();
  });

  it('couvre les branches complementaires', () => {
    TestBed.configureTestingModule({
      imports: [
        SuiviDetailPageComponent,
        SuiviValidationPageComponent,
        SuiviCorrectionPageComponent,
      ],
      providers: providers(
        ['Suivis_Read', 'Avis_Emettre', 'Suivis_Decide', 'Suivis_Corriger'],
        ['DECIDEUR_DVFN'],
      ),
    });
    const detailFixture = TestBed.createComponent(SuiviDetailPageComponent);
    detailFixture.detectChanges();
    const detailComponent = detailFixture.componentInstance;
    expect(detailComponent.canDecide()).toBe(false);
    detailComponent.motifLabel('AUTRE');
    detailComponent.statutLabel('AVIS_COMPLET');
    detailComponent.statutLabel('VALIDATION_EN_ATTENTE');
    detailComponent.statutLabel('VALIDATION_POSEE');
    detailComponent.statutLabel('INCONNU');
    const dvfnAvis = { ...detail.avis[0], id: 'a2', etapeCode: 'AVIS_DVFN' };
    expect(detailComponent.canAvis(dvfnAvis)).toBe(true);
    expect(detailComponent.canAvis({ ...dvfnAvis, etapeCode: 'AVIS_RATTACHEMENT' })).toBe(false);
    detailComponent.draft[dvfnAvis.etapeCode] = {
      decision: 'NON_FAVORABLE',
      motifCode: 'AUTRE',
      commentaire: 'precision',
      article24: {
        insuffisanceMemeNature3Ans: null,
        engagementRedressementEnCours: null,
        avisVerificationComptabilite: null,
        verificationApprofondieEnCours: null,
      },
    };
    detailComponent.decide(dvfnAvis);
    detailComponent.transmission.destinataires = '';
    detailComponent.transmit();

    const validation = TestBed.createComponent(SuiviValidationPageComponent);
    validation.detectChanges();
    const validationComponent = validation.componentInstance;
    validationComponent.decision = 'NON_FAVORABLE';
    validationComponent.motifCode = 'AUTRE';
    validationComponent.submit();

    const correction = TestBed.createComponent(SuiviCorrectionPageComponent);
    correction.detectChanges();
    const correctionComponent = correction.componentInstance;
    correctionComponent.cible = 'VALIDATION_GLOBALE|v1|NON_FAVORABLE';
    correctionComponent.onCible();
    expect(correctionComponent.ancienneDecision()).toBe('NON_FAVORABLE');
    expect(correctionComponent.cibleLabel()).toBe('Validation globale');
    expect(correctionComponent.nouvelleDecision).toBe('FAVORABLE');
    correctionComponent.cible = '';
    correctionComponent.submit();
  });

  it('valide et corrige', () => {
    TestBed.configureTestingModule({
      imports: [SuiviValidationPageComponent, SuiviCorrectionPageComponent],
      providers: providers(['Suivis_Decide', 'Suivis_Corriger'], ['SD_GUDEF']),
    });
    const validation = TestBed.createComponent(SuiviValidationPageComponent);
    validation.detectChanges();
    const validationComponent = validation.componentInstance;
    validationComponent.decision = 'FAVORABLE';
    validationComponent.submit();
    expect(gateway.decideValidation).toHaveBeenCalled();

    const correction = TestBed.createComponent(SuiviCorrectionPageComponent);
    correction.detectChanges();
    const correctionComponent = correction.componentInstance;
    correctionComponent.cible = 'AVIS|a1|FAVORABLE';
    correctionComponent.onCible();
    expect(correctionComponent.ancienneDecision()).toBe('FAVORABLE');
    expect(correctionComponent.cibleLabel()).toBe('Avis a1');
    expect(correctionComponent.nouvelleDecision).toBe('NON_FAVORABLE');
    correctionComponent.motif = 'motif suffisamment long';
    correctionComponent.submit();
    expect(gateway.correct).toHaveBeenCalled();
  });
});

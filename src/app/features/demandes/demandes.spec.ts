import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTRIBUABLE_LOOKUP } from '../../core/services/lookup/contribuable-lookup';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { DemandesGateway } from '../../core/services/demandes/demandes.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { DemandeDetailPageComponent } from './demande-detail-page.component';
import { DemandeFormPageComponent } from './demande-form-page.component';
import { DemandesPageComponent } from './demandes-page.component';

const detail = {
  id: 'd1',
  numero: '2026-0001',
  origine: 'AGENT',
  statut: 'EN_CIRCUIT',
  contribuable: {
    id: 'c1',
    ncc: '1234567A',
    raisonSociale: 'Client Alpha',
    centreImpotId: 'GUDEF',
    centreImpotLibelle: 'GUDEF',
    directionRattachementId: 'DGE',
  },
  dateDepot: '2026-11-05T00:00:00Z',
  exercicePrincipal: 2026,
  etapeCourante: 'CONFORMITE_AUTO',
  createdAt: '2026-11-05T00:00:00Z',
  courrierId: 'k1',
  referenceDepot: null,
  exercices: [
    {
      annee: 2026,
      touteLaLiasse: false,
      etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
      motifs: [{ code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' }],
      variables: [],
    },
  ],
  conformite: {
    statut: 'CONFORME',
    champsManquants: [],
    motifRejetCode: null,
    verifieLe: '2026-11-05T00:00:00Z',
  },
  circuit: null,
  directionIds: ['GUDEF'],
  updatedAt: null,
  version: 1,
};

function providers(gateway: Partial<DemandesGateway>) {
  return [
    provideRouter([]),
    { provide: DemandesGateway, useValue: gateway },
    { provide: CourriersGateway, useValue: { lookup: vi.fn(() => of([])) } },
    { provide: CONTRIBUABLE_LOOKUP, useValue: { search: vi.fn(() => of([])) } },
    {
      provide: PermissionsService,
      useValue: { hasPermission: () => true },
    },
    { provide: CorrelationService, useValue: { last: null } },
  ];
}

describe('Demandes', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche la liste et les etats', () => {
    TestBed.configureTestingModule({
      imports: [DemandesPageComponent],
      providers: providers({
        list: vi.fn(() => of({ items: [detail], page: 1, pageSize: 20, totalCount: 1 })),
      }),
    });
    const fixture = TestBed.createComponent(DemandesPageComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(fixture.nativeElement.textContent).toContain('2026-0001');
    expect(fixture.nativeElement.textContent).toContain('Client Alpha');
  });

  it('affiche les cinq onglets de la fiche', () => {
    TestBed.configureTestingModule({
      imports: [DemandeDetailPageComponent],
      providers: providers({
        get: vi.fn(() => of(detail)),
        attachments: vi.fn(() => of([])),
      }),
    });
    const fixture = TestBed.createComponent(DemandeDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Synthèse');
    expect(fixture.nativeElement.textContent).toContain('Pièces jointes');
  });

  it('charge le formulaire en cinq sections', () => {
    TestBed.configureTestingModule({
      imports: [DemandeFormPageComponent],
      providers: providers({
        formulaire: vi.fn(() =>
          of({
            exercices: [{ annee: 2026, libelle: 'Exercice 2026' }],
            etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
            motifs: [{ code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' }],
            champsConformite: ['ncc'],
            variablesMax: 20,
            variablesMaxParExercice: 25,
            pdfMinimum: 1,
            plausibiliteSeuilPct: null,
          }),
        ),
      }),
    });
    const fixture = TestBed.createComponent(DemandeFormPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1. Contribuable et courrier');
    expect(fixture.nativeElement.textContent).toContain('5. Récapitulatif');
  });
});

describe('Demandes interactions', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('couvre les interactions du formulaire', () => {
    TestBed.configureTestingModule({
      imports: [DemandeFormPageComponent],
      providers: providers({
        formulaire: vi.fn(() =>
          of({
            exercices: [
              { annee: 2026, libelle: 'Exercice 2026' },
              { annee: 2025, libelle: 'Exercice 2025' },
            ],
            etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
            motifs: [
              { code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' },
              { code: 'FOND_AUTRES', libelle: 'Autres' },
            ],
            champsConformite: ['ncc'],
            variablesMax: 2,
            variablesMaxParExercice: 2,
            pdfMinimum: 1,
            plausibiliteSeuilPct: null,
          }),
        ),
      }),
    });
    const fixture = TestBed.createComponent(DemandeFormPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    const exercise = component.exercises[0];
    expect(component.fieldLabel('ncc')).toBe('NCC');
    expect(component.exerciseYears()).toContain('2026');
    component.toggleEtat(exercise, 'BILAN', { target: { checked: true } } as unknown as Event);
    component.toggleMotif(exercise, 'FOND_AUTRES', {
      target: { checked: true },
    } as unknown as Event);
    component.addVariable(exercise);
    expect(component.totalVariables()).toBe(1);
    component.removeVariable(exercise, 0);
    component.markDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
    component.selectFile({ target: { files: [] } } as unknown as Event);
    component.submit();
    expect(component.validationMessage()).toContain('contribuable');
    component.addExercice();
    component.removeExercice(1);
    component.cancel();
  });

  it('couvre les actions de la fiche', () => {
    TestBed.configureTestingModule({
      imports: [DemandeDetailPageComponent],
      providers: providers({
        get: vi.fn(() => of(detail)),
        attachments: vi.fn(() => of([])),
        downloadAttachment: vi.fn(() => of({ blob: new Blob(), fileName: 'pj.pdf' })),
        export: vi.fn(() => of({ blob: new Blob(), fileName: 'demande.pdf' })),
      }),
    });
    const fixture = TestBed.createComponent(DemandeDetailPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const tab = fixture.nativeElement.querySelector('.tabs__item') as HTMLButtonElement;
    tab.click();
    component.activeTab.set('exercices');
    fixture.detectChanges();
    expect(component.labels(detail.exercices[0].etatsFinanciers)).toContain('Bilan');
    expect(component.motives(detail.exercices[0].motifs)).toContain('Erreur');
    component.activeTab.set('circuit');
    expect(component.circuitEntries(detail)).toEqual([]);
    component.activeTab.set('pieces');
    component.exportPdf();
    expect(component.tabLabel('synthese')).toContain('Synth');
    expect(component.canExport()).toBe(true);
  });

  it('couvre les libelles et la pagination de la liste', () => {
    TestBed.configureTestingModule({
      imports: [DemandesPageComponent],
      providers: providers({
        list: vi.fn(() => of({ items: [], page: 1, pageSize: 20, totalCount: 21 })),
      }),
    });
    const fixture = TestBed.createComponent(DemandesPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.pages()).toBe(2);
    expect(component.statutLabel('REJETEE')).toContain('Rejet');
    expect(component.origineLabel('AGENT')).toBe('Agent');
    expect(component.canCreate()).toBe(true);
    component.reset();
  });

  it('couvre les chemins de detail et de depot', () => {
    const create = vi.fn(() => of({ ...detail, version: 2 }));
    const uploadAttachment = vi.fn(() => of(100));
    const update = vi.fn(() => of(detail));
    TestBed.configureTestingModule({
      imports: [DemandeDetailPageComponent],
      providers: providers({
        get: vi.fn(() => of(detail)),
        attachments: vi.fn(() => of([])),
        downloadAttachment: vi.fn(() => of({ blob: new Blob(), fileName: 'pj.pdf' })),
        uploadAttachment: vi.fn(() => of(100)),
      }),
    });
    const detailFixture = TestBed.createComponent(DemandeDetailPageComponent);
    const detailComponent = detailFixture.componentInstance;
    detailFixture.detectChanges();
    expect(detailComponent.canUpload()).toBe(true);
    detailComponent.download('v1');
    detailComponent.upload({ target: { files: [] } } as unknown as Event);
    const pdf = new File(['pdf'], 'demande.pdf', { type: 'application/pdf' });
    detailComponent.upload({ target: { files: [pdf] } } as unknown as Event);
    detailComponent.activeTab.set('circuit');
    expect(
      detailComponent.circuitEntries({
        ...detail,
        circuit: {
          code: 'x',
          version: 1,
          statut: 'EN_COURS',
          demarreLe: '',
          etapeCourante: 'X',
          etapes: {},
        },
      }),
    ).toEqual([]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DemandeFormPageComponent],
      providers: providers({
        formulaire: vi.fn(() =>
          of({
            exercices: [{ annee: 2026, libelle: 'Exercice 2026' }],
            etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
            motifs: [{ code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' }],
            champsConformite: [],
            variablesMax: 20,
            variablesMaxParExercice: 25,
            pdfMinimum: 1,
            plausibiliteSeuilPct: null,
          }),
        ),
        create,
        uploadAttachment,
        update,
      }),
    });
    const formFixture = TestBed.createComponent(DemandeFormPageComponent);
    const form = formFixture.componentInstance;
    formFixture.detectChanges();
    const file = new File(['pdf'], 'demande.pdf', { type: 'application/pdf' });
    form.selectFile({ target: { files: [file] } } as unknown as Event);
    form.form.contribuableId = 'c1';
    form.form.courrierId = 'k1';
    form.exercises[0].etatsFinanciers = ['BILAN'];
    form.exercises[0].motifs = ['FOND_ERREUR_SAISIE'];
    form.submit();
    expect(create).toHaveBeenCalled();
    expect(uploadAttachment).toHaveBeenCalled();
  });

  it('couvre les erreurs des trois ecrans', () => {
    TestBed.configureTestingModule({
      imports: [DemandesPageComponent],
      providers: providers({ list: vi.fn(() => throwError(() => new Error('offline'))) }),
    });
    const pageFixture = TestBed.createComponent(DemandesPageComponent);
    pageFixture.detectChanges();
    expect(pageFixture.componentInstance.problem()).not.toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DemandeFormPageComponent],
      providers: providers({ formulaire: vi.fn(() => throwError(() => new Error('offline'))) }),
    });
    const formFixture = TestBed.createComponent(DemandeFormPageComponent);
    formFixture.detectChanges();
    expect(formFixture.componentInstance.problem()).not.toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DemandeDetailPageComponent],
      providers: providers({
        get: vi.fn(() => of(detail)),
        attachments: vi.fn(() => throwError(() => new Error('offline'))),
        downloadAttachment: vi.fn(() => throwError(() => new Error('offline'))),
        export: vi.fn(() => throwError(() => new Error('offline'))),
      }),
    });
    const detailFixture = TestBed.createComponent(DemandeDetailPageComponent);
    const detailComponent = detailFixture.componentInstance;
    detailFixture.detectChanges();
    detailComponent.download('v1');
    detailComponent.exportPdf();
    expect(detailComponent.attachmentsLoading()).toBe(false);
  });
});

describe('Demandes erreurs de depot', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('couvre l echec de finalisation', () => {
    TestBed.configureTestingModule({
      imports: [DemandeFormPageComponent],
      providers: providers({
        formulaire: vi.fn(() =>
          of({
            exercices: [{ annee: 2026, libelle: 'Exercice 2026' }],
            etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
            motifs: [{ code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' }],
            champsConformite: [],
            variablesMax: 20,
            variablesMaxParExercice: 25,
            pdfMinimum: 1,
            plausibiliteSeuilPct: null,
          }),
        ),
        create: vi.fn(() => of({ ...detail, version: 1 })),
        uploadAttachment: vi.fn(() => of(100)),
        update: vi.fn(() => throwError(() => new Error('offline'))),
      }),
    });
    const fixture = TestBed.createComponent(DemandeFormPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.contribuableId = 'c1';
    component.form.courrierId = 'k1';
    component.exercises[0].etatsFinanciers = ['BILAN'];
    component.exercises[0].motifs = ['FOND_ERREUR_SAISIE'];
    component.selectFile({
      target: { files: [new File(['pdf'], 'a.pdf', { type: 'application/pdf' })] },
    } as unknown as Event);
    component.submit();
    expect(component.saving()).toBe(false);
  });
});

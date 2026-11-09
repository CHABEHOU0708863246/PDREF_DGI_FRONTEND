import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CourrierDetailPageComponent } from './courrier-detail-page.component';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
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
  estLie: true,
  contribuable: {
    id: 'c1',
    ncc: '1234567A',
    nccMasque: '123****7A',
    raisonSociale: 'Client Alpha',
  },
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
  signatureMode: null,
  remiseStatut: null,
  remiseCanal: null,
  remiseDate: null,
  updatedAt: null,
  version: 1,
};

const attachment = {
  id: 'fg1',
  ownerType: 'COURRIER',
  ownerId: 'cr1',
  currentVersion: 1,
  currentFile: {
    id: 'fv1',
    fileGroupId: 'fg1',
    versionNumber: 1,
    originalName: 'courrier.pdf',
    detectedContentType: 'application/pdf',
    sizeBytes: 10,
    sha256: 'abc',
    status: 'PROPRE',
    scanStatus: 'PROPRE',
    createdAt: '2026-11-05T00:00:00Z',
  },
};

function setup(canInternal = true, canUpdate = true) {
  const gateway = {
    get: vi.fn(() => of(item)),
    attachments: vi.fn(() => of([attachment])),
    downloadAttachment: vi.fn(() => of({ blob: new Blob(['x']), fileName: 'courrier.pdf' })),
    uploadAttachment: vi.fn(() => of(100)),
    signerManuel: vi.fn(() => of({ statut: 'SIGNE', sha256: 'abc' })),
    declarerRemise: vi.fn(() => of(undefined)),
  };
  const permissions = {
    hasPermission: vi.fn((permission: string) => {
      if (permission === 'Courriers_ReadInternal') return canInternal;
      if (permission === 'Courriers_Update') return canUpdate;
      return true;
    }),
  };
  TestBed.configureTestingModule({
    imports: [CourrierDetailPageComponent],
    providers: [
      { provide: CourriersGateway, useValue: gateway },
      {
        provide: IntegrationGateway,
        useValue: { modes: vi.fn(() => of({ eImpots: 'MANUEL', signature: 'MANUEL' })) },
      },
      { provide: PermissionsService, useValue: permissions },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cr1' } } } },
    ],
  });
  return { fixture: TestBed.createComponent(CourrierDetailPageComponent), gateway, permissions };
}

describe('CourrierDetailPageComponent', () => {
  it('charge la fiche, le contribuable et les pieces jointes', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    expect(gateway.get).toHaveBeenCalledWith('cr1');
    expect(gateway.attachments).toHaveBeenCalledWith('cr1');
    expect(fixture.componentInstance.item()?.numero).toBe('C-001');
    expect(fixture.componentInstance.attachments()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Instruction C3');
  });

  it('couvre les actions manuelles de signature et de remise', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.manualSignature()).toBe(true);
    expect(component.canSigner()).toBe(true);
    component.onSignataire({ target: { value: 'DG' } } as unknown as Event);
    component.onDateSignature({ target: { value: '2026-11-09' } } as unknown as Event);
    component.onCanal({ target: { value: 'REMISE_PAPIER' } } as unknown as Event);
    component.onDateRemise({ target: { value: '2026-11-09' } } as unknown as Event);
    component.onReferenceRemise({ target: { value: 'REM-1' } } as unknown as Event);
    const input = document.createElement('input');
    const file = new File(['%PDF-1.4'], 'signe.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    component.signer({ target: input } as unknown as Event);
    component.declarerRemise();
    expect(gateway.signerManuel).toHaveBeenCalled();
    expect(gateway.declarerRemise).toHaveBeenCalled();
  });

  it('gere les erreurs des actions manuelles courrier', () => {
    const gateway = {
      get: vi.fn(() => of(item)),
      attachments: vi.fn(() => of([])),
      downloadAttachment: vi.fn(),
      uploadAttachment: vi.fn(),
      signerManuel: vi.fn(() => throwError(() => new Error('sign'))),
      declarerRemise: vi.fn(() => throwError(() => new Error('remise'))),
    };
    TestBed.configureTestingModule({
      imports: [CourrierDetailPageComponent],
      providers: [
        { provide: CourriersGateway, useValue: gateway },
        {
          provide: IntegrationGateway,
          useValue: { modes: () => of({ eImpots: 'MANUEL', signature: 'MANUEL' }) },
        },
        { provide: PermissionsService, useValue: { hasPermission: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cr1' } } } },
      ],
    });
    const component = TestBed.createComponent(CourrierDetailPageComponent).componentInstance;
    component.onSignataire({ target: { value: 'DG' } } as unknown as Event);
    component.onDateSignature({ target: { value: '2026-11-09' } } as unknown as Event);
    component.onCanal({ target: { value: 'REMISE_PAPIER' } } as unknown as Event);
    component.onDateRemise({ target: { value: '2026-11-09' } } as unknown as Event);
    component.onReferenceRemise({ target: { value: 'REM-1' } } as unknown as Event);
    const input = document.createElement('input');
    const file = new File(['%PDF-1.4'], 'signe.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    component.signer({ target: input } as unknown as Event);
    component.declarerRemise();
    expect(component.problem()).not.toBeNull();
  });

  it('masque les champs C3 sans permission', () => {
    const { fixture } = setup(false, false);
    fixture.detectChanges();
    expect(fixture.componentInstance.canInternal()).toBe(false);
    expect(fixture.componentInstance.canUpdate()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Instruction C3');
  });

  it('telecharge et televerse une piece jointe', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    fixture.componentInstance.download('fv1');
    expect(gateway.downloadAttachment).toHaveBeenCalledWith('cr1', 'fv1');
    expect(createObjectURL).toHaveBeenCalled();
    click.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();

    const input = document.createElement('input');
    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.upload({ target: input } as unknown as Event);
    expect(gateway.uploadAttachment).toHaveBeenCalledWith('cr1', file);
  });
});

describe('CourrierDetailPageComponent helpers', () => {
  it('expose les droits et les libelles', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.canUpload()).toBe(true);
    expect(fixture.componentInstance.canUpdate()).toBe(true);
    expect(fixture.componentInstance.typeLabel('COURRIER')).toBe('Courrier');
    expect(fixture.componentInstance.typeLabel('REPONSE_DGI')).toBe('Reponse DGI');
  });
});

describe('CourrierDetailPageComponent errors', () => {
  it('gere les erreurs de chargement et de telechargement', () => {
    const gateway = {
      get: vi.fn(() => throwError(() => new Error('boom'))),
      attachments: vi.fn(() => of([])),
      downloadAttachment: vi.fn(() => throwError(() => new Error('boom'))),
      uploadAttachment: vi.fn(() => of(100)),
      signerManuel: vi.fn(() => of({ statut: 'SIGNE', sha256: 'abc' })),
      declarerRemise: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [CourrierDetailPageComponent],
      providers: [
        { provide: CourriersGateway, useValue: gateway },
        {
          provide: IntegrationGateway,
          useValue: { modes: () => of({ eImpots: 'MANUEL', signature: 'MANUEL' }) },
        },
        {
          provide: IntegrationGateway,
          useValue: { modes: vi.fn(() => of({ eImpots: 'MANUEL', signature: 'MANUEL' })) },
        },
        { provide: PermissionsService, useValue: { hasPermission: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cr1' } } } },
      ],
    });
    const fixture = TestBed.createComponent(CourrierDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.problem()).not.toBeNull();
    fixture.componentInstance.upload({ target: { files: [] } } as unknown as Event);
    expect(gateway.uploadAttachment).not.toHaveBeenCalled();
  });
});

describe('CourrierDetailPageComponent error branches', () => {
  it('remonte une erreur de pieces jointes et de telechargement', () => {
    const gateway = {
      get: vi.fn(() => of(item)),
      attachments: vi.fn(() => throwError(() => new Error('boom'))),
      downloadAttachment: vi.fn(() => throwError(() => new Error('boom'))),
      uploadAttachment: vi.fn(() => of(100)),
      signerManuel: vi.fn(() => of({ statut: 'SIGNE', sha256: 'abc' })),
      declarerRemise: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [CourrierDetailPageComponent],
      providers: [
        { provide: CourriersGateway, useValue: gateway },
        {
          provide: IntegrationGateway,
          useValue: { modes: () => of({ eImpots: 'MANUEL', signature: 'MANUEL' }) },
        },
        {
          provide: IntegrationGateway,
          useValue: { modes: vi.fn(() => of({ eImpots: 'MANUEL', signature: 'MANUEL' })) },
        },
        { provide: PermissionsService, useValue: { hasPermission: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cr1' } } } },
      ],
    });
    const fixture = TestBed.createComponent(CourrierDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.attachmentsLoading()).toBe(false);
    fixture.componentInstance.download('fv1');
    expect(fixture.componentInstance.problem()).not.toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { AdhesionsAgentPageComponent } from './adhesions-agent-page.component';

const item = {
  id: 'a1',
  ncc: '1234567A',
  raisonSociale: 'Entreprise',
  demandeur: 'Awa Diallo',
  emailMasque: 'a***@example.test',
  statut: 'EN_ATTENTE_VALIDATION',
  createdAt: '2026-11-11T10:00:00Z',
  nccConnu: true,
  emailEcart: true,
  compteActif: false,
};

const detail = {
  id: 'a1',
  ncc: '1234567A',
  raisonSociale: 'Entreprise',
  nom: 'Diallo',
  prenom: 'Awa',
  fonction: 'Gerante',
  email: 'awa@example.test',
  telephone: '+2250700000009',
  statut: 'EN_ATTENTE_VALIDATION',
  createdAt: '2026-11-11T10:00:00Z',
  nccConnu: true,
  emailEcart: true,
  compteActif: false,
  pieces: [
    {
      type: 'PIECE_IDENTITE',
      fileName: 'identite.pdf',
      versionId: 'v1',
      uploadedAt: '2026-11-11T10:00:00Z',
    },
  ],
  motifRefusCode: null,
};

const account = {
  userId: 'u1',
  login: 'awa@example.test',
  displayName: 'Awa Diallo',
  email: 'awa@example.test',
  contribuableId: 'c1',
  ncc: '1234567A',
  isActive: true,
  createdAt: '2026-11-11T10:00:00Z',
};

function setup() {
  const gateway = {
    list: vi.fn(() => of([item])),
    detail: vi.fn(() => of(detail)),
    motifs: vi.fn(() => of([{ code: 'AUTRE', libelle: 'Autre' }])),
    accept: vi.fn(() => of(void 0)),
    refuse: vi.fn(() => of(void 0)),
    accounts: vi.fn(() => of([account])),
    deactivate: vi.fn(() => of(void 0)),
    reactivate: vi.fn(() => of(void 0)),
    downloadPiece: vi.fn(() => of(new Blob(['pdf']))),
  };
  TestBed.configureTestingModule({
    imports: [AdhesionsAgentPageComponent],
    providers: [
      { provide: AdhesionGateway, useValue: gateway },
      { provide: CorrelationService, useValue: { last: undefined } },
    ],
  });
  return { fixture: TestBed.createComponent(AdhesionsAgentPageComponent), gateway };
}

describe('AdhesionsAgentPageComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('charge la file, ouvre une demande et traite les decisions', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();

    expect(gateway.list).toHaveBeenCalled();
    expect(gateway.accounts).toHaveBeenCalled();
    expect(fixture.componentInstance.items()).toHaveLength(1);

    fixture.componentInstance.open(item);
    expect(gateway.detail).toHaveBeenCalledWith('a1');
    expect(fixture.componentInstance.detail()?.nom).toBe('Diallo');

    fixture.componentInstance.accept();
    expect(gateway.accept).toHaveBeenCalledWith('a1');
    expect(fixture.componentInstance.notice()).toContain('Adhesion acceptee');

    fixture.componentInstance.detail.set(detail);
    fixture.componentInstance.motifCode.set('AUTRE');
    fixture.componentInstance.refuse();
    expect(gateway.refuse).toHaveBeenCalledWith('a1', 'AUTRE');
    expect(fixture.componentInstance.notice()).toContain('Adhesion refusee');
  });

  it('desactive et reactive un compte avec motif', () => {
    const { fixture, gateway } = setup();
    fixture.componentInstance.loadAccounts();
    fixture.componentInstance.openAccountDialog(account, false);
    expect(fixture.componentInstance.accountDialogOpen()).toBe(true);
    fixture.componentInstance.confirmAccount('Retrait du mandat');
    expect(gateway.deactivate).toHaveBeenCalledWith('u1', 'Retrait du mandat');

    fixture.componentInstance.openAccountDialog(account, true);
    fixture.componentInstance.confirmAccount('Retour du mandat');
    expect(gateway.reactivate).toHaveBeenCalledWith('u1', 'Retour du mandat');
  });

  it('telecharge une piece', () => {
    const createObjectUrl = vi.fn(() => 'blob:test');
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const { fixture, gateway } = setup();
    fixture.componentInstance.detail.set(detail);
    fixture.componentInstance.downloadPiece('v1', 'identite.pdf');
    expect(gateway.downloadPiece).toHaveBeenCalledWith('a1', 'v1');
    expect(createObjectUrl).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
    vi.unstubAllGlobals();
  });
});

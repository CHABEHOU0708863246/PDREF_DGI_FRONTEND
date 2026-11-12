import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { RejetPiecesGateway } from '../../core/services/rejets/rejet-pieces.gateway';
import { EspaceDossierPageComponent } from './espace-dossier-page.component';

const dossier = {
  id: 'd1',
  numero: '2026-0001',
  statut: 'REJETEE',
  dateDepot: '2026-11-01T09:00:00Z',
  decision: 'REJETEE',
  motifRejet: 'Piece manquante',
  chronologie: [],
  courrierDisponible: false,
};

const pieces = {
  rejetId: 'r1',
  demandeId: 'd1',
  motifLibelle: 'Piece manquante',
  messageMaxLength: 500,
  peutEnvoyer: true,
  envois: [],
};

describe('EspaceDossierPageComponent', () => {
  function setup() {
    const gateway = {
      dossier: vi.fn(() => of(dossier)),
      downloadCourrier: vi.fn(() => of(new Blob(['pdf']))),
    };
    const rejetPieces = {
      get: vi.fn(() => of(pieces)),
      send: vi.fn(() => of(pieces)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AdhesionGateway, useValue: gateway },
        { provide: RejetPiecesGateway, useValue: rejetPieces },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
        { provide: CorrelationService, useValue: { last: null } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new EspaceDossierPageComponent());
    component.ngOnInit();
    return { component, gateway, rejetPieces };
  }

  it('charge le dossier et les pieces', () => {
    const { component, rejetPieces } = setup();
    expect(component.dossier()).toEqual(dossier);
    expect(component.pieces()).toEqual(pieces);
    expect(rejetPieces.get).toHaveBeenCalledWith('d1');
  });

  it('valide les limites de fichiers', () => {
    const { component } = setup();
    const input = (files: File[]) => ({ target: { files } }) as unknown as Event;

    component.onFiles(input(Array.from({ length: 11 }, () => file('a.pdf', 1))));
    expect(component.piecesError()).toContain('Maximum 10');

    component.onFiles(input([file('big.pdf', 2 * 1024 * 1024 + 1)]));
    expect(component.piecesError()).toContain('2 Mo');

    component.onFiles(
      input([
        file('a.pdf', 2 * 1024 * 1024),
        file('b.pdf', 2 * 1024 * 1024),
        file('c.pdf', 2 * 1024 * 1024),
      ]),
    );
    expect(component.piecesError()).toContain('5 Mo');

    component.onFiles(input([file('ok.pdf', 10)]));
    expect(component.selectedFiles()).toHaveLength(1);
  });

  it('envoie les pieces et gere le message et les erreurs', () => {
    const { component, rejetPieces } = setup();
    component.onFiles({ target: { files: [file('ok.pdf', 10)] } } as unknown as Event);
    component.onMessage({ target: { value: 'Merci' } } as unknown as Event);
    component.sendPieces();
    expect(rejetPieces.send).toHaveBeenCalledWith('d1', expect.any(Array), 'Merci');
    expect(component.notice()).toContain('Pieces transmises');

    rejetPieces.send.mockReturnValueOnce(throwError(() => new Error('refus')));
    component.onFiles({ target: { files: [file('ok.pdf', 10)] } } as unknown as Event);
    component.sendPieces();
    expect(component.piecesError()).toBeTruthy();
  });

  it('telecharge le courrier et gere une erreur', () => {
    const { component, gateway } = setup();
    component.dossier.set({ ...dossier, courrierDisponible: true });
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    component.download();
    expect(create).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:url');
    expect(component.notice()).toContain('Courrier telecharge');

    gateway.downloadCourrier.mockReturnValueOnce(throwError(() => new Error('refus')));
    component.download();
    expect(component.problem()).toBeTruthy();
  });
});

function file(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' });
}

import { convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { AdhesionPublicPageComponent } from './adhesion-public-page.component';

function setup(token?: string) {
  const gateway = {
    create: vi.fn(() => of({ message: 'ok' })),
    verify: vi.fn(() =>
      of({
        jeton: 'u1',
        emailMasque: 'a***@example.test',
        statut: 'PIECES_A_FOURNIR',
        pieces: [],
      }),
    ),
    suivi: vi.fn(() => of({ statut: 'PIECES_A_FOURNIR', pieces: [], peutSoumettre: false })),
    uploadPiece: vi.fn(() => of({ type: 'PIECE_IDENTITE', fileName: 'id.pdf' })),
    submit: vi.fn(() => of({ statut: 'EN_ATTENTE_VALIDATION', pieces: [], peutSoumettre: false })),
    modeleUrl: vi.fn(() => '/api/v1/public/adhesions/modele-autorisation'),
  };
  TestBed.configureTestingModule({
    imports: [AdhesionPublicPageComponent],
    providers: [
      { provide: AdhesionGateway, useValue: gateway },
      { provide: CorrelationService, useValue: { last: undefined } },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) },
        },
      },
    ],
  });
  return { fixture: TestBed.createComponent(AdhesionPublicPageComponent), gateway };
}

describe('AdhesionPublicPageComponent', () => {
  beforeEach(() => localStorage.clear());

  it('envoie la demande et affiche le message neutre', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.ncc.set('1234567A');
    component.nom.set('Diallo');
    component.prenom.set('Awa');
    component.fonction.set('Gerante');
    component.email.set('awa@example.test');
    component.telephone.set('+2250700000009');
    component.submitDemand();

    expect(gateway.create).toHaveBeenCalled();
    expect(component.step()).toBe('sent');
  });

  it('verifie le jeton et charge les pieces', () => {
    const { fixture, gateway } = setup('email-token');
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(gateway.verify).toHaveBeenCalledWith('email-token');
    expect(component.step()).toBe('pieces');
    expect(component.modeleHref()).toContain('modele-autorisation');
  });

  it('reprend une adhesion deja verifiee apres un rechargement', () => {
    localStorage.setItem('pdref.adhesion.uploadToken', 'u1');
    const { fixture, gateway } = setup('email-token');
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(gateway.suivi).toHaveBeenCalledWith('u1');
    expect(gateway.verify).not.toHaveBeenCalled();
    expect(component.step()).toBe('pieces');
  });

  it('televerse les pieces et soumet la demande', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.step.set('pieces');
    component.uploadToken.set('u1');

    component.upload('PIECE_IDENTITE', {
      target: { files: [new File(['x'], 'id.pdf', { type: 'application/pdf' })] },
    } as unknown as Event);
    expect(gateway.uploadPiece).toHaveBeenCalled();
    expect(component.uploaded()['PIECE_IDENTITE']).toBe('id.pdf');
    expect(component.allPiecesPresent()).toBe(false);

    component.submitPieces();
    expect(gateway.submit).toHaveBeenCalledWith('u1');
    expect(component.step()).toBe('done');
  });
});

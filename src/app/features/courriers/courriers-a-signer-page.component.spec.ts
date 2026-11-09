import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourrierASigner } from '../../core/models/courriers/courrier.model';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { CourriersASignerPageComponent } from './courriers-a-signer-page.component';

const item: CourrierASigner = {
  courrierId: 'c1',
  numero: 'C-1',
  objet: 'Refus',
  demandeId: 'd1',
  numeroDemande: '2026-0001',
  raisonSociale: 'Client',
  decisionLe: '2026-11-01T00:00:00Z',
  joursDepuisDecision: 8,
  signatureStatut: 'EN_ATTENTE',
};

describe('CourriersASignerPageComponent', () => {
  const gateway = {
    aSigner: vi.fn(() => of([item])),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge et filtre les courriers a signer', () => {
    TestBed.configureTestingModule({
      imports: [CourriersASignerPageComponent],
      providers: [provideRouter([]), { provide: CourriersGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(CourriersASignerPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.items()).toHaveLength(1);
    expect(component.loading()).toBe(false);
    component.search = '2026';
    component.load();
    expect(gateway.aSigner).toHaveBeenCalledWith('2026');
  });

  it('affiche une erreur si la liste est indisponible', () => {
    gateway.aSigner.mockReturnValueOnce(throwError(() => new Error('down')));
    TestBed.configureTestingModule({
      imports: [CourriersASignerPageComponent],
      providers: [provideRouter([]), { provide: CourriersGateway, useValue: gateway }],
    });
    const component = TestBed.createComponent(CourriersASignerPageComponent).componentInstance;
    expect(component.problem()).not.toBeNull();
  });
});

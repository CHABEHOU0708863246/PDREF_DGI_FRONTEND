import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { PublicSuiviResponse } from '../../core/models/public-suivi/public-suivi.model';
import { PublicSuiviGateway } from '../../core/services/public-suivi/public-suivi.gateway';
import { PortailPublicComponent } from './portail-public.component';

const response: PublicSuiviResponse = {
  trouve: true,
  message: 'Dossiers trouves.',
  dossiers: [
    {
      numero: 'DOS-1',
      statut: 'EN_CIRCUIT',
      etapes: [
        { code: 'VERIF_GUDEF', date: '2026-11-06T00:00:00Z' },
        { code: 'AVIS_DERAR', date: '2026-11-07T00:00:00Z' },
      ],
      decisionFinale: 'FAVORABLE',
      motifRejet: 'Motif officiel',
    },
  ],
};

function create(gateway: object) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PortailPublicComponent],
    providers: [provideRouter([]), { provide: PublicSuiviGateway, useValue: gateway }],
  });
  const fixture = TestBed.createComponent(PortailPublicComponent);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('PortailPublicComponent', () => {
  it('affiche la chronologie apres recherche', () => {
    const gateway = { search: vi.fn(() => of(response)) };
    const component = create(gateway);
    expect(component.mode()).toBe('idle');
    component.onNcc({ target: { value: '1234567A' } } as unknown as Event);
    component.onEmail({ target: { value: 'user@example.com' } } as unknown as Event);
    component.submit();
    expect(gateway.search).toHaveBeenCalledWith({ ncc: '1234567A', email: 'user@example.com' });
    expect(component.result()?.dossiers[0].etapes).toHaveLength(2);
    expect(component.formatDate('2026-11-09T00:00:00Z')).toContain('2026');
  });

  it('affiche le message neutre et bloque au 429', () => {
    const neutral = create({
      search: vi.fn(() => of({ trouve: false, message: 'neutre', dossiers: [] })),
    });
    neutral.submit();
    expect(neutral.result()?.trouve).toBe(false);
    const blocked = create({ search: vi.fn(() => throwError(() => ({ status: 429 }))) });
    blocked.submit();
    expect(blocked.blocked()).toBe(true);
    const failed = create({ search: vi.fn(() => throwError(() => ({ status: 500 }))) });
    failed.submit();
    expect(failed.problem()).not.toBeNull();
  });
});

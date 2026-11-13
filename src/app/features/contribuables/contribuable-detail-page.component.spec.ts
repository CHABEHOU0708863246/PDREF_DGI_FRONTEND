import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ContribuableDetailPageComponent } from './contribuable-detail-page.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';
import { PermissionsService } from '../../core/services/permissions/permissions.service';

const item = {
  id: 'c1',
  ncc: '1234567A',
  raisonSociale: 'Client Alpha',
  systemeComptable: 'SYSCOHADA',
  centreImpotId: 'c1',
  centreImpotLibelle: 'GUDEF',
  directionRattachementId: 'd1',
  secteur: null,
  formeJuridique: null,
  zoneId: null,
  adresse: null,
  emailMasque: 'j***@example.ci',
  telephoneMasque: null,
  email: null,
  telephone: null,
  emailManquant: false,
  telephoneManquant: true,
  nccHorsFormat: false,
  centreRattachementManquant: false,
  evalueLe: '2026-11-01T00:00:00Z',
  isArchived: false,
  archivedAt: null,
};

function setup(canReveal = true) {
  const gateway = {
    get: vi.fn((_id: string, reveal = false) =>
      of(reveal ? { ...item, email: 'jean@example.ci' } : item),
    ),
    archive: vi.fn(() => of({})),
    syncEImpots: vi.fn(() => of({})),
  };
  const permissions = { hasPermission: vi.fn(() => canReveal) };
  TestBed.configureTestingModule({
    imports: [ContribuableDetailPageComponent],
    providers: [
      { provide: ContribuablesGateway, useValue: gateway },
      { provide: PermissionsService, useValue: permissions },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'c1' } } } },
    ],
  });
  return {
    fixture: TestBed.createComponent(ContribuableDetailPageComponent),
    gateway,
    permissions,
  };
}

describe('ContribuableDetailPageComponent', () => {
  it('charge la fiche masquee et applique la permission de revelation', () => {
    const { fixture, permissions } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.item()?.emailMasque).toBe('j***@example.ci');
    expect(fixture.componentInstance.canReveal()).toBe(true);
    expect(permissions.hasPermission).toHaveBeenCalledWith('Contribuables_ReadPii');
  });

  it('ferme le panneau vers la liste', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(() => fixture.componentInstance.close()).not.toThrow();
  });

  it('revele les contacts et trace le message', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.reveal();
    expect(gateway.get).toHaveBeenLastCalledWith('c1', true);
    expect(fixture.componentInstance.item()?.email).toBe('jean@example.ci');
    expect(fixture.componentInstance.message()).toContain('Contacts reveles');
  });

  it('archive et synchronise', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.archive();
    fixture.componentInstance.sync();
    expect(gateway.archive).toHaveBeenCalledWith('c1');
    expect(gateway.syncEImpots).toHaveBeenCalledWith('c1');
  });
});

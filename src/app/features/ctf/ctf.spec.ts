import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CtfDetail, CtfListItem } from '../../core/models/ctf/ctf.model';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CtfGateway } from '../../core/services/ctf/ctf.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
import { CtfAActiverPageComponent } from './ctf-a-activer-page.component';
import { CtfDetailPageComponent } from './ctf-detail-page.component';
import { CtfSuiviPageComponent } from './ctf-suivi-page.component';

const item: CtfListItem = {
  id: 'c1',
  demandeId: 'd1',
  numeroDemande: '2026-0001',
  cycle: 1,
  ncc: '1234567A',
  raisonSociale: 'Client CTF',
  statut: 'A_ACTIVER',
  dateCreation: '2026-11-05T00:00:00Z',
  echeanceActivation: '2026-11-12T00:00:00Z',
  echeanceDepot: '2026-11-26T00:00:00Z',
  joursRestantsActivation: 5,
  joursRestantsDepot: 15,
  motifCloture: null,
  dateCloture: null,
};

const detail: CtfDetail = {
  ...item,
  courrierId: 'courrier-1',
  idempotencyKey: 'courrier-1:1',
  referenceActivation: null,
  dateActivationDemandee: null,
  dateActivation: null,
  dateInformation: null,
  dateRetourGudef: null,
  dateDepotRectifie: null,
  referenceDepotRectifie: null,
  modeActivation: null,
  modeDepotRectifie: null,
  tentatives: 0,
  derniereErreur: null,
};

function providers(permissions: string[]) {
  const permissionService = new PermissionsService();
  permissionService.load({
    id: 'u1',
    login: 'u',
    displayName: 'User',
    roles: ['CHEF_CTF'],
    permissions,
    mustChangePassword: false,
  });
  return [
    provideRouter([]),
    { provide: PermissionsService, useValue: permissionService },
    {
      provide: IntegrationGateway,
      useValue: { modes: () => of({ eImpots: 'MANUEL', signature: 'MANUEL' }) },
    },
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { paramMap: convertToParamMap({ id: 'd1' }) } },
    },
  ];
}

describe('Pages CTF', () => {
  const gateway = {
    aActiver: vi.fn(() => of([item])),
    list: vi.fn(() => of([item])),
    get: vi.fn(() => of(detail)),
    activer: vi.fn(() => of(detail)),
    retourGudef: vi.fn(() => of(detail)),
    activationManuelle: vi.fn(() => of(detail)),
    depotRectifieManuel: vi.fn(() => of(detail)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('liste les demandes a activer et neutralise le double clic', () => {
    TestBed.configureTestingModule({
      imports: [CtfAActiverPageComponent],
      providers: [
        ...providers(['Ctf_Read', 'Ctf_Activer']),
        { provide: CtfGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(CtfAActiverPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    gateway.activer.mockReturnValue(new Subject<CtfDetail>().asObservable());

    expect(component.items()).toHaveLength(1);
    expect(component.canActiver()).toBe(true);
    component.activer(item);
    component.activer(item);
    expect(gateway.activer).toHaveBeenCalledTimes(1);
  });

  it('masque les actions sans permission et affiche le suivi', () => {
    TestBed.configureTestingModule({
      imports: [CtfSuiviPageComponent],
      providers: [...providers(['Ctf_Read']), { provide: CtfGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(CtfSuiviPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.items()).toHaveLength(1);
    expect(component.canActiver()).toBe(false);
    expect(component.canRetour()).toBe(false);
    expect(component.statutLabel('A_ACTIVER')).toBe('A activer');
  });

  it('couvre les evenements de filtre et les actions de suivi', () => {
    TestBed.configureTestingModule({
      imports: [CtfAActiverPageComponent, CtfSuiviPageComponent],
      providers: [
        ...providers(['Ctf_Read', 'Ctf_Activer', 'Ctf_Retour']),
        { provide: CtfGateway, useValue: gateway },
      ],
    });
    const aActiver = TestBed.createComponent(CtfAActiverPageComponent).componentInstance;
    const input = document.createElement('input');
    input.value = '2026';
    aActiver.onSearch({ target: input } as unknown as Event);

    const fixture = TestBed.createComponent(CtfSuiviPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const search = document.createElement('input');
    search.value = '2026';
    component.onSearch({ target: search } as unknown as Event);
    const select = document.createElement('select');
    select.value = 'A_ACTIVER';
    component.onStatut({ target: select } as unknown as Event);
    component.activer(item);
    component.retour(item);
    expect(gateway.activer).toHaveBeenCalled();
    expect(gateway.retourGudef).toHaveBeenCalled();
  });

  it('gere les erreurs des actions manuelles CTF', () => {
    const errorGateway = {
      aActiver: vi.fn(() => of([item])),
      list: vi.fn(() => of([item])),
      get: vi.fn(() => throwError(() => new Error('load'))),
      activer: vi.fn(() => throwError(() => new Error('activate'))),
      retourGudef: vi.fn(() => throwError(() => new Error('return'))),
      activationManuelle: vi.fn(() => throwError(() => new Error('manual'))),
      depotRectifieManuel: vi.fn(() => throwError(() => new Error('depot'))),
    };
    TestBed.configureTestingModule({
      imports: [CtfDetailPageComponent],
      providers: [
        ...providers(['Ctf_Read', 'Ctf_Activer', 'Ctf_Retour']),
        { provide: CtfGateway, useValue: errorGateway },
      ],
    });
    const component = TestBed.createComponent(CtfDetailPageComponent).componentInstance;
    component.declarerActivation();
    component.declarerDepot();
    component.activer();
    component.retour();
    expect(component.problem()).not.toBeNull();
  });

  it('couvre le detail CTF et ses actions', () => {
    TestBed.configureTestingModule({
      imports: [CtfDetailPageComponent],
      providers: [
        ...providers(['Ctf_Read', 'Ctf_Activer', 'Ctf_Retour']),
        { provide: CtfGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(CtfDetailPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.item()).not.toBeNull();
    expect(component.canActiver()).toBe(true);
    expect(component.canRetour()).toBe(true);
    expect(component.manualEImpots()).toBe(true);
    component.onReference({ target: { value: 'REF' } } as unknown as Event);
    component.onReferenceDepot({ target: { value: 'DEP' } } as unknown as Event);
    component.onDateActivation({ target: { value: '2026-11-06' } } as unknown as Event);
    component.onDateDepot({ target: { value: '2026-11-07' } } as unknown as Event);
    component.declarerActivation();
    component.declarerDepot();
    component.activer();
    component.retour();
    expect(gateway.activationManuelle).toHaveBeenCalled();
    expect(gateway.depotRectifieManuel).toHaveBeenCalled();
    expect(component.statutLabel('A_ACTIVER')).toBe('A activer');
    expect(gateway.get).toHaveBeenCalled();
  });
});

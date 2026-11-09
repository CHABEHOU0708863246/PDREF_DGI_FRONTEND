import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RejetDetail, RejetListItem, RejetPage } from '../../core/models/rejets/rejet.model';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { RejetDetailPageComponent } from './rejet-detail-page.component';
import { RejetsListPageComponent } from './rejets-list-page.component';

const item: RejetListItem = {
  id: 'r1',
  demandeId: 'd1',
  numeroDemande: '2026-0001',
  cycle: 1,
  cycleCourant: 1,
  famille: 'PAR_AGENT',
  motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
  motifLibelle: 'Piece justificative manquante',
  commentaire: 'Commentaire de rejet',
  statut: 'EN_ATTENTE_CORRECTION',
  pieceComplementaireRequise: true,
  dateCreation: '2026-11-05T00:00:00Z',
  dateReprise: null,
  dateAbandon: null,
  motifAbandon: null,
};

const page: RejetPage = {
  items: [item],
  page: 1,
  pageSize: 50,
  totalCount: 1,
  enAttenteCorrectionCount: 1,
  corrigeCount: 0,
  abandonneCount: 0,
};

const detail: RejetDetail = {
  ...item,
  pieceComplementaireFileId: null,
  reprisePar: null,
  abandonnePar: null,
  dateClotureDefinitive: null,
  historique: [
    {
      id: 'r1',
      cycle: 1,
      famille: 'PAR_AGENT',
      motifCode: item.motifCode,
      motifLibelle: item.motifLibelle,
      statut: item.statut,
      dateCreation: item.dateCreation,
      dateReprise: null,
      dateAbandon: null,
    },
  ],
};

function providers(permissions: string[]) {
  const permissionService = new PermissionsService();
  permissionService.load({
    id: 'u1',
    login: 'u',
    displayName: 'User',
    roles: ['SD_GUDEF'],
    permissions,
    mustChangePassword: false,
  });
  return [
    provideRouter([]),
    { provide: PermissionsService, useValue: permissionService },
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { paramMap: convertToParamMap({ id: 'r1' }) } },
    },
  ];
}

describe('Pages Rejets', () => {
  const gateway = {
    list: vi.fn(() => of(page)),
    motifs: vi.fn(() =>
      of([
        { code: item.motifCode, libelle: item.motifLibelle, legacy: false, selectionnable: true },
      ]),
    ),
    get: vi.fn(() => of(detail)),
    reprendre: vi.fn(() => of({ ...detail, statut: 'CORRIGE' })),
    abandonner: vi.fn(() => of({ ...detail, statut: 'ABANDONNE' })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('liste, compteurs, filtres et reprise', () => {
    TestBed.configureTestingModule({
      imports: [RejetsListPageComponent],
      providers: [
        ...providers(['Rejets_Read', 'Rejets_Reprendre', 'Rejets_Abandonner']),
        { provide: RejetGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(RejetsListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.page().items).toHaveLength(1);
    expect(component.page().enAttenteCorrectionCount).toBe(1);
    expect(component.canReprendre()).toBe(true);
    expect(component.canAbandonner()).toBe(true);
    expect(component.isActionable(item)).toBe(true);
    expect(component.statutLabel(item.statut)).toBe('En attente de correction');

    const search = document.createElement('input');
    search.value = '2026';
    component.onSearch({ target: search } as unknown as Event);
    const statut = document.createElement('select');
    statut.value = 'CORRIGE';
    component.onStatut({ target: statut } as unknown as Event);
    const famille = document.createElement('select');
    famille.value = 'PAR_AGENT';
    component.onFamille({ target: famille } as unknown as Event);
    const motif = document.createElement('select');
    motif.value = item.motifCode;
    component.onMotif({ target: motif } as unknown as Event);

    component.askReprendre(item);
    expect(component.repriseOpen()).toBe(true);
    component.confirmReprendre();
    expect(gateway.reprendre).toHaveBeenCalledWith('r1');
    component.askAbandon(item);
    component.confirmAbandon('Le contribuable renonce a sa demande.');
    expect(gateway.abandonner).toHaveBeenCalledWith('r1', 'Le contribuable renonce a sa demande.');
  });

  it('masque les actions sans permission', () => {
    TestBed.configureTestingModule({
      imports: [RejetsListPageComponent],
      providers: [...providers(['Rejets_Read']), { provide: RejetGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(RejetsListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.canReprendre()).toBe(false);
    expect(component.canAbandonner()).toBe(false);
    component.askReprendre(item);
    expect(component.repriseOpen()).toBe(false);
  });

  it('charge le detail et ses actions', () => {
    TestBed.configureTestingModule({
      imports: [RejetDetailPageComponent],
      providers: [
        ...providers(['Rejets_Read', 'Rejets_Reprendre', 'Rejets_Abandonner']),
        { provide: RejetGateway, useValue: gateway },
      ],
    });
    const fixture = TestBed.createComponent(RejetDetailPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.item()).not.toBeNull();
    expect(component.isActionable(detail)).toBe(true);
    component.reprendre();
    expect(gateway.reprendre).toHaveBeenCalledWith('r1');
    component.abandonner('Le contribuable renonce a sa demande.');
    expect(gateway.abandonner).toHaveBeenCalledWith('r1', 'Le contribuable renonce a sa demande.');
    expect(component.familleLabel('PAR_AGENT')).toBe('Rejet agent');
  });
});

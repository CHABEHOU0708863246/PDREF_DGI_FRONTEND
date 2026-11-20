import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type {
  DashboardAnalytique,
  DashboardKpis,
  DashboardNominatifPage,
  DashboardQualite,
} from '../../../core/models/dashboard/dashboard.model';
import { PermissionsService } from '../../../core/services/permissions/permissions.service';
import { DashboardGateway } from '../../../core/services/dashboard/dashboard.gateway';
import { DashboardHomeComponent } from './dashboard-home.component';

const kpis: DashboardKpis = {
  courriersRecus: 1,
  rejetes: 1,
  totalDemandes: 2,
  enCours: 1,
  favorables: 1,
  nonFavorables: 0,
  enRetard: 1,
  dateCalcul: '2026-11-09T00:00:00Z',
};
const quality: DashboardQualite = {
  totalContribuables: 2,
  sansEmail: 1,
  sansTelephone: 1,
  sansCentre: 0,
  nccHorsFormat: 0,
  pourcentageSansEmail: 50,
  pourcentageSansTelephone: 50,
  pourcentageSansCentre: 0,
  pourcentageNccHorsFormat: 0,
};
const analytique: DashboardAnalytique = {
  tauxTraitement: 50,
  dureeMoyenneJours: 42,
  total: 2,
  enCours: 1,
  enRetard: 1,
  repartition: [
    { code: 'EN_COURS', libelle: 'En cours', valeur: 1 },
    { code: 'FAVORABLE', libelle: 'Favorables', valeur: 1 },
    { code: 'NON_FAVORABLE', libelle: 'Non favorables', valeur: 0 },
    { code: 'REJETE', libelle: 'Rejetes', valeur: 0 },
  ],
  evolution: [{ periode: '2026-11', libelle: 'Nov.', total: 2, favorables: 1, nonFavorables: 0 }],
  directions: [
    { directionCode: 'DERAR', libelle: 'DERAR', total: 2, enCours: 1, tauxTraitement: 50 },
  ],
  demandesRecentes: [
    {
      demandeId: 'd1',
      numero: '2026-0001',
      contribuable: 'Client',
      statut: 'EN_COURS',
      dateDepot: '2026-11-08T00:00:00Z',
    },
  ],
  dateCalcul: '2026-11-09T00:00:00Z',
};
const nominatif: DashboardNominatifPage = {
  items: [
    {
      demandeId: 'd1',
      numeroDemande: '2026-0001',
      contribuable: 'Client',
      ncc: '1234567A',
      etat: 'EN_CIRCUIT',
      niveauTraitement: 'GUDEF',
      delaiGudefJo: 2,
      delaiDirectionsJo: 0,
      delaiCtfJo: 0,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
};

describe('DashboardHomeComponent', () => {
  it('affiche les KPI, le graphique, la qualite et le nominatif', () => {
    const gateway = {
      kpis: vi.fn(() => of(kpis)),
      analytique: vi.fn(() => of(analytique)),
      qualite: vi.fn(() => of(quality)),
      nominatif: vi.fn(() => of(nominatif)),
    };
    const permissions = new PermissionsService();
    permissions.load({
      id: 'u1',
      login: 'u',
      displayName: 'User',
      roles: ['DG'],
      permissions: ['Dashboard_Read', 'Dashboard_ReadDg'],
      mustChangePassword: false,
    });
    TestBed.configureTestingModule({
      imports: [DashboardHomeComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardGateway, useValue: gateway },
        { provide: PermissionsService, useValue: permissions },
      ],
    });
    const fixture = TestBed.createComponent(DashboardHomeComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.kpis()?.totalDemandes).toBe(2);
    expect(component.chartData()).toHaveLength(4);
    expect(component.analytique()?.tauxTraitement).toBe(50);
    expect(component.repartitionData()).toHaveLength(2);
    expect(component.evolutionData()).toHaveLength(1);
    expect(component.directionBars()).toHaveLength(1);
    expect(component.directions()).toHaveLength(1);
    expect(component.recentes()).toHaveLength(1);
    expect(component.formatRate(50)).toBe('50,0 %');
    expect(component.statutLabel('FAVORABLE')).toBe('Avis favorable');
    expect(component.qualite()?.pourcentageSansEmail).toBe(50);
    expect(component.canNominatif()).toBe(true);
    component.setTab('nominatif');
    expect(gateway.nominatif).toHaveBeenCalled();
    component.onPeriode({ target: { value: '7j' } } as unknown as Event);
    component.onStatut({ target: { value: 'EN_CIRCUIT' } } as unknown as Event);
    component.load();
    expect(gateway.kpis).toHaveBeenCalled();
  });
});

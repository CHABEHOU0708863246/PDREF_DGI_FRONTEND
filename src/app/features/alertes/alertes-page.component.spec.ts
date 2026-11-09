import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { AlertePage, AlerteStats } from '../../core/models/alertes/alerte.model';
import { AlerteGateway } from '../../core/services/alertes/alerte.gateway';
import { AlertesPageComponent } from './alertes-page.component';

const page: AlertePage = {
  items: [
    {
      id: 'a1',
      demandeId: 'd1',
      numeroDemande: '2026-0001',
      cycle: 1,
      etape: 'VERIF_GUDEF',
      type: 'RETARD',
      directionId: 'GUDEF',
      dateEcheance: '2026-11-05T00:00:00Z',
      joursRetard: 3,
      statut: 'OUVERTE',
      derniereRelanceAt: null,
    },
  ],
  page: 1,
  pageSize: 50,
  totalCount: 1,
  ouvertes: 1,
  resolues: 0,
  enRetard: 1,
};
const stats: AlerteStats = {
  granularite: 'semaine',
  points: [{ periode: '2026-S45', libelle: '2026-S45', valeur: 1 }],
};

describe('AlertesPageComponent', () => {
  it('affiche les compteurs, le graphique et filtre par periode', () => {
    const gateway = {
      list: vi.fn(() => of(page)),
      stats: vi.fn(() => of(stats)),
    };
    TestBed.configureTestingModule({
      imports: [AlertesPageComponent],
      providers: [provideRouter([]), { provide: AlerteGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(AlertesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.page().ouvertes).toBe(1);
    expect(component.chartData()).toHaveLength(1);
    expect(component.typeLabel('RETARD')).toBe('Retard');
    expect(component.statutLabel('OUVERTE')).toBe('Ouverte');
    expect(component.isDanger(page.items[0])).toBe(true);

    component.filterPeriod('2026-S45');
    expect(gateway.list).toHaveBeenCalledTimes(2);
  });

  it('couvre les filtres et les periodes mois', () => {
    const gateway = { list: vi.fn(() => of(page)), stats: vi.fn(() => of(stats)) };
    TestBed.configureTestingModule({
      imports: [AlertesPageComponent],
      providers: [provideRouter([]), { provide: AlerteGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(AlertesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.onGranularity({ target: { value: 'mois' } } as unknown as Event);
    const dateDu = document.createElement('input');
    dateDu.value = '2026-11-01';
    component.onDateDu({ target: dateDu } as unknown as Event);
    const dateAu = document.createElement('input');
    dateAu.value = '2026-11-30';
    component.onDateAu({ target: dateAu } as unknown as Event);
    const direction = document.createElement('select');
    direction.value = 'GUDEF';
    component.onDirection({ target: direction } as unknown as Event);
    const type = document.createElement('select');
    type.value = 'RETARD';
    component.onType({ target: type } as unknown as Event);
    const etape = document.createElement('input');
    etape.value = 'VERIF_GUDEF';
    component.onEtape({ target: etape } as unknown as Event);
    component.filterPeriod('2026-11');
    expect(component.granularity()).toBe('mois');
    expect(gateway.stats).toHaveBeenCalled();
  });
});

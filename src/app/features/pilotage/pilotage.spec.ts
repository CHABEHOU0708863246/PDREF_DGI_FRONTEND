import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PilotageGateway } from '../../core/services/pilotage/pilotage.gateway';
import { PilotageListPageComponent } from './pilotage-list-page.component';
import { WorkloadPageComponent } from './workload-page.component';

describe('Pilotage pages', () => {
  it('affiche la liste de drill-down', () => {
    const gateway = {
      drilldown: vi.fn(() =>
        of({
          items: [
            {
              demandeId: 'd1',
              numero: '2026-0001',
              contribuable: 'Client',
              ncc: '1234567A',
              statut: 'EN_CIRCUIT',
              etapeCourante: 'VERIF_GUDEF',
              dateDepot: '2026-11-01T00:00:00Z',
              enRetard: true,
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [PilotageListPageComponent],
      providers: [
        { provide: PilotageGateway, useValue: gateway },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'source' ? 'DASHBOARD' : 'EN_RETARD'),
              },
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(PilotageListPageComponent);
    fixture.detectChanges();
    expect(gateway.drilldown).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2026-0001');
  });

  it('affiche la charge par agent et direction', () => {
    const gateway = {
      workload: vi.fn(() =>
        of({
          agents: [
            {
              userId: 'u1',
              displayName: 'M. Yao',
              directionCode: 'GUDEF',
              enCours: 2,
              enRetard: 1,
            },
          ],
          directions: [{ directionId: 'GUDEF', enCours: 2, enRetard: 1 }],
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [WorkloadPageComponent],
      providers: [{ provide: PilotageGateway, useValue: gateway }],
    });
    const fixture = TestBed.createComponent(WorkloadPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('M. Yao');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('GUDEF');
  });
});

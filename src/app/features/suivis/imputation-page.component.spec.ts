import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { ImputationGateway } from '../../core/services/suivis/imputation.gateway';
import { ImputationPageComponent } from './imputation-page.component';

describe('ImputationPageComponent', () => {
  it('affiche les dossiers a distribuer et gere les agents', () => {
    const gateway = {
      list: vi.fn(() =>
        of({
          items: [
            {
              demandeId: 'd1',
              numero: '2026-0001',
              contribuable: 'Client',
              ncc: '1234567A',
              dateDepot: null,
              echeance: null,
              statutEtape: 'ACTIVE',
              assigneeUserId: null,
              assigneeName: null,
              assignedBy: null,
              assignedAt: null,
              instruction: null,
              enRetard: false,
              historique: [],
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          nonAttribues: 1,
        }),
      ),
      agents: vi.fn(() => of([{ userId: 'u1', displayName: 'M. Yao', roleKeys: ['AGENT_GUDEF'] }])),
      instructions: vi.fn(() => of(['VERIFIER'])),
      assign: vi.fn(() => of({})),
    };
    TestBed.configureTestingModule({
      imports: [ImputationPageComponent],
      providers: [
        { provide: ImputationGateway, useValue: gateway },
        { provide: PermissionsService, useValue: { hasPermission: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(ImputationPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('À distribuer');
    expect(element.textContent).toContain('2026-0001');
    expect(gateway.agents).toHaveBeenCalled();
  });
});

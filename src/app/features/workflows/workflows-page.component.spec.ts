import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowsPageComponent } from './workflows-page.component';
import { WorkflowsGateway } from '../../core/services/workflows/workflows.gateway';

const item = {
  id: 'w1',
  code: 'parallele-v1',
  versionDef: 1,
  status: 'ACTIVE' as const,
  name: 'Circuit parallele',
  description: 'Description',
  sourceRef: 'REF-7',
  provisional: true,
  featureFlag: { key: 'workflow.variantes', enabled: false },
  steps: [
    {
      code: 'CONFORMITE_AUTO',
      name: 'Conformite',
      kind: 'AUTO',
      orderNumber: 10,
      delayParameterKey: null,
      roleCodes: [],
      prerequisiteStepCodes: [],
      groupCode: null,
      isTerminal: false,
      isEarlyExit: false,
    },
    {
      code: 'VERIF_GUDEF',
      name: 'Verification',
      kind: 'LINEAIRE',
      orderNumber: 20,
      delayParameterKey: 'delais.verifGudefJO',
      roleCodes: ['AGENT_GUDEF'],
      prerequisiteStepCodes: ['CONFORMITE_AUTO'],
      groupCode: null,
      isTerminal: false,
      isEarlyExit: false,
    },
  ],
  joins: [
    {
      code: 'AVIS_JOIN',
      groupCode: 'AVIS',
      branchStepCodes: ['A', 'B'],
      nextStepCode: 'VALIDATION',
      nonFavorableStepCode: 'NON_FAVORABLE',
      stopAtFirstParameterKey: 'workflow.arretAuPremierNonFavorable',
    },
  ],
  createdAt: '2026-11-06T00:00:00Z',
  updatedAt: null,
  version: 1,
};

function setup() {
  const gateway = { list: vi.fn(() => of([item])) };
  TestBed.configureTestingModule({
    imports: [WorkflowsPageComponent],
    providers: [{ provide: WorkflowsGateway, useValue: gateway }],
  });
  return { fixture: TestBed.createComponent(WorkflowsPageComponent), gateway };
}

describe('WorkflowsPageComponent', () => {
  it('charge la liste et selectionne la premiere definition', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    expect(gateway.list).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.componentInstance.selected()?.code).toBe('parallele-v1');
    expect(fixture.nativeElement.textContent).toContain('Verification');
  });

  it('filtre par statut, selectionne et expose les libelles', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.status = 'HISTORIQUE';
    fixture.componentInstance.load();
    expect(gateway.list).toHaveBeenLastCalledWith('HISTORIQUE');
    fixture.componentInstance.select(item);
    expect(fixture.componentInstance.statusLabel('ACTIVE')).toBe('Actif');
    expect(fixture.componentInstance.statusLabel('BROUILLON')).toBe('Brouillon');
    expect(fixture.componentInstance.kindLabel('BRANCHE_PARALLELE')).toBe('Branche parallele');
  });
});

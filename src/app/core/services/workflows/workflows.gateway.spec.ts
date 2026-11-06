import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { WorkflowsGateway } from './workflows.gateway';

const item = {
  id: 'w1',
  code: 'parallele-v1',
  versionDef: 1,
  status: 'ACTIVE',
  name: 'Parallele',
  description: null,
  sourceRef: 'REF-7',
  provisional: true,
  featureFlag: { key: 'workflow.variantes', enabled: false },
  steps: [],
  joins: [],
  createdAt: '2026-11-06T00:00:00Z',
  updatedAt: null,
  version: 1,
};

describe('WorkflowsGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(WorkflowsGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('liste avec filtre et lit une version', () => {
    const { gateway, http } = setup();
    gateway.list('ACTIVE').subscribe((items) => expect(items).toHaveLength(1));
    const list = http.expectOne((request) => request.url.endsWith('/workflows'));
    expect(list.request.params.get('status')).toBe('ACTIVE');
    list.flush({ data: [item] });

    gateway.get('parallele-v1', 1).subscribe((value) => expect(value.code).toBe('parallele-v1'));
    http
      .expectOne((request) => request.url.endsWith('/workflows/parallele-v1/versions/1'))
      .flush({ data: item });
    http.verify();
  });
});

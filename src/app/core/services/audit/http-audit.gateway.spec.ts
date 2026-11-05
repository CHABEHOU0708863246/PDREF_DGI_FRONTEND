import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { HttpAuditGateway } from './http-audit.gateway';

describe('HttpAuditGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(HttpAuditGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('interroge et exporte le journal', () => {
    const { gateway, http } = setup();
    gateway.query({ eventCode: 'AUTH.LOGIN_SUCCESS', limit: 20 }).subscribe();
    const query = http.expectOne((request) => request.url.endsWith('/audit/events'));
    expect(query.request.params.get('eventCode')).toBe('AUTH.LOGIN_SUCCESS');
    query.flush({ data: { items: [], nextCursor: null, pageSize: 20 } });

    gateway.export({}, 'json').subscribe();
    const exportRequest = http.expectOne((request) => request.url.endsWith('/audit/events/export'));
    expect(exportRequest.request.params.get('format')).toBe('json');
    exportRequest.flush(new Blob(['{}']));
    http.verify();
  });
});

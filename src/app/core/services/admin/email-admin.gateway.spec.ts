import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { EmailAdminGateway } from './email-admin.gateway';

describe('EmailAdminGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(EmailAdminGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('liste avec filtre de statut et pagination', () => {
    const { gateway, http } = setup();
    gateway.list('ECHEC_FINAL', 2, 25).subscribe();
    const request = http.expectOne((item) => item.url.endsWith('/admin/emails'));
    expect(request.request.params.get('status')).toBe('ECHEC_FINAL');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ data: { items: [], page: 2, pageSize: 25, totalCount: 0 } });
    http.verify();
  });

  it('renvoie un e-mail et envoie un test', () => {
    const { gateway, http } = setup();
    gateway.retry('o1').subscribe();
    http
      .expectOne((item) => item.url.endsWith('/admin/emails/o1/retry') && item.method === 'POST')
      .flush({ data: {} });

    let success = false;
    gateway.sendTest('test@example.test').subscribe((result) => {
      success = result.success;
    });
    const request = http.expectOne((item) => item.url.endsWith('/admin/emails/test'));
    expect(request.request.body).toEqual({ to: 'test@example.test' });
    request.flush({ data: { success: true, errorCode: null, message: 'ok' } });
    expect(success).toBe(true);
    http.verify();
  });
});

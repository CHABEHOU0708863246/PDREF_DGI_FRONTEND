import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      gateway: TestBed.inject(NotificationsGateway),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('lit une page filtree et le compteur', () => {
    const { gateway, http } = setup();
    gateway.list({ read: false, page: 2, pageSize: 10 }).subscribe();
    const list = http.expectOne((request) => request.url.endsWith('/notifications'));
    expect(list.request.params.get('read')).toBe('false');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ data: { items: [], page: 2, pageSize: 10, totalCount: 0 } });

    gateway.unreadCount().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/notifications/unread-count'))
      .flush({
        data: { count: 3 },
      });
    http.verify();
  });

  it('marque une notification et toutes les notifications', () => {
    const { gateway, http } = setup();
    gateway.markRead('n1').subscribe();
    http.expectOne((request) => request.url.endsWith('/notifications/n1/read')).flush({});
    gateway.markAllRead().subscribe();
    http
      .expectOne((request) => request.url.endsWith('/notifications/read-all'))
      .flush({
        data: { count: 2 },
      });
    http.verify();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCenterService } from './notification-center.service';
import { NotificationsGateway } from './notifications.gateway';

const page = {
  items: [
    {
      id: 'n1',
      eventType: 'DEPOT_ACCUSE',
      title: 'Depot',
      message: 'Votre depot est enregistre.',
      readAt: null,
      isRead: false,
      createdAt: '2026-11-01T00:00:00Z',
    },
  ],
  page: 1,
  pageSize: 10,
  totalCount: 1,
};

function setup() {
  const gateway = {
    list: vi.fn(() => of(page)),
    unreadCount: vi.fn(() => of(1)),
    markRead: vi.fn(() => of({})),
    markAllRead: vi.fn(() => of({ count: 1 })),
  };
  TestBed.configureTestingModule({
    providers: [NotificationCenterService, { provide: NotificationsGateway, useValue: gateway }],
  });
  return { service: TestBed.inject(NotificationCenterService), gateway };
}

describe('NotificationCenterService', () => {
  it('charge les notifications de l API et compte les non lues', () => {
    const { service, gateway } = setup();
    service.load();

    expect(gateway.list).toHaveBeenCalledOnce();
    expect(gateway.unreadCount).toHaveBeenCalledOnce();
    expect(service.items()).toHaveLength(1);
    expect(service.unreadCount()).toBe(1);
  });

  it('marque une notification puis toutes les notifications', () => {
    const { service, gateway } = setup();
    service.load();
    service.markRead('n1');
    expect(gateway.markRead).toHaveBeenCalledWith('n1');
    expect(service.unreadCount()).toBe(0);

    service.markAllRead();
    expect(gateway.markAllRead).toHaveBeenCalledOnce();
    expect(service.items().every((item) => item.read)).toBe(true);
  });

  it('conserve les donnees de demonstration en developpement si l API echoue', () => {
    const gateway = {
      list: vi.fn(() => throwError(() => new Error('offline'))),
      unreadCount: vi.fn(() => throwError(() => new Error('offline'))),
      markRead: vi.fn(() => of({})),
      markAllRead: vi.fn(() => of({ count: 0 })),
    };
    TestBed.configureTestingModule({
      providers: [NotificationCenterService, { provide: NotificationsGateway, useValue: gateway }],
    });
    const service = TestBed.inject(NotificationCenterService);
    service.load();

    expect(service.items().length).toBeGreaterThan(0);
    expect(service.problem()).toBeNull();
  });

  it('peut etre vide', () => {
    const { service } = setup();
    service.clear();
    expect(service.items()).toHaveLength(0);
    expect(service.unreadCount()).toBe(0);
  });
});

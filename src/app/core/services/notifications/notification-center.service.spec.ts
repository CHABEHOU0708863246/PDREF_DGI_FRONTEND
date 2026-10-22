import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationCenterService } from './notification-center.service';

describe('NotificationCenterService', () => {
  it('compte les non lues et les marque', () => {
    TestBed.configureTestingModule({ providers: [NotificationCenterService] });
    const service = TestBed.inject(NotificationCenterService);
    expect(service.items().length).toBeGreaterThan(0);
    expect(service.unreadCount()).toBe(2);

    const first = service.items()[0];
    if (first) {
      service.markRead(first.id);
    }
    expect(service.unreadCount()).toBe(1);

    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
  });

  it('peut etre vide', () => {
    TestBed.configureTestingModule({ providers: [NotificationCenterService] });
    const service = TestBed.inject(NotificationCenterService);
    service.clear();
    expect(service.items()).toHaveLength(0);
    expect(service.unreadCount()).toBe(0);
  });
});

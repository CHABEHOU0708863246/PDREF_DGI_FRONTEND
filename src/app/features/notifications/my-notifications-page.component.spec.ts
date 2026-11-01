import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsGateway } from '../../core/services/notifications/notifications.gateway';
import { MyNotificationsPageComponent } from './my-notifications-page.component';

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
    imports: [MyNotificationsPageComponent],
    providers: [{ provide: NotificationsGateway, useValue: gateway }],
  });
  return { fixture: TestBed.createComponent(MyNotificationsPageComponent), gateway };
}

describe('MyNotificationsPageComponent', () => {
  it('charge la liste et expose le filtre', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();

    expect(gateway.list).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.items()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Votre depot est enregistre.');
  });

  it('filtre les non lues et marque une notification', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.setFilter('unread');
    expect(gateway.list).toHaveBeenLastCalledWith({ read: false, page: 1, pageSize: 10 });

    const item = fixture.componentInstance.items()[0];
    if (!item) {
      throw new Error('notification absente');
    }

    fixture.componentInstance.markRead(item);
    expect(gateway.markRead).toHaveBeenCalledWith('n1');
    expect(gateway.list).toHaveBeenCalledTimes(3);
  });

  it('marque toutes les notifications comme lues', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.markAllRead();
    expect(gateway.markAllRead).toHaveBeenCalledOnce();
  });
});

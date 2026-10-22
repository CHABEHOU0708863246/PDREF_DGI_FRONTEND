import { Injectable, computed, signal } from '@angular/core';
import type { AppNotification } from '../../models/notifications/notification.model';

const DEMO_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'demo-n-1',
    tone: 'info',
    title: 'Bienvenue dans la demonstration',
    message:
      'Les donnees affichees sont fictives et servent uniquement a valider le design system.',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'demo-n-2',
    tone: 'success',
    title: 'Composants disponibles',
    message:
      'Les etats vide, chargement, erreur et succes sont presentes sur la page de demonstration.',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    read: false,
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly itemsState = signal<AppNotification[]>([...DEMO_NOTIFICATIONS]);

  readonly items = this.itemsState.asReadonly();
  readonly unreadCount = computed(() => this.itemsState().filter((item) => !item.read).length);

  markRead(id: string): void {
    this.itemsState.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  markAllRead(): void {
    this.itemsState.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  clear(): void {
    this.itemsState.set([]);
  }
}

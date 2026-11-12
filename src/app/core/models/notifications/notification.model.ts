export type NotificationTone = 'success' | 'info' | 'warning' | 'error';

export interface NotificationApiItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  readAt: string | null;
  isRead: boolean;
  createdAt: string;
  aggregateId?: string | null;
}

export interface NotificationPage {
  items: NotificationApiItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AppNotification {
  id: string;
  eventType?: string;
  tone: NotificationTone;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  read: boolean;
  demandeId?: string | null;
}

export interface ToastMessage {
  id: string;
  tone: NotificationTone;
  title: string;
  message: string;
  code?: string;
  traceId?: string;
  reference?: string | null;
  status?: number;
  sticky?: boolean;
}

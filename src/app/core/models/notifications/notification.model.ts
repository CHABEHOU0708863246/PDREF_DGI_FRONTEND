export type NotificationTone = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  tone: NotificationTone;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
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

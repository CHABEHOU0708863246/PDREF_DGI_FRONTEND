export interface EmailOutboxItem {
  id: string;
  eventType: string;
  aggregateId: string | null;
  audience: string;
  recipientMasked: string | null;
  status: string;
  attempts: number;
  lastErrorCode: string | null;
  emailStatus: string | null;
  emailErrorCode: string | null;
  emailAttempts: number;
  canRetry: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface EmailOutboxPage {
  items: EmailOutboxItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface EmailTestResult {
  success: boolean;
  errorCode: string | null;
  message: string;
}

export interface AuditEvent {
  id: string;
  eventCode: string;
  phase: 'INTENT' | 'OUTCOME';
  result: string;
  occurredAt: string;
  actorUserId?: string | null;
  actorRoles: string[];
  targetType?: string | null;
  targetId?: string | null;
  requestId?: string | null;
  correlationId: string;
  traceId: string;
  channel: string;
  ipTruncated?: string | null;
  reason?: string | null;
  changes?: Record<string, string> | null;
  entryHash: string;
}

export interface AuditPage {
  items: AuditEvent[];
  nextCursor: string | null;
  pageSize: number;
}

export interface AuditFilter {
  eventCode?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  from?: string;
  to?: string;
  cursor?: string | null;
  limit?: number;
}

export const AUDIT_EVENT_CODES = [
  'AUTH.LOGIN_SUCCESS',
  'AUTH.LOGIN_FAILURE',
  'AUTH.LOCKOUT',
  'AUTH.LOGOUT',
  'AUTH.REFRESH_REUSE_DETECTED',
  'AUTH.PASSWORD_CHANGED',
  'AUTH.PASSWORD_RESET_REQUESTED',
  'AUTH.PASSWORD_RESET_DONE',
  'USER.CREATED',
  'USER.UPDATED',
  'USER.DISABLED',
  'USER.ENABLED',
  'ROLE.ASSIGNED',
  'ROLE.REVOKED',
  'ROLE.PERMISSIONS_CHANGED',
  'PERMISSION.DIRECT_GRANTED',
  'ACCESS.DENIED',
] as const;
